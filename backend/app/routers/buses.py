"""
Bus endpoints.

Read endpoints (list one / list many) are public so customers can browse.
Write endpoints (create/update/delete) are admin-only via `require_admin`.
This is where the RESTful status codes live: 201 on create, 404 when a bus
id doesn't exist, 204 on delete.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models.booking import Booking
from app.models.bus import Bus
from app.models.enums import BookingStatus, BusType
from app.schemas.bus import BusCreate, BusOut, BusUpdate

router = APIRouter(prefix="/buses", tags=["buses"])


def _get_bus_or_404(db: Session, bus_id: int) -> Bus:
    bus = db.query(Bus).filter(Bus.id == bus_id).first()
    if bus is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bus not found")
    return bus


@router.get("", response_model=list[BusOut])
def list_buses(
    db: Session = Depends(get_db),
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    bus_type: Optional[BusType] = None,
    only_available: bool = Query(False, description="Only buses with free seats"),
):
    """Public listing with simple, explicit filters (used by both roles)."""
    q = db.query(Bus)
    if origin:
        q = q.filter(Bus.origin.ilike(f"%{origin}%"))
    if destination:
        q = q.filter(Bus.destination.ilike(f"%{destination}%"))
    if bus_type:
        q = q.filter(Bus.bus_type == bus_type)
    if only_available:
        q = q.filter(Bus.is_active.is_(True), Bus.available_seats > 0)
    return q.order_by(Bus.departure_time).all()


@router.get("/{bus_id}", response_model=BusOut)
def get_bus(bus_id: int, db: Session = Depends(get_db)):
    return _get_bus_or_404(db, bus_id)


@router.post("", response_model=BusOut, status_code=status.HTTP_201_CREATED)
def create_bus(
    payload: BusCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    bus = Bus(
        **payload.model_dump(exclude={"total_seats"}),
        total_seats=payload.total_seats,
        # A brand-new bus starts with all seats available.
        available_seats=payload.total_seats,
    )
    db.add(bus)
    db.commit()
    db.refresh(bus)
    return bus


@router.patch("/{bus_id}", response_model=BusOut)
def update_bus(
    bus_id: int,
    payload: BusUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    bus = _get_bus_or_404(db, bus_id)
    updates = payload.model_dump(exclude_unset=True)

    # If total_seats changes, adjust available_seats by the same delta so we
    # never lose track of already-booked seats.
    if "total_seats" in updates:
        seats_sold = bus.total_seats - bus.available_seats
        new_total = updates["total_seats"]
        if new_total < seats_sold:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot set total below {seats_sold} already-booked seats",
            )
        bus.available_seats = new_total - seats_sold

    for field, value in updates.items():
        setattr(bus, field, value)

    db.commit()
    db.refresh(bus)
    return bus


@router.delete("/{bus_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bus(
    bus_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    bus = _get_bus_or_404(db, bus_id)

    # Block deletion only if the bus has ACTIVE (Confirmed) bookings - those
    # represent real seats sold, so we guide the admin to deactivate instead.
    # Cancelled bookings are just history and are safe to remove with the bus.
    active_booking = (
        db.query(Booking)
        .filter(Booking.bus_id == bus_id, Booking.status == BookingStatus.CONFIRMED)
        .first()
    )
    if active_booking is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a bus with active bookings. Set it inactive instead.",
        )

    # Remove any cancelled booking rows first so the FK constraint is satisfied.
    db.query(Booking).filter(Booking.bus_id == bus_id).delete(synchronize_session=False)
    db.delete(bus)
    db.commit()
