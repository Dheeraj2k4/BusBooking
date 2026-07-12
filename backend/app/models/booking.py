"""
Booking model: a customer's reservation of one or more seats on a bus.

We snapshot `total_price` at booking time so later price changes on the
bus do not retroactively alter historical bookings or revenue reports.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import BookingStatus


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    bus_id: Mapped[int] = mapped_column(ForeignKey("buses.id"), nullable=False)

    # Passenger details captured at booking time.
    passenger_name: Mapped[str] = mapped_column(String(120), nullable=False)
    passenger_age: Mapped[int] = mapped_column(Integer, nullable=False)
    passenger_gender: Mapped[str] = mapped_column(String(20), nullable=False)

    seats_booked: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="bookings")
    bus = relationship("Bus", back_populates="bookings")
