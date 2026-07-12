"""
Schema package.

Pydantic "schemas" are the API contract. They are SEPARATE from the
SQLAlchemy models on purpose:
  * Models = how data is stored (DB columns, relationships).
  * Schemas = what the API accepts and returns (validation + shape).

This separation lets us hide fields like `hashed_password` from clients
and validate incoming JSON before it ever touches the database.
"""

from app.schemas.user import UserCreate, UserLogin, UserOut, Token
from app.schemas.bus import BusCreate, BusUpdate, BusOut
from app.schemas.booking import BookingCreate, BookingOut
from app.schemas.search import NaturalSearchRequest, SearchResult, SearchResponse

__all__ = [
    "UserCreate",
    "UserLogin",
    "UserOut",
    "Token",
    "BusCreate",
    "BusUpdate",
    "BusOut",
    "BookingCreate",
    "BookingOut",
    "NaturalSearchRequest",
    "SearchResult",
    "SearchResponse",
]
