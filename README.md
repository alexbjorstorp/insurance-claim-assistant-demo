# Insurance Claim Assistant

A web application for insurance claim management with intelligent signal monitoring and case analysis.

## Architecture

- **Backend**: Python 3.11 + FastAPI + SQLAlchemy + SQLite
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Database**: SQLite (local file-based)
- **Language**: Dutch (Nederlands)

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Setup (First Time Only)

```bash
# Run the setup script
chmod +x setup-local.sh
./setup-local.sh
```

This will:
- Create Python virtual environment
- Install backend dependencies
- Run database migrations
- Install frontend dependencies
- Create configuration files

### 2. Start the Application

**Option A: Using convenience scripts**
```bash
# Terminal 1 - Start Backend
./start-backend.sh

# Terminal 2 - Start Frontend
./start-frontend.sh
```

**Option B: Manual start**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### 3. Login

Default users:
- **Username**: HaasT | **Password**: haas123
- **Username**: JongM | **Password**: jong123


## Features

### Home Page
- **Uitgelichte Dossiers**: Featured cases based on 5 priority rules
  1. High number of open signals (≥3)
  2. Signal past deadline (>30 days)
  3. High impact medical advice
  4. Inactief dossier signal
  5. VSO binnengekomen
- **Signal Board**: Real-time monitoring across 5 categories (Medisch, Aansprakelijkheid, Datakwaliteit, Fraude, Proces)
- **Global Search**: Search across all cases with dropdown results
- **Dark Mode**: Theme toggle with persistence

### Case Detail Page
- **Complete Dossier Information**: All case details in organized sidebar
- **Timeline**: Filterable case history with color-coded categories
- **Signal Tabs**: Category-specific signal views with urgency indicators
- **Comparable Cases**: Similar cases with match percentages
- **Communication History**: Detailed communication logs with metadata

### Data & Features
- 20 realistic cases (SD10001-SD10020)
- 101+ signals across 5 categories
- 166 timeline entries
- 56 communication records
- 40 comparable cases
- User-specific filtering on home page
- Global access to all case details

## Project Structure

```
.
├── backend/
│   ├── alembic/              # Database migrations
│   ├── app/
│   │   ├── api/              # REST API endpoints
│   │   │   └── v1/           # API version 1
│   │   ├── core/             # Config, security, database
│   │   ├── models/           # SQLAlchemy models
│   │   └── schemas/          # Pydantic schemas
│   ├── data_scripts/         # Data generation scripts
│   ├── scripts/              # Utility scripts
│   ├── insurance_claims.db   # SQLite database
│   └── requirements.txt
├── frontend/
│   ├── public/
│   │   └── Logo/             # Application logo
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API client
│   │   └── App.tsx
│   └── package.json
├── data/                     # CSV import files
├── setup-local.sh            # Setup script
├── start-backend.sh          # Backend start script
├── start-frontend.sh         # Frontend start script
└── README.md                 # This file
```

## API Documentation

Interactive API documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc).

### Main Endpoints

- `GET /api/v1/cases` - List cases (with filters: uitgelicht_only, assigned_to_id)
- `GET /api/v1/cases/search` - Global search across all cases
- `GET /api/v1/cases/{id}` - Get case details
- `POST /api/v1/cases` - Create case
- `PUT /api/v1/cases/{id}` - Update case
- `GET /api/v1/signals` - List signals (with filters: my_cases_only, category, case_id)
- `GET /api/v1/timeline` - List timeline entries (with filter: case_id)
- `GET /api/v1/comparable-cases` - List comparable cases (with filter: case_id)
- `GET /api/v1/communications` - List communications (with filter: case_id)
- `POST /api/v1/auth/login` - Login

## Environment Variables

### Backend (.env)

```bash
DATABASE_URL=sqlite:///./insurance_claims.db
SECRET_KEY=dev-secret-key-change-in-production
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:8000
```

## Development Notes

### Current Database State
- Using SQLite for local development
- 20 cases with Dutch victim names
- 2 users (HaasT, JongM)
- Comprehensive signal, timeline, and communication data

### Known Issues
- `is_uitgelicht` column does not exist in database (backend code references it but functionality not fully implemented)

## Testing

```bash
# Backend tests
cd backend
source venv/bin/activate
pytest

# Frontend tests
cd frontend
npm test
```

## Production Migration

This application uses SQLite for local development. For production deployment:

1. Update `DATABASE_URL` to production PostgreSQL
2. Run migrations with `alembic upgrade head`
3. Set strong `SECRET_KEY`
4. Enable HTTPS/TLS
5. Configure reverse proxy (nginx/traefik)
6. Set up CI/CD pipeline
7. Enable production logging and monitoring
8. Review and implement the uitgelichte functionality properly

## Backup & Recovery

A backup was created on 29 January 2026 at 17:24:
- Location: `../Insurance_Claim_Assistant_backup_20260129_172408.tar.gz`
- Contains: Complete project snapshot before cleanup

## License

Proprietary - Demo Application
