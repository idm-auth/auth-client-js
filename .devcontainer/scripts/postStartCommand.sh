#!/bin/bash
set -e

echo "Post-start script started"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo "Post-start script completed"
