# Setup Admin User - Panduan Lengkap

## 🎯 Overview

Untuk menggunakan API Summary dan endpoint lainnya, Anda perlu akun admin untuk login dan mendapatkan JWT token.

---

## 📋 Cara 1: Register via API (Recommended)

**User pertama yang register akan otomatis menjadi ADMIN.**

### Step 1: Jalankan Server

```bash
npm run start:dev
```

Tunggu hingga muncul:
```
[Nest] Application successfully started
Listening on port 3000
```

### Step 2: Register Admin User

#### Opsi A - Menggunakan Script (Paling Mudah)

```bash
./scripts/create-admin.sh
```

Script akan menanyakan username dan password. Atau gunakan default:
- Username: `admin`
- Password: `Admin123456`

#### Opsi B - Menggunakan curl

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123456"
  }'
```

**Response jika berhasil:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "ADMIN",
  "createdAt": "2026-06-09T10:00:00.000Z"
}
```

### Step 3: Login untuk Mendapat Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123456"
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

**Simpan `access_token` ini!** Anda akan menggunakannya untuk semua API request.

---

## 📋 Cara 2: Seed via Prisma Script

Jika Anda ingin create admin langsung ke database tanpa menjalankan server.

### Step 1: Compile TypeScript Script

```bash
npx ts-node scripts/seed-admin.ts
```

Atau dengan custom username/password:

```bash
ADMIN_USERNAME=superadmin ADMIN_PASSWORD=MySecurePassword123 npx ts-node scripts/seed-admin.ts
```

### Step 2: Verify di Database

```bash
# Masuk ke PostgreSQL
psql -U your_username -d your_database

# Check user
SELECT id, username, role, created_at FROM users;
```

### Step 3: Login via API

Setelah user dibuat, jalankan server dan login seperti Cara 1 Step 3.

---

## 🔐 Menggunakan JWT Token

Setelah login, gunakan token untuk semua protected endpoints:

```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Ganti `YOUR_ACCESS_TOKEN` dengan token yang Anda dapat dari login.**

---

## 📝 Contoh Lengkap (End-to-End)

### 1. Register Admin (First Time)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
```

### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}' \
  | jq -r '.access_token'
```

Ini akan menampilkan token. Copy token tersebut.

### 3. Simpan Token di Environment Variable (Opsional)

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Test API dengan Token

```bash
# Get management summary
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.'

# Get Ubuntu obsolete summary
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.'
```

---

## 👥 Membuat User Tambahan

Setelah admin pertama dibuat, hanya admin yang bisa create user baru:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN" \
  -d '{
    "username": "viewer1",
    "password": "ViewerPassword123",
    "role": "VIEWER"
  }'
```

**Available Roles:**
- `ADMIN` - Full access (can create users, all endpoints)
- `VIEWER` - Read-only access
- `AUDITOR` - Read access + audit logs

---

## 🔍 Melihat Semua Users

Hanya ADMIN yang bisa melihat list users:

```bash
curl -X GET http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer $ADMIN_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "id": 1,
    "username": "admin",
    "role": "ADMIN",
    "createdAt": "2026-06-09T10:00:00.000Z"
  },
  {
    "id": 2,
    "username": "viewer1",
    "role": "VIEWER",
    "createdAt": "2026-06-09T10:05:00.000Z"
  }
]
```

---

## 🔄 Reset Password (Via Database)

Jika lupa password admin, Anda bisa reset via database:

### Option 1: Delete user dan create baru

```bash
# Masuk ke PostgreSQL
psql -U your_username -d your_database

# Delete user
DELETE FROM users WHERE username = 'admin';

# Sekarang register admin baru via API
```

### Option 2: Update password hash

```bash
# Generate new password hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NewPassword123', 12));"

# Copy hash result, lalu di PostgreSQL:
UPDATE users 
SET password = '$2a$12$...' 
WHERE username = 'admin';
```

---

## 🛠️ Troubleshooting

### Problem: "Username already taken"

**Solusi:** User sudah ada. Login dengan credentials yang ada, atau delete user dari database.

```sql
-- Check existing users
SELECT username, role FROM users;

-- Delete specific user
DELETE FROM users WHERE username = 'admin';
```

### Problem: "Invalid credentials"

**Solusi:** Password salah. Pastikan password minimal 8 karakter.

### Problem: "Only ADMIN can create new users"

**Solusi:** Anda mencoba create user kedua tanpa JWT token admin. 

Login sebagai admin dulu, lalu gunakan token-nya untuk create user baru.

### Problem: Token expired

**Solusi:** JWT token punya expiry time (default 1 hari). Login ulang untuk dapat token baru.

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
```

### Problem: "Cannot connect to database"

**Solusi:** Check `.env` file, pastikan `DATABASE_URL` benar:

```bash
# Lihat .env
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

---

## 📱 Menggunakan Postman

### 1. Setup Environment

Buat environment di Postman:
- Variable: `base_url` → Value: `http://localhost:3000`
- Variable: `jwt_token` → Value: (kosongkan dulu)

### 2. Register Request

```
POST {{base_url}}/api/auth/register
Headers:
  Content-Type: application/json
Body (JSON):
{
  "username": "admin",
  "password": "Admin123456"
}
```

### 3. Login Request

```
POST {{base_url}}/api/auth/login
Headers:
  Content-Type: application/json
Body (JSON):
{
  "username": "admin",
  "password": "Admin123456"
}

Tests (untuk auto-save token):
pm.environment.set("jwt_token", pm.response.json().access_token);
```

### 4. Protected Endpoints

```
GET {{base_url}}/api/summary/management
Headers:
  Authorization: Bearer {{jwt_token}}
```

---

## 🔐 Security Best Practices

1. **Ganti Password Default**
   - Setelah login pertama kali, ganti password dari `Admin123456`

2. **Gunakan Strong Password**
   - Minimal 12 karakter
   - Kombinasi huruf besar, kecil, angka, simbol

3. **Jangan Share JWT Token**
   - Token seperti password
   - Jika leaked, attacker bisa akses semua data

4. **Rotate Tokens Regularly**
   - Login ulang secara berkala
   - Jangan simpan token permanent

5. **Simpan Credentials Aman**
   - Jangan commit ke git
   - Gunakan environment variables

---

## 📚 References

- **Auth Controller:** `src/auth/auth.controller.ts`
- **Auth Service:** `src/auth/auth.service.ts`
- **User Schema:** `prisma/schema.prisma`
- **Scripts:** `scripts/create-admin.sh`, `scripts/seed-admin.ts`

---

## ✅ Quick Start Checklist

- [ ] Server running (`npm run start:dev`)
- [ ] Admin user created (via API atau script)
- [ ] Login successful, got JWT token
- [ ] Token saved in environment variable
- [ ] Test API endpoint dengan token
- [ ] Password changed from default

---

**Selamat! Anda sekarang bisa menggunakan semua API endpoints.** 🎉
