from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.user import UserCreate, TokenResponse, LoginRequest, UserResponse
from app.crud.user import create_user, get_user_by_email, get_user_by_id
from app.core.security import verify_password, create_tokens, verify_token

router = APIRouter()

@router.post("/signup", response_model=TokenResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = create_user(db, user_data)
    tokens = create_tokens(user.id, user.email)
    
    return {
        "access_token": tokens["access_token"],
        "token_type": tokens["token_type"],
        "user": user
    }

@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, credentials.email)
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    tokens = create_tokens(user.id, user.email)
    
    return {
        "access_token": tokens["access_token"],
        "token_type": tokens["token_type"],
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        # Extract token from "Bearer <token>"
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    payload = verify_token(token)
    user = get_user_by_id(db, payload.get("user_id"))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user