"""
Admin dashboard analytics.

Pure read-only aggregation over bookings and buses. Kept in a service so
the admin router just returns `build_dashboard(db)` and all the SQL/counting
lives in one readable place.

Revenue only counts CONFIRMED bookings - cancelled ones are excluded so the
numbers reflect real income.
"""

from datetime import date, datetime, time

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.bus import Bus
from app.models.enums import BookingStatus
from app.schemas.dashboard import (
    BusOccupancy,
    DashboardStats,
    RouteDemand,
)


def build_dashboard(db: Session) -> DashboardStats:
    start_of_today = datetime.combine(date.today(), time.min)

    confirmed = Booking.status == BookingStatus.CONFIRMED

    # --- Today's bookings & revenue ---
    total_bookings_today = (
        db.query(func.count(Booking.id))
        .filter(confirmed, Booking.created_at >= start_of_today)
        .scalar()
        or 0
    )
    revenue_today = (
        db.query(func.coalesce(func.sum(Booking.total_price), 0.0))
        .filter(confirmed, Booking.created_at >= start_of_today)
        .scalar()
        or 0.0
    )
    revenue_total = (
        db.query(func.coalesce(func.sum(Booking.total_price), 0.0))
        .filter(confirmed)
        .scalar()
        or 0.0
    )

    active_buses = db.query(func.count(Bus.id)).filter(Bus.is_active.is_(True)).scalar() or 0

    # --- Occupancy per bus (highest first) ---
    buses = db.query(Bus).all()
    occupancy = [
        BusOccupancy(
            bus_id=b.id,
            label=f"{b.operator_name}: {b.origin} -> {b.destination}",
            occupancy_rate=b.occupancy_rate,
            total_seats=b.total_seats,
            available_seats=b.available_seats,
        )
        for b in buses
    ]
    occupancy.sort(key=lambda o: o.occupancy_rate, reverse=True)

    # --- Route-wise demand (group confirmed bookings by route) ---
    rows = (
        db.query(
            Bus.origin,
            Bus.destination,
            func.count(Booking.id),
            func.coalesce(func.sum(Booking.seats_booked), 0),
        )
        .join(Booking, Booking.bus_id == Bus.id)
        .filter(confirmed)
        .group_by(Bus.origin, Bus.destination)
        .all()
    )
    route_demand = [
        RouteDemand(
            route=f"{origin} -> {destination}",
            bookings=count,
            seats_sold=int(seats),
        )
        for origin, destination, count, seats in rows
    ]
    route_demand.sort(key=lambda r: r.seats_sold, reverse=True)

    return DashboardStats(
        total_bookings_today=total_bookings_today,
        revenue_today=round(float(revenue_today), 2),
        revenue_total=round(float(revenue_total), 2),
        active_buses=active_buses,
        buses_by_occupancy=occupancy,
        route_demand=route_demand,
    )
