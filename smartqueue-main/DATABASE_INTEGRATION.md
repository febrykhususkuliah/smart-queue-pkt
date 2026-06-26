# 🗄️ Database Integration Guide

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create `.env` file di folder `backend`:

```env
# Database
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=smart_queue
DB_PORT=3306

# Server
PORT=3001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_min_32_characters

# API URL for Frontend
API_URL=http://localhost:3001
```

### 3. Database Setup

1. Buka phpMyAdmin atau MySQL CLI
2. Buat database baru:
   ```sql
   CREATE DATABASE smart_queue;
   USE smart_queue;
   ```
3. Import file `smart_queue.sql`
4. Verify semua tabel tersedia

---

## Database Schema Summary

| Tabel             | Fungsi                           | Fields                                                                             |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------- |
| `users`           | Authentication & User Management | id, name, email, password, role, created_at                                        |
| `vehicles`        | Data Kendaraan User              | id, user_id, merk, tipe, tahun, plat_nomor, created_at                             |
| `service_queues`  | Antrian Service                  | id, queue_number, user_id, vehicle_id, complaint, service_date, status, created_at |
| `service_history` | Riwayat Service                  | id, queue_id, service_notes, completed_at                                          |
| `queue_logs`      | Log Perubahan Status             | id, queue_id, old_status, new_status, changed_by, changed_at                       |

---

## Status Enum Values

`service_queues.status` dapat bernilai:

- `Menunggu` - Waiting
- `Diproses` - Processing
- `Selesai` - Completed
- `Dibatalkan` - Cancelled

---

## API Endpoints (akan dibuat)

### Authentication

- POST `/api/auth/register` - Register user baru
- POST `/api/auth/login` - Login user
- POST `/api/auth/logout` - Logout

### Users

- GET `/api/users/:id` - Get user info
- PUT `/api/users/:id` - Update user
- GET `/api/users/:id/profile` - Get user profile

### Vehicles

- GET `/api/vehicles?user_id=1` - Get user vehicles
- POST `/api/vehicles` - Create vehicle
- PUT `/api/vehicles/:id` - Update vehicle
- DELETE `/api/vehicles/:id` - Delete vehicle

### Service Queues

- GET `/api/queues` - Get all queues (admin)
- GET `/api/queues?user_id=1` - Get user queues
- POST `/api/queues` - Create queue
- PUT `/api/queues/:id` - Update queue
- GET `/api/queues/:id` - Get queue details
- PUT `/api/queues/:id/status` - Update queue status

### Service History

- GET `/api/service-history?user_id=1` - Get user history
- GET `/api/service-history` - Get all history (admin)
- POST `/api/service-history` - Add service history

### Queue Logs

- GET `/api/queue-logs?queue_id=1` - Get queue logs
- GET `/api/queue-logs` - Get all logs (admin)

---

## Backend Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Database connection
│   ├── middleware/
│   │   └── auth.ts              # JWT authentication and error handling
│   ├── routes/
│   │   ├── auth.ts              # Auth endpoints
│   │   ├── vehicles.ts          # Vehicle endpoints
│   │   ├── queues.ts            # Queue endpoints
│   │   ├── serviceHistory.ts    # Service history endpoints
│   │   └── queueLogs.ts         # Queue log endpoints
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── app.ts                   # Express app setup
├── .env.example                 # Example env file
├── .gitignore
├── package.json
└── tsconfig.json
```

---

## Connection Pooling

MySQL2 dengan connection pool adalah rekomendasi untuk production:

```typescript
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
```

---

## Security Considerations

1. **Passwords**: Hash dengan bcryptjs sebelum disimpan
2. **JWT**: Gunakan secret key yang kuat (min 32 chars)
3. **CORS**: Configure CORS untuk frontend URL saja
4. **Input Validation**: Validate semua input user
5. **SQL Injection**: Gunakan prepared statements
6. **Environment Variables**: Jangan commit .env ke git

---

## Testing Database Connection

Buat file `test-connection.ts`:

```typescript
import pool from "./src/config/database";

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT 1");
    connection.release();
    console.log("✅ Database connection successful!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

testConnection();
```

Run: `npx ts-node test-connection.ts`

---

## Next Steps

1. Install semua dependencies
2. Setup `.env` file
3. Create backend folder structure
4. Implement database connection
5. Create API routes (files akan dibuat next)
6. Setup CORS di Express
7. Implement JWT authentication
8. Test API dengan Postman
9. Update frontend untuk use API

---

**Status:** Backend setup guide created ✅
**Next:** API implementation files akan dibuat
