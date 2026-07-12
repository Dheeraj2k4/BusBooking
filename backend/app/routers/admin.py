"""
Admin analytics endpoint (admin-only).

Returns the dashboard payload: today's bookings & revenue, buses ranked by
occupancy, and route-wise demand. All computation lives in the dashboard
service.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.schemas.dashboard import DashboardStats
from app.services.dashboard_service import build_dashboard

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
def dashboard(
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return build_dashboard(db)
