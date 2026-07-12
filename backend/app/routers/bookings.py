"""
Booking endpoints (customer-only).

The router stays thin: it validates auth, calls the booking service, and
translates domain errors (`BookingError`) into HTTP 400 responses. All the
seat-accounting rules live in the service, not here.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_customer
from app.models.booking import Booking
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut
from app.services.booking_service import BookingError, cancel_booking, create_booking

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def book(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    try:
        return create_booking(db, user_id=current_user.id, payload=payload)
    except BookingError as exc:
        # Domain rule violation (e.g. overbooking) -> 400 Bad Request.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("", response_model=list[BookingOut])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Booking history for the logged-in customer, newest first."""
    return (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )


@router.post("/{booking_id}/cancel", response_model=BookingOut)
def cancel(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    try:
        return cancel_booking(db, user_id=current_user.id, booking_id=booking_id)
    except BookingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
