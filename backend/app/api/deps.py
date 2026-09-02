"""
FastAPI dependencies for authentication and database sessions.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Dependency that extracts and verifies JWT bearer token to return authenticated User."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if not payload:
        raise credentials_exception

    user_sub: Optional[str] = payload.get("sub")
    if not user_sub:
        raise credentials_exception

    # Try resolving by user.id if integer, otherwise fallback to email
    user = None
    if user_sub.isdigit():
        user = db.query(User).filter(User.id == int(user_sub)).first()
    if not user:
        user = db.query(User).filter(User.email == user_sub).first()

    if not user:
        raise credentials_exception
        
    return user


def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Dependency that returns User if valid JWT is provided, otherwise None without failing."""
    if not token:
        return None
    try:
        return get_current_user(token=token, db=db)
    except HTTPException:
        return None
