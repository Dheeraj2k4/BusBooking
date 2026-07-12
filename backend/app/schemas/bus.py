"""Bus-related request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import BusType


class BusCreate(BaseModel):
    """Admin payload to create a bus."""

    operator_name: str = Field(min_length=1, max_length=120)
    origin: str = Field(min_length=1, max_length=120)
    destination: str = Field(min_length=1, max_length=120)
    departure_time: datetime
    arrival_time: datetime
    bus_type: BusType
    total_seats: int = Field(gt=0, le=100)
    price: float = Field(gt=0)
    is_active: bool = True

    @model_validator(mode="after")
    def _check_route_and_time(self):
        # Guard against nonsensical data at the boundary.
        if self.origin.strip().lower() == self.destination.strip().lower():
            raise ValueError("origin and destination must be different")
        if self.arrival_time <= self.departure_time:
            raise ValueError("arrival_time must be after departure_time")
        return self


class BusUpdate(BaseModel):
    """Admin payload to partially update a bus. All fields optional."""

    operator_name: Optional[str] = Field(default=None, max_length=120)
    origin: Optional[str] = Field(default=None, max_length=120)
    destination: Optional[str] = Field(default=None, max_length=120)
    departure_time: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    bus_type: Optional[BusType] = None
    total_seats: Optional[int] = Field(default=None, gt=0, le=100)
    price: Optional[float] = Field(default=None, gt=0)
    is_active: Optional[bool] = None


class BusOut(BaseModel):
    """Public view of a bus, including the computed occupancy rate."""

    id: int
    operator_name: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    bus_type: BusType
    total_seats: int
    available_seats: int
    price: float
    is_active: bool
    occupancy_rate: float

    model_config = ConfigDict(from_attributes=True)
