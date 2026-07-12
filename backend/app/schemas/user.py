"""User-related request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole


class UserCreate(BaseModel):
    """Payload for registration."""

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    # Defaults to customer; the seed script creates the admin explicitly.
    role: UserRole = UserRole.CUSTOMER


class UserLogin(BaseModel):
    """Payload for login."""

    email: EmailStr
    password: str


class UserOut(BaseModel):
    """Safe public view of a user - note there is NO password field."""

    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: datetime

    # Allow building this schema directly from a SQLAlchemy model instance.
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """What the login/register endpoints return."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut
