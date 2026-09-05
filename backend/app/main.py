from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import approvals, auth, customers, dashboard, deal_health, health, invoices, portal, products, quotations, reports, subscriptions

# Initialize FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS middleware for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(quotations.router)
app.include_router(approvals.router)
app.include_router(subscriptions.quotation_sub_router)
app.include_router(subscriptions.router)
app.include_router(invoices.quotation_invoice_router)
app.include_router(invoices.router)
app.include_router(portal.router)
app.include_router(dashboard.router)
app.include_router(deal_health.router)
app.include_router(reports.router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Welcome to DealFlow360 API. Access documentation at /docs",
        "docs": "/docs",
        "health": "/health",
        "auth": "/auth",
        "customers": "/customers",
        "products": "/products",
        "quotations": "/quotations",
        "approvals": "/approvals",
        "subscriptions": "/subscriptions",
        "invoices": "/invoices",
        "portal": "/portal",
        "dashboard": "/dashboard",
        "deal_health": "/deal-health",
        "reports": "/reports",
    }
