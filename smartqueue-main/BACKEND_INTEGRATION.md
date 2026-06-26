# SMART QUEUE - Backend Integration Guide

Panduan lengkap untuk mengintegrasikan SMART QUEUE dengan backend API Anda.

## 🔗 Environment Variables

Tambahkan ke `.env.local` atau vercel project settings:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_API_BASE_PATH=/api

# Optional: Auth tokens (jika menggunakan token-based auth)
NEXT_PUBLIC_AUTH_TOKEN_KEY=auth_token

# Optional: API key untuk service eksternal
API_SECRET_KEY=your_secret_key
```

## 📋 API Endpoints Reference

### Authentication

#### Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "fullName": "User Name",
  "email": "user@example.com",
  "password": "password123"
}

Response (201):
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### Forgot Password
```
POST /api/auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Reset password email sent"
}
```

#### Reset Password
```
POST /api/auth/reset-password
Content-Type: application/json

Request:
{
  "token": "reset_token_from_email",
  "password": "newpassword123"
}

Response (200):
{
  "success": true,
  "message": "Password reset successful"
}
```

### Vehicles

#### Get All Vehicles (User)
```
GET /api/vehicles
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "v1",
      "brand": "Toyota",
      "type": "Mobil Keluarga",
      "year": 2020,
      "plateNumber": "B 1234 ABC"
    }
  ]
}
```

#### Create Vehicle
```
POST /api/vehicles
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "brand": "Honda",
  "type": "SUV",
  "year": 2022,
  "plateNumber": "B 5678 XYZ"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "v2",
    "userId": "user_id",
    "brand": "Honda",
    "type": "SUV",
    "year": 2022,
    "plateNumber": "B 5678 XYZ"
  }
}
```

#### Update Vehicle
```
PUT /api/vehicles/:id
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "brand": "Honda",
  "type": "SUV",
  "year": 2023,
  "plateNumber": "B 5678 ABC"
}

Response (200):
{
  "success": true,
  "data": { ... }
}
```

#### Delete Vehicle
```
DELETE /api/vehicles/:id
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Vehicle deleted"
}
```

### Service Queues

#### Get All Queues (Admin)
```
GET /api/admin/queues
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "q1",
      "queueNumber": "SRV-0001",
      "userId": "user_id",
      "vehicleId": "v1",
      "complaint": "Mesin berbunyi kasar",
      "status": "pending",
      "serviceDate": "2024-06-13"
    }
  ]
}
```

#### Get User Queues
```
GET /api/queues
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [ ... ]
}
```

#### Create Queue
```
POST /api/queues
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "vehicleId": "v1",
  "complaint": "Penggantian oli",
  "serviceDate": "2024-06-14"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "q4",
    "queueNumber": "SRV-0004",
    "userId": "user_id",
    "vehicleId": "v1",
    "complaint": "Penggantian oli",
    "status": "pending",
    "serviceDate": "2024-06-14"
  }
}
```

#### Update Queue Status
```
PUT /api/queues/:id/status
Headers: Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "status": "processing",
  "reason": "Mulai dikerjakan"
}

Response (200):
{
  "success": true,
  "data": { ... }
}
```

### Dashboard

#### Get User Dashboard Stats
```
GET /api/dashboard/user
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "totalVehicles": 2,
    "totalQueuesActive": 1,
    "totalCompletedServices": 3
  }
}
```

#### Get Admin Dashboard Stats
```
GET /api/dashboard/admin
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "totalUsers": 10,
    "totalVehicles": 25,
    "totalQueuestoday": 15,
    "totalCompletedServices": 120,
    "monthlyData": [
      { "month": "Jan", "queues": 45, "completed": 42 }
    ]
  }
}
```

## 🔧 Frontend API Service Setup

Buat file `/lib/api-client.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH || '/api';

export const apiClient = {
  async get(endpoint: string) {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_URL}${API_BASE_PATH}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }).then(r => r.json());
  },

  async post(endpoint: string, data: any) {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_URL}${API_BASE_PATH}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  async put(endpoint: string, data: any) {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_URL}${API_BASE_PATH}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    }).then(r => r.json());
  },

  async delete(endpoint: string) {
    const token = localStorage.getItem('auth_token');
    return fetch(`${API_URL}${API_BASE_PATH}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    }).then(r => r.json());
  },
};
```

## 📝 Example: Integrating Login

Ganti kode di `/app/login/page.tsx` dengan:

```typescript
import { apiClient } from '@/lib/api-client';

const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  try {
    const response = await apiClient.post('/auth/login', {
      email: data.email,
      password: data.password,
    });

    if (response.success) {
      // Simpan token
      localStorage.setItem('auth_token', response.data.token);
      
      // Simpan user data
      localStorage.setItem('user', JSON.stringify(response.data.user));

      toast.success('Login berhasil!');
      
      // Redirect ke dashboard
      setTimeout(() => {
        router.push(
          response.data.user.role === 'admin' 
            ? '/admin/dashboard' 
            : '/dashboard'
        );
      }, 500);
    } else {
      toast.error(response.message || 'Login gagal');
    }
  } catch (error) {
    toast.error('Terjadi kesalahan. Silakan coba lagi.');
  } finally {
    setIsLoading(false);
  }
};
```

## 🛡️ Security Best Practices

1. **Token Management**
   - Simpan JWT di localStorage (untuk simplicity) atau httpOnly cookies (lebih aman)
   - Kirim token di setiap request via Authorization header
   - Implement token refresh logic

2. **Route Protection**
   - Validasi user state sebelum render protected pages
   - Redirect ke login jika token invalid/expired
   - Implement role-based access control

3. **Input Validation**
   - Gunakan Zod untuk validasi frontend
   - Implementasikan server-side validation juga
   - Sanitize input untuk XSS prevention

4. **Error Handling**
   - Jangan expose sensitive error messages
   - Log errors di sisi server untuk debugging
   - Berikan user-friendly error messages

## 🧪 Testing API Integration

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Test get vehicles (dengan token)
curl -X GET http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🚀 Deployment Notes

Ketika deploy ke production:

1. Update `NEXT_PUBLIC_API_URL` ke backend production URL
2. Pastikan backend mendukung CORS dari domain frontend
3. Gunakan HTTPS untuk semua API calls
4. Implement rate limiting untuk security
5. Setup environment variables di Vercel/hosting provider

---

Untuk pertanyaan atau bantuan, hubungi tim development.
