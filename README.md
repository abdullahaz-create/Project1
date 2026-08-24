# Unique Science Academy — Management System

A full-stack academy management application for Class 9, 10, 11, 12.

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + Prisma ORM v7

## Setup Instructions

### 1. Configure the database

Edit `backend/.env` and replace the placeholder with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
JWT_SECRET="unique_academy_secret_2024"
PORT=4000
```

### 2. Push the database schema

This creates all tables in your database:

```bash
cd backend
npm run db:push
```

### 3. Start the backend

```bash
cd backend
npm run dev
```

The backend runs on **http://localhost:4000**

### 4. Start the frontend (new terminal)

```bash
cd frontend
npm run dev
```

The frontend runs on **http://localhost:5173**

Open your browser at `http://localhost:5173`

---

## Login Credentials

| Role   | Password |
|--------|----------|
| Admin  | `1200`   |
| Member | `1000`   |

---

## Features

### Class Management
- Separate dashboards for Class 9, 10, 11, 12
- Easy navigation between classes via sidebar

### Student Management (Admin only)
- Add, edit, and remove students
- Registration date and optional remarks
- Confirmation dialog before deletion

### Attendance
- Daily attendance tracking per class
- Mark Present / Absent per student
- Bulk save for the whole class at once
- View attendance by selecting a date

### Results
- Subject-wise marks for 7 subjects:
  Physics, Chemistry, Biology, Mathematics, Islamiat, English, Computer
- Auto-calculated total, percentage, and grade
- Admin can update results per student

### Fee Management
- Monthly fee tracking per student
- Select any month and year
- Mark fees as Paid or Unpaid
- Set and edit fee amounts
- Summary of paid/unpaid counts and total collected

### Role-Based Access
- **Admin** (password: 1200): Full CRUD access
- **Member** (password: 1000): View-only, all admin controls hidden
- Backend enforces permissions — member cannot call write APIs

---

## Project Structure

```
unique academy dashboard/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── prisma.config.ts      (Prisma v7 config with DATABASE_URL)
│   ├── src/
│   │   ├── lib/
│   │   │   └── prisma.js     (shared Prisma client with pg adapter)
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── adminOnly.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   ├── attendance.js
│   │   │   ├── results.js
│   │   │   └── fees.js
│   │   └── index.js
│   └── .env
└── frontend/
    └── src/
        ├── api/client.js
        ├── context/AuthContext.jsx
        ├── pages/
        │   ├── Login.jsx
        │   └── ClassDashboard.jsx
        └── components/
            ├── Layout.jsx
            ├── StudentsTab.jsx
            ├── AttendanceTab.jsx
            ├── ResultsTab.jsx
            └── FeesTab.jsx
```
