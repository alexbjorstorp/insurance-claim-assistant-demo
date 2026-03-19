#!/bin/bash

# Start the React frontend development server

echo "Starting EYE on Claims Frontend..."
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Error: Dependencies not installed. Run ./setup-local.sh first."
    exit 1
fi

# Start the development server
echo "Frontend starting at http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
