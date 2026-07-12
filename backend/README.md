# Backend — KPi-Tech Bus Ticketing API

FastAPI service providing auth, bus management, booking, AI search, and admin
analytics. See the [root README](../README.md) for the full architecture and
design decisions.

## Run

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

- API base: `http://localhost:8000/api`
- Interactive docs (Swagger): `http://localhost:8000/docs`

## Environment

Copy `.env.example` to `.env`. All values have safe defaults; set `GROQ_API_KEY`
to enable Groq-powered query parsing (otherwise the rule-based parser is used).

## API overview

| Method | Endpoint                     | Auth      | Purpose |
|--------|------------------------------|-----------|---------|
| POST   | `/api/auth/register`         | –         | Register a customer |
| POST   | `/api/auth/login`            | –         | Login, returns JWT |
| GET    | `/api/auth/me`               | user      | Current user |
| GET    | `/api/buses`                 | –         | List/filter buses |
| POST   | `/api/buses`                 | admin     | Create a bus |
| PATCH  | `/api/buses/{id}`            | admin     | Update a bus |
| DELETE | `/api/buses/{id}`            | admin     | Delete a bus |
| POST   | `/api/search`                | –         | AI natural-language search |
| POST   | `/api/bookings`              | customer  | Book seats (prevents overbooking) |
| GET    | `/api/bookings`              | customer  | Booking history |
| POST   | `/api/bookings/{id}/cancel`  | customer  | Cancel + release seats |
| GET    | `/api/admin/dashboard`       | admin     | Analytics |

## Layout

```
app/
├── main.py            # app entry, CORS, router mounting, table creation
├── config.py          # settings from env / .env
├── database.py        # engine, SessionLocal, Base, get_db
├── deps.py            # get_current_user, require_admin, require_customer
├── core/security.py   # bcrypt + JWT helpers
├── models/            # SQLAlchemy ORM + enums
├── schemas/           # Pydantic request/response models
├── services/          # booking_service, ai_search, query_parser, dashboard_service
└── routers/           # auth, buses, bookings, search, admin
```
