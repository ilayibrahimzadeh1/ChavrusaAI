#!/bin/bash

echo "🚀 Starting ChavrusaAI Development Environment"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example"
    cp .env.example .env
    echo "⚠️  Please configure your OpenAI API key in .env file"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing server dependencies..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Start both servers
echo "🔧 Starting backend server on port 8081..."
npm run dev &
BACKEND_PID=$!

echo "🎨 Starting frontend server on port 3003..."
cd client && npm run dev &
FRONTEND_PID=$!

# Function to handle cleanup
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "✅ ChavrusaAI is running!"
echo "📱 Frontend: http://localhost:3003"
echo "🔧 Backend: http://localhost:8081"
echo "Press Ctrl+C to stop"

# Wait for processes
wait