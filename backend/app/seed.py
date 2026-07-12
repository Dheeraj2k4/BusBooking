"""
Seed script - populates the database with demo data.

Run once with:  python -m app.seed

Creates:
  * 1 admin account and 1 customer account (known credentials),
  * a spread of buses across popular routes, types, times and prices,
    so the AI search and admin dashboard have realistic data to show.

Idempotent: if users already exist it does nothing, so you can run the
backend repeatedly without duplicating data.
"""

from datetime import datetime, time, timedelta

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.models.bus import Bus
from app.models.enums import BusType, UserRole
from app.models.user import User

# Demo credentials (documented in the README so the panel can log in).
ADMIN_EMAIL = "admin@kpitech.com"
ADMIN_PASSWORD = "admin123"
CUSTOMER_EMAIL = "customer@kpitech.com"
CUSTOMER_PASSWORD = "customer123"


def _at(days_from_today: int, hour: int, minute: int = 0) -> datetime:
    """Helper to build a departure/arrival datetime relative to today."""
    base = datetime.combine(datetime.today().date(), time(hour, minute))
    return base + timedelta(days=days_from_today)


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            print("Database already seeded - skipping.")
            return

        # --- Users ---
        db.add_all(
            [
                User(
                    name="KPi Admin",
                    email=ADMIN_EMAIL,
                    hashed_password=hash_password(ADMIN_PASSWORD),
                    role=UserRole.ADMIN,
                ),
                User(
                    name="Demo Customer",
                    email=CUSTOMER_EMAIL,
                    hashed_password=hash_password(CUSTOMER_PASSWORD),
                    role=UserRole.CUSTOMER,
                ),
            ]
        )

        # --- Buses ---
        # (operator, origin, dest, dep_day, hour, min, dur_hrs, type,
        #  total_seats, price)
        # Indian tier-1 and tier-2 city routes with real operator names.
        # Most run "tomorrow" so natural-language "tomorrow" queries match.
        # Every bus starts EMPTY (available_seats == total_seats): occupancy
        # and revenue then reflect only real bookings, keeping data consistent.
        specs = [
            # Featured route: Mumbai -> Pune
            ("Neeta Travels", "Mumbai", "Pune", 1, 6, 0, 3.5, BusType.AC, 40, 550),
            ("Zingbus", "Mumbai", "Pune", 1, 7, 0, 3.5, BusType.AC, 45, 520),
            ("VRL Travels", "Mumbai", "Pune", 1, 7, 30, 3.5, BusType.NON_AC, 50, 380),
            ("Orange Travels", "Mumbai", "Pune", 1, 8, 30, 3.5, BusType.AC, 40, 600),
            ("IntrCity SmartBus", "Mumbai", "Pune", 1, 22, 0, 4, BusType.SLEEPER, 30, 750),
            # Bangalore <-> Chennai / Mysore
            ("SRS Travels", "Bangalore", "Chennai", 1, 8, 0, 6, BusType.AC, 40, 850),
            ("KPN Travels", "Bangalore", "Chennai", 1, 23, 0, 6, BusType.SLEEPER, 32, 1000),
            ("KSRTC Airavat", "Bangalore", "Mysore", 1, 9, 0, 3, BusType.AC, 40, 400),
            # Hyderabad routes
            ("Kesineni Travels", "Hyderabad", "Bangalore", 1, 21, 0, 9, BusType.SLEEPER, 36, 1200),
            ("Orange Travels", "Hyderabad", "Vijayawada", 1, 6, 30, 5, BusType.AC, 45, 600),
            # Delhi routes
            ("Sharma Transports", "Delhi", "Jaipur", 1, 7, 0, 5.5, BusType.AC, 44, 700),
            ("Rajdhani Travels", "Delhi", "Chandigarh", 1, 8, 0, 5, BusType.AC, 44, 650),
            ("Rajasthan Travels", "Delhi", "Jaipur", 1, 15, 0, 5.5, BusType.NON_AC, 50, 500),
            # Chennai -> Coimbatore
            ("KPN Travels", "Chennai", "Coimbatore", 1, 22, 0, 7, BusType.SLEEPER, 30, 950),
            # West / others
            ("Parveen Travels", "Ahmedabad", "Surat", 1, 14, 0, 4, BusType.AC, 40, 450),
            ("Paulo Travels", "Mumbai", "Goa", 1, 19, 0, 12, BusType.SLEEPER, 30, 1400),
            ("Zingbus", "Pune", "Nagpur", 2, 20, 0, 10, BusType.SLEEPER, 30, 1100),
            ("Dolphin Travels", "Kolkata", "Bhubaneswar", 1, 21, 0, 8, BusType.SLEEPER, 34, 900),
            ("National Travels", "Indore", "Bhopal", 1, 10, 0, 4, BusType.NON_AC, 50, 350),
            ("Neeta Travels", "Pune", "Mumbai", 1, 18, 0, 3.5, BusType.AC, 40, 560),
        ]
        for operator, origin, dest, day, hour, minute, dur, btype, total, price in specs:
            dep = _at(day, hour, minute)
            db.add(
                Bus(
                    operator_name=operator,
                    origin=origin,
                    destination=dest,
                    departure_time=dep,
                    arrival_time=dep + timedelta(hours=dur),
                    bus_type=btype,
                    total_seats=total,
                    available_seats=total,
                    price=price,
                    is_active=True,
                )
            )

        db.commit()
        print("Seed complete.")
        print(f"  Admin    -> {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"  Customer -> {CUSTOMER_EMAIL} / {CUSTOMER_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
