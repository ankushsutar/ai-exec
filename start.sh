#!/bin/bash

echo "Starting AI Executive Intelligence Platform..."

# Clean up existing processes on targeted ports
echo "-> Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:4200 | xargs kill -9 2>/dev/null || true

# Start the backend in the background
echo "-> Starting Backend..."
cd backend
npm start &
BACKEND_PID=$!

# Navigate back to root
cd ..

# Start the frontend in the background
echo "-> Starting Frontend on port 4200..."
cd frontend
export NG_CLI_ANALYTICS=false
npm start &
FRONTEND_PID=$!

echo "========================================================"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Press [CTRL+C] to stop both services."
echo "========================================================"

# Trap SIGINT to kill both processes when the user presses Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

# Wait for both background processes to keep the script running
wait $BACKEND_PID $FRONTEND_PID
