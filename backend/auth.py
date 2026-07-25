import os
import hashlib
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_user_by_id

JWT_SECRET = os.getenv("JWT_SECRET", "nova-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

security = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    # simple hashing with SHA256 (no salt for simplicity, but instruction mentioned "+ salt", let's add a fixed salt or random)
    salt = "nova-salt"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode = {"sub": str(user_id), "email": email, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        email = payload.get("email")
        if user_id is None or email is None:
            return None
        return {"user_id": user_id, "email": email}
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials | None = Security(security)):
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = await get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
