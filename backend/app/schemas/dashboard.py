"""Schemas for the admin analytics dashboard."""

from pydantic import BaseModel


class RouteDemand(BaseModel):
    route: str            # "Hyderabad -> Bangalore"
    bookings: int
    seats_sold: int


class BusOccupancy(BaseModel):
    bus_id: int
    label: str            # "Operator: Origin -> Destination"
    occupancy_rate: float
    total_seats: int
    available_seats: int


class DashboardStats(BaseModel):
    total_bookings_today: int
    revenue_today: float
    revenue_total: float
    active_buses: int
    buses_by_occupancy: list[BusOccupancy]
    route_demand: list[RouteDemand]
