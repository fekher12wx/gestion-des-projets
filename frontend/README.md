# POI FTTH — Frontend

React + TypeScript + Vite single-page application for the POI FTTH Management System.

## Stack

- **React 19** with TypeScript
- **Vite 7** for bundling and dev server
- **MUI v7** (Material UI) for UI components
- **React Router v7** for client-side routing
- **Zustand** for global state management
- **TanStack Query** for server state / data fetching
- **Chart.js / Recharts** for dashboards and data visualization
- **React Hook Form + Zod** for form validation
- **Axios** for HTTP requests

## Getting Started

```bash
# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env
# Set VITE_API_URL to point at the backend, e.g.:
# VITE_API_URL=http://localhost:5000/api/v1

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173**.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API |

## Project Structure

```
src/
├── api/          # Axios instances and API calls
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── pages/        # Route-level page components
├── store/        # Zustand state stores
├── types/        # TypeScript type definitions
└── main.tsx      # App entry point
```
