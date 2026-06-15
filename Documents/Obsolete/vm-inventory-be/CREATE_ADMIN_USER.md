# Cara Membuat User Admin

## Sistem Authentication

Aplikasi ini menggunakan **register-first** approach:
- **User pertama** yang register otomatis jadi **ADMIN**
- User berikutnya hanya bisa dibuat oleh ADMIN

---

## Step 1: Register User Pertama (Akan jadi ADMIN)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "ADMIN",
  "createdAt": "2026-06-09T..."
}
```

✅ User pertama otomatis dapat role **ADMIN**

---

## Step 2: Login dengan User Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

✅ Simpan `access_token` ini untuk request berikutnya!

---

## Step 3: Test Access Summary API

```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Membuat User Tambahan (Butuh ADMIN Token)

Setelah user admin dibuat, user baru hanya bisa dibuat oleh ADMIN:

### Create VIEWER User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "username": "viewer1",
    "password": "password123",
    "role": "VIEWER"
  }'
```

### Create ADMIN User (oleh ADMIN)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "username": "admin2",
    "password": "password123",
    "role": "ADMIN"
  }'
```

---

## Role Types

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access - dapat membuat user baru |
| **VIEWER** | Read-only access |
| **AUDITOR** | Can view audit logs |

---

## Quick Commands

### 1. Register Admin (First Time Only)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 3. Test Summary API
```bash
# Ganti YOUR_TOKEN dengan token dari login response
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.'
```

---

## Troubleshooting

### Error: "Username already taken"
→ User sudah ada, gunakan username lain atau login dengan user yang sudah ada

### Error: "Only ADMIN can create new users"
→ Anda mencoba register user ke-2 tanpa token ADMIN
→ Solusi: Login sebagai ADMIN dulu, lalu gunakan tokennya

### Error: "Invalid credentials"
→ Username atau password salah
→ Solusi: Cek username dan password yang benar

### Error: "Unauthorized"
→ Token JWT tidak valid atau expired
→ Solusi: Login ulang untuk dapat token baru

---

## Alternatif: Buat User via Prisma Studio

Jika ingin membuat user via database langsung:

```bash
# 1. Jalankan Prisma Studio
npx prisma studio

# 2. Buka browser di http://localhost:5555

# 3. Pilih tabel "users"

# 4. Klik "Add record"

# 5. Isi:
#    - username: admin
#    - password: (hash dengan bcrypt - lihat script di bawah)
#    - role: ADMIN

# 6. Save
```

### Generate Bcrypt Hash untuk Password

```javascript
// Script Node.js untuk generate bcrypt hash
const bcrypt = require('bcryptjs');
const password = 'admin123';
const hash = bcrypt.hashSync(password, 12);
console.log('Hash:', hash);
```

---

## Recommended First User

**Username:** `admin`  
**Password:** `admin123` (ganti setelah setup!)  
**Role:** `ADMIN` (otomatis untuk user pertama)

**⚠️ PENTING:** Segera ganti password default setelah setup selesai!

---

## Script Helper (Optional)

Buat file `scripts/create-admin.sh`:

```bash
#!/bin/bash

echo "Creating admin user..."

RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo $RESPONSE | jq '.'

if echo $RESPONSE | jq -e '.id' > /dev/null; then
  echo "✅ Admin user created successfully!"
  echo "Username: admin"
  echo "Password: admin123"
  echo "⚠️  Please change password after first login!"
else
  echo "❌ Failed to create admin user"
  echo $RESPONSE
fi
```

Jalankan:
```bash
chmod +x scripts/create-admin.sh
./scripts/create-admin.sh
```

---

## Security Notes

1. ✅ Password di-hash dengan bcrypt (rounds=12)
2. ✅ JWT token dengan expiration
3. ⚠️ Ganti password default setelah setup
4. ⚠️ Gunakan HTTPS di production
5. ⚠️ Set strong JWT secret di `.env`

---

**Status:** Ready to create first admin user!
