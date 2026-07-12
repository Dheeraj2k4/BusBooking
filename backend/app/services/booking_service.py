"""
Booking business logic.

Why a service instead of putting this in the router?
  * The overbooking rule and seat accounting are the heart of the domain.
    Isolating them makes the logic easy to read, test, and reason about.
  * Routers stay thin: they handle HTTP, this handles the "what".

Key invariants enforced here:
  * A confirmed booking decrements `available_seats`.
  * You cannot book more seats than are available (no overbooking).
  * Cancelling a booking releases the seats back exactly once.
"""

from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.bus import Bus
from app.models.enums import BookingStatus
from app.schemas.booking import BookingCreate


class BookingError(Exception):
    """Raised for domain rule violations; the router maps this to HTTP 400."""


def create_booking(db: Session, *, user_id: int, payload: BookingCreate) -> Booking:
    # `with_for_update()` locks the bus row for the duration of the
    # transaction on databases that support it (e.g. Postgres), which is
    # the correct way to prevent two concurrent bookings from overselling
    # the last seats. SQLite serialises writes so it is safe here too.
    bus = (
        db.query(Bus)
        .filter(Bus.id == payload.bus_id)
        .with_for_update()
        .first()
    )

    if bus is None:
        raise BookingError("Bus not found")
    if not bus.is_active:
        raise BookingError("This bus is not available for booking")
    if bus.available_seats <= 0:
        raise BookingError("This bus is fully booked")
    if payload.seats_booked > bus.available_seats:
        raise BookingError(
            f"Only {bus.available_seats} seat(s) left on this bus"
        )

    booking = Booking(
        user_id=user_id,
        bus_id=bus.id,
        passenger_name=payload.passenger_name,
        passenger_age=payload.passenger_age,
        passenger_gender=payload.passenger_gender,
        seats_booked=payload.seats_booked,
        total_price=round(bus.price * payload.seats_booked, 2),
        status=BookingStatus.CONFIRMED,
    )

    # Decrement availability in the same transaction as the insert, so the
    # seat count and the booking are always consistent.
    bus.available_seats -= payload.seats_booked

    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


def cancel_booking(db: Session, *, user_id: int, booking_id: int) -> Booking:
    booking = (
        db.query(Booking)
        .filter(Booking.id == booking_id, Booking.user_id == user_id)
        .first()
    )
    if booking is None:
        raise BookingError("Booking not found")
    if booking.status == BookingStatus.CANCELLED:
        raise BookingError("Booking is already cancelled")

    # Release the seats back to the bus.
    bus = db.query(Bus).filter(Bus.id == booking.bus_id).with_for_update().first()
    if bus is not None:
        bus.available_seats = min(
            bus.total_seats, bus.available_seats + booking.seats_booked
        )

    booking.status = BookingStatus.CANCELLED
    db.commit()
    db.refresh(booking)
    return booking
