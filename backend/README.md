# SwachhLens Node.js Backend

This folder contains the Node.js/Express prototype backend for SwachhLens.

## Getting Started

1. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
2. Start the server:
   ```powershell
   npm start
   ```
3. The API will be available at `http://localhost:8000`.

## Notes

- This prototype uses in-memory storage for reports, teams, and vehicles.
- The `/reports` endpoint performs simple rule-based issue classification and priority scoring from the submitted comment.
- For production, replace the in-memory store with a database and connect media uploads to an object store.
