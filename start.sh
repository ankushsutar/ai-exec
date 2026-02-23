#!/bin/bash

echo "Starting AI Executive Intelligence Platform..."

# Start the backend in the background
echo "-> Starting Backend on port 3000..."
cd backend
npm start &
BACKEND_PID=$!

# Navigate back to root
cd ..

# Start the frontend in the background
echo "-> Starting Frontend on port 4200..."
cd frontend
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
