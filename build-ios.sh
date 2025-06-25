#!/bin/bash
# Build and sync iOS app

echo "Building AudioBookshelf iOS app..."

# Always run build first
echo "Running npm build..."
npm run build

# Then sync
echo "Syncing with Capacitor..."
npx cap sync ios

echo "Build and sync complete!"