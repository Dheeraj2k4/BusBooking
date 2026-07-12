"""
Schemas for the AI-powered natural-language search.

The flow is:
  1. Customer sends free text -> `NaturalSearchRequest`.
  2. The AI service extracts structured filters (see services/ai_search.py).
  3. We query buses, rank them, and return `SearchResponse`.

`interpreted` echoes back what the AI understood, so the UI can show
"We searched: Hyderabad -> Bangalore, tomorrow morning, AC" and the
candidate can visibly demonstrate the parsing during the demo.
"""

from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.bus import BusOut


class NaturalSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class InterpretedQuery(BaseModel):
    """The structured filters extracted from the natural-language query."""

    origin: Optional[str] = None
    destination: Optional[str] = None
    travel_date: Optional[str] = None          # ISO date (YYYY-MM-DD)
    time_of_day: Optional[str] = None          # morning/afternoon/evening/night
    bus_type: Optional[str] = None             # AC / Non-AC / Sleeper
    max_price: Optional[float] = None
    source: str = "rule-based"                 # "groq" or "rule-based"


class SearchResult(BaseModel):
    """A single matched bus plus why it ranked where it did."""

    bus: BusOut
    relevance_score: float
    match_reasons: list[str]


class SearchResponse(BaseModel):
    interpreted: InterpretedQuery
    results: list[SearchResult]
