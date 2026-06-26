# SMART QUEUE - Sistem Antrian Service Bengkel

Aplikasi web production-ready untuk mengelola antrian service kendaraan di bengkel modern.

## 🎯 Fitur Utama

### User (Pemilik Kendaraan)
- ✅ Autentikasi dengan Email & Password
- ✅ Kelola data kendaraan (Tambah, Edit, Hapus)
- ✅ Buat antrian service untuk kendaraan
- ✅ Lihat riwayat service lengkap
- ✅ Profile management & ubah password
- ✅ Dashboard dengan statistik personal

### Admin (Bengkel)
- ✅ Dashboard dengan analytics real-time
- ✅ Kelola data user dan kendaraan
- ✅ Monitor antrian service (Pending, Processing, Completed, Cancelled)
- ✅ Update status antrian dengan tracking
- ✅ Lihat riwayat service semua pelanggan
- ✅ Queue logs untuk audit trail

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS v4
- **Form Management**: React Hook Form + Zod Validation
- **Data Visualization**: Recharts
- **State Management**: Built-in React Hooks + localStorage (demo)
- **Notifications**: Sonner Toast
- **Icons**: Lucide React

## 📁 Struktur Folder

```
├── app/
│   ├── layout.tsx              # Root layout dengan Toaster
│   ├── page.tsx                # Home (redirect ke dashboard)
│   ├── login/                  # Login page
│   ├── register/               # Register page
│   ├── forgot-password/        # Forgot password
│   ├── reset-password/         # Reset password
│   ├── dashboard/              # User dashboard (protected)
│   ├── vehicles/               # Kelola kendaraan user
│   ├── queue/create/           # Buat antrian
│   ├── service-history/        # Riwayat service user
│   ├── profile/                # Profile & settings user
│   └── admin/                  # Admin pages (protected)
│       ├── dashboard/          # Admin dashboard
│       ├── users/              # Data user
│       ├── vehicles/           # Data kendaraan
│       ├── queues/             # Data antrian
│       ├── service-history/    # Riwayat service
│       └── queue-logs/         # Queue logs
├── components/
│   ├── ui/button.tsx           # Base button (shadcn/ui)
│   ├── sidebar.tsx             # Navigation sidebar
│   ├── navbar.tsx              # Top navbar
│   ├── dashboard-layout.tsx    # Protected layout
│   ├── status-badge.tsx        # Status indicator
│   ├── statistic-card.tsx      # Stats card
│   ├── empty-state.tsx         # Empty placeholder
│   ├── confirm-dialog.tsx      # Confirmation modal
│   ├── loading-skeleton.tsx    # Loading state
│   └── search-input.tsx        # Search field
├── lib/
│   ├── types.ts                # TypeScript types
│   ├── constants.ts            # Constants & navigation
│   ├── mock-data.ts            # Demo data
│   └── utils.ts                # Utility functions
└── public/                     # Static assets

```

## 🔐 Demo Credentials

### Admin
- Email: `admin@example.com`
- Password: `password123`
- Akses: `/admin/dashboard`

### User
- Email: `budi@example.com`
- Password: `password123`
- Akses: `/dashboard`

## 🚀 Installation & Running

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start
```

Server akan berjalan di `http://localhost:3000`

## 🎨 Design System

### Colors
- **Primary**: Blue (`#3b82f6`)
- **Neutrals**: Slate, Gray, White
- **Accents**: Green (success), Yellow (warning), Red (danger)

### Typography
- **Heading**: Geist Sans (bold)
- **Body**: Geist Sans (regular)
- **Mono**: Geist Mono (code)

### Components Pattern
- Soft shadows
- Rounded corners (8px)
- Minimalist cards
- Clear spacing (4px grid)
- Mobile-first responsive

## 📊 Data Models

### Users
- ID, Name, Email, Role (admin/user), Phone, Address, Timestamps

### Vehicles
- ID, UserID, Brand, Type, Year, PlateNumber, Timestamps

### Service Queues
- ID, QueueNumber, UserID, VehicleID, Complaint, ServiceDate, Status, Timestamps

### Service History
- ID, QueueID, UserID, VehicleID, Complaint, Solution, Cost, Timestamps

### Queue Logs
- ID, QueueID, OldStatus, NewStatus, ChangedBy, Reason, Timestamp

## 🔄 Status Flow

Antrian mengikuti workflow:
```
Pending → Processing → Completed
                    ↓
                Cancelled
```

## 🎯 Features Ready for Backend Integration

Aplikasi ini siap untuk diintegrasikan dengan backend API:

1. **Authentication API**
   - POST `/api/auth/login` - Login user
   - POST `/api/auth/register` - Register user
   - POST `/api/auth/logout` - Logout
   - POST `/api/auth/forgot-password`
   - POST `/api/auth/reset-password`

2. **User API**
   - GET `/api/user/profile`
   - PUT `/api/user/profile`
   - PUT `/api/user/password`

3. **Vehicle API**
   - GET `/api/vehicles`
   - POST `/api/vehicles`
   - PUT `/api/vehicles/:id`
   - DELETE `/api/vehicles/:id`

4. **Queue API**
   - GET `/api/queues`
   - POST `/api/queues`
   - PUT `/api/queues/:id/status`
   - GET `/api/queues/:id`

5. **Admin API**
   - GET `/api/admin/users`
   - GET `/api/admin/vehicles`
   - GET `/api/admin/queues`
   - GET `/api/admin/service-history`
   - GET `/api/admin/queue-logs`

## ✅ Quality Checklist

- ✅ No console errors
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Accessible form inputs & labels
- ✅ Loading states & skeletons
- ✅ Empty states with call-to-action
- ✅ Error handling & validation
- ✅ Toast notifications (Sonner)
- ✅ Protected routes (role-based)
- ✅ Charts & data visualization
- ✅ Search & filter functionality
- ✅ Modal & dialog components
- ✅ Clean, modern UI design

## 🚀 Deployment

Aplikasi ini dapat di-deploy ke:
- Vercel (recommended)
- AWS Amplify
- Netlify
- Docker containers

Sesuaikan environment variables sesuai backend API yang digunakan.

---

**Built with v0.app** | Production-Ready | TypeScript | Next.js 16
