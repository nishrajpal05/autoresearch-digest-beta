from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from ..db.database import get_db
from ..models.user import User
from ..services.auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from ..services.oauth import oauth

router = APIRouter(prefix="/auth", tags=["auth"])


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


def _extract_bearer_token(request: Request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})
    return {
        "token": token,
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
        },
    }


@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name},
    }


@router.get("/me")
def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    payload = verify_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "preferred_categories": user.preferred_categories,
    }


@router.get("/google")
async def google_login(request: Request):
    redirect_uri = (
        "https://autoresearch-digest-beta.onrender.com/auth/google/callback"
    )
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")

        email = user_info["email"]
        full_name = user_info.get("name", "")
        oauth_id = user_info["sub"]

        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                full_name=full_name,
                oauth_provider="google",
                oauth_id=oauth_id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token({"sub": str(user.id)})

        return RedirectResponse(
            url=f"https://autoresearch-frontend.onrender.com/#/auth/callback?token={jwt_token}&user={user.id}"
        )
    except Exception as e:
        return RedirectResponse(
            url=f"https://autoresearch-frontend.onrender.com/#/login?error={str(e)}"
        )


@router.get("/github")
async def github_login(request: Request):
    redirect_uri = (
        "https://autoresearch-digest-beta.onrender.com/auth/github/callback"
    )
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.github.authorize_access_token(request)

        resp = await oauth.github.get("user", token=token)
        user_info = resp.json()

        email_resp = await oauth.github.get("user/emails", token=token)
        emails = email_resp.json()
        email = next((e["email"] for e in emails if e["primary"]), None)

        if not email:
            raise Exception("No email found")

        full_name = user_info.get("name", user_info.get("login", ""))
        oauth_id = str(user_info["id"])

        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                email=email,
                full_name=full_name,
                oauth_provider="github",
                oauth_id=oauth_id,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        jwt_token = create_access_token({"sub": str(user.id)})

        return RedirectResponse(
            url=f"https://autoresearch-frontend.onrender.com/#/auth/callback?token={jwt_token}&user={user.id}"
        )
    except Exception as e:
        return RedirectResponse(
            url=f"https://autoresearch-frontend.onrender.com/#/login?error={str(e)}"
        )
