#!/bin/bash

# Build the frontend
npm run build

# Create production directory structure
mkdir -p dist/api

# Copy API files
cp -r api/* dist/api/

# Copy environment file
cp .env dist/api/.env

# Create Apache configuration file
echo "SetEnv OPENAI_API_KEY \"${OPENAI_API_KEY}\"" > dist/.htaccess
cat .htaccess >> dist/.htaccess

echo "Build complete! Upload the contents of the dist directory to your Apache server."