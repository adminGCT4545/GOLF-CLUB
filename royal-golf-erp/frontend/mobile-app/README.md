# Royal Golf Club Mobile App

React Native mobile application for Royal Golf Club members.

## Features

- Member authentication and profile management
- Tee time and facility booking
- Tournament registration and tracking
- Push notifications for bookings and updates
- Real-time messaging and notifications
- Pro shop and dining services
- Member directory and social features

## Tech Stack

- React Native 0.73.6
- TypeScript
- Redux Toolkit for state management
- React Navigation for routing
- React Hook Form for forms
- Socket.IO for real-time updates
- Firebase for push notifications
- React Native Elements for UI components

## Prerequisites

- Node.js >= 18
- React Native development environment set up
- iOS: Xcode 12+
- Android: Android Studio with Android SDK

## Installation

1. Install dependencies:
```bash
npm install
```

2. iOS specific setup:
```bash
cd ios && pod install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Update .env with your configuration
```

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── screens/        # Screen components
├── navigation/     # Navigation configuration
├── services/       # API and external services
├── store/          # Redux store and slices
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── constants/      # App constants and configuration
```

## Development

- Run linter: `npm run lint`
- Run tests: `npm test`
- Type check: `npx tsc --noEmit`

## Building for Production

### iOS
```bash
cd ios
xcodebuild -workspace RoyalGolfClubMobile.xcworkspace -scheme RoyalGolfClubMobile -configuration Release
```

### Android
```bash
cd android
./gradlew assembleRelease
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request