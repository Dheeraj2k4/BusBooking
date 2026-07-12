"""
Deterministic rule-based query parser (the AI fallback).

This module extracts structured travel filters from free text WITHOUT
any external API. It guarantees the natural-language search still works
when the Groq API key is missing, the network is down, or the model
errors. During the demo this is a strong talking point: the system
degrades gracefully instead of breaking.

It understands things like:
  "bus from Hyderabad to Bangalore tomorrow morning, AC under 900"
"""

import re
from datetime import date, datetime, timedelta
from typing import Optional

from app.schemas.search import InterpretedQuery

# Time-of-day keywords -> canonical bucket.
_TIME_BUCKETS = {
    "morning": "morning",
    "afternoon": "afternoon",
    "evening": "evening",
    "night": "night",
    "midnight": "night",
    "noon": "afternoon",
}

# Weekday name -> Python weekday index (Monday = 0).
_WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}


def _parse_bus_type(text: str) -> Optional[str]:
    # Order matters: check "non-ac"/"sleeper" before the bare "ac".
    if re.search(r"non[\s-]?ac", text):
        return "Non-AC"
    if "sleeper" in text:
        return "Sleeper"
    if re.search(r"\bac\b", text) or "a/c" in text:
        return "AC"
    return None


def _parse_date(text: str) -> Optional[str]:
    today = date.today()
    if "day after tomorrow" in text:
        return (today + timedelta(days=2)).isoformat()
    if "tomorrow" in text:
        return (today + timedelta(days=1)).isoformat()
    if "today" in text or "tonight" in text:
        return today.isoformat()

    # "next monday", "on friday", etc. -> the next matching weekday.
    for name, idx in _WEEKDAYS.items():
        if name in text:
            days_ahead = (idx - today.weekday() + 7) % 7
            days_ahead = days_ahead or 7  # always a future day
            return (today + timedelta(days=days_ahead)).isoformat()

    # Explicit date like 2026-07-12 or 12/07/2026.
    iso = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if iso:
        return iso.group(1)
    return None


def _parse_time_of_day(text: str) -> Optional[str]:
    for keyword, bucket in _TIME_BUCKETS.items():
        if keyword in text:
            return bucket
    return None


def _parse_max_price(text: str) -> Optional[float]:
    # "under 500", "below 800", "less than 1000", "within 700".
    match = re.search(
        r"(?:under|below|less than|within|max|upto|up to|cheaper than)\s*(?:rs\.?|inr|₹)?\s*(\d+)",
        text,
    )
    if match:
        return float(match.group(1))
    return None


def _parse_route(text: str) -> tuple[Optional[str], Optional[str]]:
    """Extract origin/destination from 'from X to Y' or 'X to Y'."""
    # Prefer the explicit "from ... to ..." form.
    m = re.search(r"from\s+([a-z\s]+?)\s+to\s+([a-z\s]+?)(?:\s|$|,|\.)", text)
    if not m:
        m = re.search(r"\b([a-z]+)\s+to\s+([a-z]+)\b", text)
    if m:
        origin = m.group(1).strip().title()
        destination = m.group(2).strip().title()
        return origin, destination
    return None, None


def parse_query(query: str) -> InterpretedQuery:
    """Turn free text into structured filters using only local rules."""
    text = query.lower().strip()
    origin, destination = _parse_route(text)
    return InterpretedQuery(
        origin=origin,
        destination=destination,
        travel_date=_parse_date(text),
        time_of_day=_parse_time_of_day(text),
        bus_type=_parse_bus_type(text),
        max_price=_parse_max_price(text),
        source="rule-based",
    )
