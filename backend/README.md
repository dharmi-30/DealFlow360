# DealFlow360 Backend

FastAPI backend for DealFlow360 investment and deal flow tracking platform.

## Architecture & Tech Stack

- **Framework**: FastAPI (Python 3.12+)
- **Database ORM**: SQLAlchemy 2.0
- **Database**: PostgreSQL
- **Data Validation & Settings**: Pydantic v2 & Pydantic-Settings
- **Authentication**: JWT (PyJWT) & Passlib (Bcrypt password hashing)
- **ASGI Server**: Uvicorn

## Folder Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI application initialization & middleware
│   ├── core/
│   │   ├── config.py    # Environment settings & configuration loading
│   │   └── security.py  # Password hashing & JWT token generation/validation
│   ├── db/
│   │   ├── database.py  # SQLAlchemy engine, session maker, & Base ORM class
│   │   └── models.py    # SQLAlchemy database models
│   ├── schemas/         # Pydantic request/response validation schemas
│   ├── routers/         # API endpoints & route handlers
│   └── services/        # Business logic layer
├── requirements.txt     # Python dependencies
├── .env.example         # Environment variable template
└── README.md            # Backend documentation
```

## Setup & Local Development

### 1. Create and activate a Virtual Environment

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and set your credentials:

```bash
cp .env.example .env
```

Configuration variables:
- `DATABASE_URL`: PostgreSQL connection string (`postgresql://user:password@localhost:5432/dealflow360`)
- `JWT_SECRET`: Secret key used for signing JWT access tokens
- `JWT_ALGORITHM`: JWT signing algorithm (Default: `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time for access tokens in minutes (Default: `60`)

### 4. Run the Application

Start the FastAPI development server from the `backend/` directory:

```bash
uvicorn app.main:app --reload
```

The API server will be available at `http://127.0.0.1:8000`.

## API Endpoints & Swagger Documentation

- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check Endpoint**: `GET /health` -> `{"status": "ok"}`
