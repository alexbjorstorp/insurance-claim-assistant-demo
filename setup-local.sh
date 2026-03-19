#!/bin/bash

# EYE on Claims - Local Setup (No Docker)
# Uses SQLite instead of PostgreSQL

set -e

echo "=========================================="
echo "EYE on Claims - Local Setup"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11 or higher."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

print_step "Setting up Backend..."

cd backend

# Create .env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ Created backend/.env"
else
    print_warning "backend/.env already exists"
fi

# Create virtual environment
if [ ! -d "venv" ]; then
    print_step "Creating Python virtual environment..."
    python3 -m venv venv
    echo "✓ Created virtual environment"
else
    print_warning "Virtual environment already exists"
fi

# Activate virtual environment and install dependencies
print_step "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

# Run migrations
print_step "Running database migrations..."
alembic upgrade head

# Seed demo data
print_step "Seeding demo data..."
python -m app.scripts.seed_data

# Generate sample Excel
print_step "Generating sample Excel file..."
python -m app.scripts.generate_sample_data

deactivate

cd ..

print_step "Setting up Frontend..."

cd frontend

# Create .env file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ Created frontend/.env"
else
    print_warning "frontend/.env already exists"
fi

# Install dependencies
print_step "Installing Node.js dependencies..."
npm install

cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    uvicorn app.main:app --reload"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend"
echo "    npm run dev"
echo ""
echo "Then visit: http://localhost:5173"
echo ""
echo "Demo credentials:"
echo "  Admin: admin / admin123"
echo "  Handler: handler / handler123"
echo "  Viewer: viewer / viewer123"
echo ""
echo "Or use the quick start scripts:"
echo "  ./start-backend.sh    (in one terminal)"
echo "  ./start-frontend.sh   (in another terminal)"
echo ""
