"""
Security helpers: password hashing and JWT tokens.

Kept in one small module so the auth rules live in a single place:
  * `hash_password` / `verify_password` - bcrypt, never store plain text.
  * `create_access_token` - signs a JWT containing the user id + role.
  * `decode_access_token` - verifies and unpacks a JWT.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from app.config import settings

# bcrypt is the industry standard for password storage. We use the bcrypt
# library directly (passlib is unmaintained and breaks with bcrypt 5.x).
# bcrypt only hashes the first 72 bytes, so we truncate to stay within that.
_BCRYPT_MAX_BYTES = 72


def _to_bytes(password: str) -> bytes:
    return password.encode("utf-8")[:_BCRYPT_MAX_BYTES]


def hash_password(plain_password: str) -> str:
    hashed = bcrypt.hashpw(_to_bytes(plain_password), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            _to_bytes(plain_password), hashed_password.encode("utf-8")
        )
    except ValueError:
        return False


def create_access_token(*, user_id: int, role: str) -> str:
    """Create a signed JWT. `sub` (subject) is the user id per JWT convention."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """Return the token payload, or None if the token is invalid/expired."""
    try:
        return jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
    except JWTError:
        return None
