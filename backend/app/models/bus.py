"""
Bus model: a scheduled service that customers can book seats on.

`total_seats` never changes; `available_seats` is decremented on booking
and incremented on cancellation. Keeping a live `available_seats` counter
lets us prevent overbooking with a single cheap check.
"""

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import BusType


class Bus(Base):
    __tablename__ = "buses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    operator_name: Mapped[str] = mapped_column(String(120), nullable=False)

    # Route
    origin: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    destination: Mapped[str] = mapped_column(String(120), index=True, nullable=False)

    # Schedule
    departure_time: Mapped[datetime] = mapped_column(DateTime, index=True, nullable=False)
    arrival_time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Details
    bus_type: Mapped[BusType] = mapped_column(Enum(BusType), nullable=False)
    total_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    available_seats: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    # Admin can toggle a bus off-sale without deleting it.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    bookings = relationship("Booking", back_populates="bus")

    @property
    def occupancy_rate(self) -> float:
        """Percentage of seats sold (0-100). Used by the admin dashboard."""
        if self.total_seats == 0:
            return 0.0
        sold = self.total_seats - self.available_seats
        return round((sold / self.total_seats) * 100, 1)
