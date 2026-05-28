from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import analytics, auth, budgets, gmail, imports, profile, settings as settings_router, transactions
from app.core.config import get_settings
from app.db.session import Base, engine

app_settings = get_settings()

app = FastAPI(title=app_settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[app_settings.frontend_base_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok", "environment": app_settings.environment}


app.include_router(auth.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(gmail.router, prefix="/api")
app.include_router(imports.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
