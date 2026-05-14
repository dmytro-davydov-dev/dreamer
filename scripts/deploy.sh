#!/bin/bash
set -e

echo "Building..."
yarn build

echo "Deploying to Firebase Hosting..."
npx firebase-tools deploy --only hosting

echo "Done!"
