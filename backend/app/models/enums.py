"""
Enumerations shared across models and schemas.

Using Python `str, Enum` classes gives us:
  * a single source of truth for allowed values,
  * automatic validation in Pydantic schemas,
  * readable values in the database and JSON responses.
"""

from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"


class BusType(str, Enum):
    AC = "AC"
    NON_AC = "Non-AC"
    SLEEPER = "Sleeper"


class BookingStatus(str, Enum):
    CONFIRMED = "Confirmed"
    CANCELLED = "Cancelled"
