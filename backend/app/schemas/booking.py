"""Booking-related request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookingStatus
from app.schemas.bus import BusOut


class BookingCreate(BaseModel):
    """Customer payload to book seats on a bus."""

    bus_id: int
    passenger_name: str = Field(min_length=1, max_length=120)
    passenger_age: int = Field(gt=0, lt=120)
    passenger_gender: str = Field(min_length=1, max_length=20)
    seats_booked: int = Field(default=1, gt=0, le=10)


class BookingOut(BaseModel):
    """Public view of a booking. Embeds the bus so the UI can show route."""

    id: int
    bus_id: int
    passenger_name: str
    passenger_age: int
    passenger_gender: str
    seats_booked: int
    total_price: float
    status: BookingStatus
    created_at: datetime
    bus: BusOut

    model_config = ConfigDict(from_attributes=True)
