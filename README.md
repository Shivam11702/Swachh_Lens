# SwachhLens

SwachhLens is a prototype AI-powered waste response decision support system for urban sanitation. It helps citizens report waste issues using mobile devices and provides municipal teams with classification, volume estimates, duplicate detection, hotspots, and suggested cleanup dispatch.

## Contents

- `backend/`: Node.js/Express backend prototype for report ingestion, ML inference stubs, and dispatch logic.
- `frontend/`: React (Vite) web dashboard for citizens and municipal teams.
- `mobile/`: Starter React Native app skeleton for capturing photos, GPS, and submitting waste reports.
- `openapi.yaml`: API contract for report submission, retrieval, triage, and operations.
- `docs/architecture.md`: Architecture overview, data flow, component responsibilities, and technology choices.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- MongoDB (local or Atlas) for the backend

### Backend and dashboard (single deployment)

1. Create a local environment file from the safe template and set the values for your environment:

```powershell
Copy-Item backend/.env.example backend/.env
```

For local development, set `MONGODB_URI` to a running MongoDB instance. For production, `JWT_SECRET` and `CORS_ORIGIN` are required; the server refuses unsafe production configuration.

The backend serves the built frontend as well as the API. To build and run everything on port 8000:

```powershell
cd backend
npm run build   # builds frontend into frontend/dist, then backend serves it
npm start       # serves dashboard at http://127.0.0.1:8000 and /api at http://127.0.0.1:8000/api
```

During development, run the frontend dev server (port 5173) which proxies `/api`, `/uploads`, and `/socket.io` to the backend:

```powershell
# terminal 1 - backend
cd backend && npm run dev

# terminal 2 - frontend
cd frontend && npm run dev
```


### Mobile App (starter)

The `mobile/` folder is a starter Expo application, not a complete production mobile client. It requests device location but still needs a real image-capture/upload flow and a configurable backend URL before it can submit reports from a physical device. See its README for the setup notes.

### Documentation

Read `docs/architecture.md` for the design, data flow, and operational concepts behind SwachhLens.
