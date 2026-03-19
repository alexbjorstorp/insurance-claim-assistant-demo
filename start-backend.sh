#!/bin/bash

# Start the FastAPI backend server

echo "Starting EYE on Claims Backend..."
echo ""

cd backend

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "Error: Virtual environment not found. Run ./setup-local.sh first."
    exit 1
fi

# Start the server
echo "Backend API starting at http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
