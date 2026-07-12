"""
Model package.

Importing every model here means that a single
`from app import models` (or importing this package) registers all
tables on `Base.metadata`, which is what `create_all` needs to build
the schema.
"""

from app.models.user import User
from app.models.bus import Bus
from app.models.booking import Booking

__all__ = ["User", "Bus", "Booking"]
