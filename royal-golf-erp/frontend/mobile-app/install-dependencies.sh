#!/bin/bash

echo "Installing missing dependencies for tee time booking feature..."

# Install required packages
npm install react-native-qrcode-svg
npm install react-native-svg  # Peer dependency for QR code
npm install expo-calendar
npm install @react-native-community/datetimepicker
npm install react-native-super-grid  # For better grid layouts (optional)

echo "Dependencies installed successfully!"
echo "Don't forget to run 'cd ios && pod install' if you're on iOS"