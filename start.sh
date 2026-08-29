#!/bin/bash

# Navigate to the workspace root
cd "$(dirname "$0")"

echo "====================================================="
echo "               Starting UniScout                     "
echo "====================================================="

# 1. Ensure write permissions on project directories
echo "Ensuring file and directory permissions..."
chmod -R u+w backend frontend 2>/dev/null

# 2. Make node_modules binaries executable
chmod +x backend/node_modules/.bin/* 2>/dev/null
chmod +x frontend/node_modules/.bin/* 2>/dev/null

# 3. Create .env if missing
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "Created backend/.env from backend/.env.example"
    fi
fi

# 4. Check node_modules existence and install if missing
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    (cd backend && npm install)
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    (cd frontend && npm install)
fi

# 5. Start both servers concurrently
echo "Starting backend and frontend services..."
npx concurrently \
  --names "BACKEND,FRONTEND" \
  --prefix "name" \
  --prefix-colors "yellow,cyan" \
  "cd backend && npm start" \
  "cd frontend && npm run dev"
