"""
AI-powered search orchestration.

Two responsibilities:
  1. INTERPRET  - turn the customer's sentence into structured filters.
                  Try Groq first; if the key is missing or the call
                  fails, fall back to the local rule-based parser.
  2. RANK       - query candidate buses and score them by how well they
                  match the interpreted intent, returning the best first.

Keeping interpretation and ranking together (but separate from the
router) means the endpoint is a thin wrapper and this logic is testable
in isolation.
"""

import json
from datetime import date, datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.bus import Bus
from app.schemas.search import InterpretedQuery, SearchResponse, SearchResult
from app.services.query_parser import parse_query

# Map a time-of-day bucket to an (inclusive) hour range for matching.
_TIME_RANGES = {
    "morning": (4, 11),
    "afternoon": (12, 16),
    "evening": (17, 20),
    "night": (21, 3),  # wraps past midnight
}


# --------------------------------------------------------------------------- #
# 1. INTERPRET
# --------------------------------------------------------------------------- #
def _interpret_with_groq(query: str) -> Optional[InterpretedQuery]:
    """Ask Groq to extract filters as JSON. Returns None on any failure."""
    if not settings.GROQ_API_KEY:
        return None

    try:
        # Imported lazily so the app still starts without the package/key.
        from openai import OpenAI

        client = OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
        )

        system_prompt = (
            "You extract structured bus-search filters from a user's message. "
            f"Today's date is {date.today().isoformat()}. "
            "Respond with ONLY a compact JSON object using these keys: "
            "origin (city string or null), destination (city string or null), "
            "travel_date (YYYY-MM-DD or null), "
            "time_of_day (one of morning/afternoon/evening/night or null), "
            "bus_type (one of AC/Non-AC/Sleeper or null), "
            "max_price (number or null). "
            "Resolve relative dates like 'tomorrow' using today's date."
        )

        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        data = json.loads(completion.choices[0].message.content)
        return InterpretedQuery(
            origin=data.get("origin"),
            destination=data.get("destination"),
            travel_date=data.get("travel_date"),
            time_of_day=data.get("time_of_day"),
            bus_type=data.get("bus_type"),
            max_price=data.get("max_price"),
            source="groq",
        )
    except Exception:
        # Any problem (bad key, network, malformed JSON) -> use fallback.
        return None


def interpret_query(query: str) -> InterpretedQuery:
    """Groq first, deterministic parser as a guaranteed fallback."""
    return _interpret_with_groq(query) or parse_query(query)


# --------------------------------------------------------------------------- #
# 2. RANK
# --------------------------------------------------------------------------- #
def _hour_in_range(hour: int, bucket: str) -> bool:
    start, end = _TIME_RANGES[bucket]
    if start <= end:
        return start <= hour <= end
    return hour >= start or hour <= end  # night wraps midnight


def _score_bus(bus: Bus, f: InterpretedQuery) -> tuple[float, list[str]]:
    """Return a relevance score and human-readable reasons for a bus."""
    score = 0.0
    reasons: list[str] = []

    if f.travel_date:
        try:
            if bus.departure_time.date() == date.fromisoformat(f.travel_date):
                score += 3
                reasons.append(f"Departs on {f.travel_date}")
        except ValueError:
            pass

    if f.time_of_day and f.time_of_day in _TIME_RANGES:
        if _hour_in_range(bus.departure_time.hour, f.time_of_day):
            score += 2
            reasons.append(f"Leaves in the {f.time_of_day}")

    if f.bus_type and bus.bus_type.value.lower() == f.bus_type.lower():
        score += 2
        reasons.append(f"{bus.bus_type.value} bus")

    if f.max_price is not None and bus.price <= f.max_price:
        score += 1
        reasons.append(f"Within budget (Rs.{bus.price:.0f})")

    # Tiny tiebreaker: prefer buses with more seats free.
    score += min(bus.available_seats, 10) * 0.01
    return score, reasons


def search_buses(db: Session, query: str) -> SearchResponse:
    interpreted = interpret_query(query)

    # Base candidates: bookable buses only (active + seats free).
    q = db.query(Bus).filter(Bus.is_active.is_(True), Bus.available_seats > 0)

    # Route is the strongest signal, so apply it as a filter when present.
    if interpreted.origin:
        q = q.filter(Bus.origin.ilike(f"%{interpreted.origin}%"))
    if interpreted.destination:
        q = q.filter(Bus.destination.ilike(f"%{interpreted.destination}%"))

    candidates = q.all()

    scored: list[SearchResult] = []
    for bus in candidates:
        score, reasons = _score_bus(bus, interpreted)
        if interpreted.origin or interpreted.destination:
            reasons.insert(0, f"Route {bus.origin} -> {bus.destination}")
        scored.append(
            SearchResult(bus=bus, relevance_score=round(score, 2), match_reasons=reasons)
        )

    # Highest relevance first; break ties with the earliest departure.
    scored.sort(
        key=lambda r: (r.relevance_score, -r.bus.departure_time.timestamp()),
        reverse=True,
    )

    return SearchResponse(interpreted=interpreted, results=scored)
