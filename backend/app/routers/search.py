"""
AI natural-language search endpoint.

Public on purpose: browsing/searching shouldn't require login. The heavy
lifting (interpret + rank) is delegated to the ai_search service so this
file is a one-line wrapper.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.search import NaturalSearchRequest, SearchResponse
from app.services.ai_search import search_buses

router = APIRouter(prefix="/search", tags=["search"])


@router.post("", response_model=SearchResponse)
def natural_language_search(
    payload: NaturalSearchRequest,
    db: Session = Depends(get_db),
):
    """
    Accepts free text like:
      "I need a bus from Hyderabad to Bangalore tomorrow morning, preferably AC"
    Returns the interpreted filters plus ranked, bookable buses.
    """
    return search_buses(db, payload.query)
