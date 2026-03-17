# Dr. Sanaullah Welfare Foundation – Multi-Panel Web Application

A responsive, secure multi-role web platform for Patients, Donors, Admins, Lab Staff, Students, Teachers, and Pharmacy Staff.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js (Express)
- Database & Auth: Supabase (PostgreSQL + Supabase Auth)
- Storage: Supabase Storage
- Deployment: Vercel (frontend), Render/Supabase (backend)

## Monorepo Structure
```
apps/
  backend/
  frontend/
supabase/
```

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase project (URL, anon key, service role key)
- Git + GitHub account

### 1) Configure environment
Copy and fill env files:

```
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Set these values from Supabase:
- SUPABASE_URL
- SUPABASE_ANON_KEY (frontend)
- SUPABASE_SERVICE_ROLE_KEY (backend)
- JWT_SECRET (optional; use Supabase JWT for verification via @supabase/supabase-js)

### 2) Install dependencies
```
cd apps/backend && npm install
cd ../frontend && npm install
```

### 3) Database schema & storage
Run the SQL in `supabase/` directory using Supabase SQL editor or CLI. Create storage buckets as needed.

### 4) Run locally
- Backend: `cd apps/backend && npm run dev`
- Frontend: `cd apps/frontend && npm run dev`

Open `http://localhost:5173` (frontend), backend defaults to `http://localhost:4000`.

## Features Overview
- Email + Phone OTP auth via Supabase
- Role-based dashboards (Patient, Donor, Admin, Lab, Student, Teacher, Pharmacy)
- RBAC middleware on backend
- Donations (one-time/recurring) – gateway stubs
- Lab reports & prescriptions via Supabase Storage (signed URLs)
- Course management for students/teachers
- Pharmacy inventory & discounts
- Notifications and activity logs

## Deployment
- Frontend: Vercel (set env vars, build with `npm run build`)
- Backend: Render or Supabase Functions (set env vars, use `npm run start`)
- Database/Storage/Auth: Supabase project

## Security
- Supabase JWT validation on backend
- RBAC guards per route
- Input validation (Zod)
- HTTPS recommended in production

## Scripts
- Backend: `dev`, `start`, `lint`
- Frontend: `dev`, `build`, `preview`, `lint`

## License
MIT
