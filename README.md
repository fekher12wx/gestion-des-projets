# 📡 POI FTTH Management System

A full-stack web application for managing **Point of Interest (POI)** files across **Fiber-to-the-Home (FTTH)** deployment projects. It streamlines the lifecycle tracking of study dossiers — from reception through validation and closure — with role-based access control, real-time alerts, and Excel import/export capabilities.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, MUI v7, React Router v7, Zustand, TanStack Query, Chart.js / Recharts |
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **File Handling** | Multer (uploads), xlsx (Excel import/export) |

---

## 📁 Project Structure

```
.
├── backend/          # Express + Prisma REST API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── .env.example
└── frontend/         # React + Vite SPA
    ├── src/
    └── index.html
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** ≥ 9

---

### 1. Clone the repository

```bash
git clone https://github.com/fekher12wx/gestion-des-projets.git
cd gestion-des-projets
```

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/poi_ftth_db"
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

Then install dependencies and initialize the database:

```bash
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed      # Optional: seed initial data
npm run dev              # Starts dev server on http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env     # Set VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev              # Starts dev server on http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | — |
| `PORT` | API server port | `5000` |
| `JWT_SECRET` | Secret key for JWT signing | — |
| `JWT_EXPIRES_IN` | Access token TTL | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `30d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |
| `BCRYPT_ROUNDS` | Password hashing rounds | `10` |
| `UPLOAD_DIR` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `10485760` (10 MB) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

---

## 📋 Key Features

- **POI File Management** — Full CRUD lifecycle for FTTH study dossiers with multi-stage tracking
- **Role-Based Access Control** — Admin, manager, and technician roles with granular permissions
- **Study Follow-up (Suivi Études)** — Sector-level dashboard tracking dossier counts by status
- **Excel Import / Export** — Bulk import dossier data from `.xlsx` files; export reports
- **File Attachments** — Upload and manage documents per dossier
- **Audit Trail** — Full history and audit log per file
- **Alerts & Notifications** — In-app alerts for deadlines, stage completions, and assignments
- **Saved Filters** — Persist and reuse advanced search filters per user

---

## 🔌 API Routes

| Prefix | Description |
|---|---|
| `POST /api/v1/auth/login` | Authenticate and receive JWT |
| `GET /api/v1/users` | User management (admin) |
| `GET /api/v1/suivi-etude` | Sector-level follow-up data |
| `GET /api/v1/dossier-etude` | Dossier detail records |
| `POST /api/v1/excel/import` | Bulk import from Excel |
| `GET /api/v1/excel/export` | Export data to Excel |

---

## 🛠️ Useful Scripts

### Backend

| Script | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production server |
| `npm run prisma:studio` | Open Prisma database browser |
| `npm run prisma:migrate` | Run pending migrations |
| `npm run prisma:seed` | Seed the database with initial data |

### Frontend

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 📄 License

ISC
