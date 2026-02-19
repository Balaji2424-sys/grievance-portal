# Grievance Redressal System — Backend API

A modular **Node.js + Express** REST API backend for a grievance redressal system, secured with **Firebase Authentication** and backed by **Firestore**.

## Project Structure

```
GP/
├── server.js               # Entry point (port 5000)
├── package.json
├── .env.example            # Copy to .env and fill in your values
│
├── routes/
│   ├── complaints.js       # CRUD for complaints
│   ├── messages.js         # Complaint thread messaging
│   └── admin.js            # Admin-only management endpoints
│
├── services/
│   ├── firebase.js         # Firebase Admin SDK init + Firestore export
│   └── tracking.js         # Tracking ID generator + lookup helper
│
└── middleware/
    └── auth.js             # Token verification + admin role guard
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Then fill in your Firebase credentials in .env
```

### 3. Run the server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | — | Health check |
| GET | `/api/complaints` | User | List own complaints |
| GET | `/api/complaints/:id` | User | Get single complaint |
| POST | `/api/complaints` | User | Submit new complaint |
| PATCH | `/api/complaints/:id/status` | User | Update complaint status |
| DELETE | `/api/complaints/:id` | User | Delete complaint |
| GET | `/api/messages/:complaintId` | User | Get messages in thread |
| POST | `/api/messages/:complaintId` | User | Send a message |
| DELETE | `/api/messages/:messageId` | User | Delete own message |
| GET | `/api/admin/complaints` | Admin | All complaints (filterable) |
| PATCH | `/api/admin/complaints/:id` | Admin | Update any complaint |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users/:uid/set-admin` | Admin | Grant/revoke admin |
| GET | `/api/admin/stats` | Admin | Dashboard statistics |

## Authentication

Pass a Firebase ID token in the `Authorization` header:
```
Authorization: Bearer <firebase-id-token>
```
