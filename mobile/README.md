# SwachhLens Mobile Prototype

This folder contains a starter React Native application scaffold for SwachhLens.

## Current features
- Requests device location
- Captures a text comment

## Run the app

1. Install dependencies:
   ```powershell
   cd mobile
   npm install
   ```
2. Start Expo:
   ```powershell
   npm start
   ```
3. Open the app in Expo Go on your device or emulator.

## Important limitations

This is a UI starter, not a complete reporting client yet. The backend accepts report creation at `POST /api/reports` as `multipart/form-data` with one or more real image files. Before enabling report submission from a device, add an Expo image-picker or camera flow and submit the selected image files with `FormData`.

When testing on a physical phone, `localhost` and `127.0.0.1` refer to the phone, not your computer. Use your computer's LAN IP address and ensure the backend is reachable from the device.
