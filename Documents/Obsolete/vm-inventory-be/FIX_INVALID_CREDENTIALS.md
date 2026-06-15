# 🔧 Fix "Invalid Credentials" Error

## Error yang Anda Alami
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

---

## ✅ Solusi Cepat (Step-by-Step)

### Step 1: Pastikan Backend Running
```bash
# Check if server is running
curl http://localhost:3000/api/auth/login

# If error "Failed to connect", start server:
cd /Users/ptsiagaabdiutama/Desktop/Obsolete/vm-inventory-be
npm run start:dev
```

---

### Step 2: Cek Apakah User Admin Sudah Ada

```bash
# Try login dengan default credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'
```

**Jika dapat response dengan `access_token` → User sudah ada, login berhasil! ✅**

**Jika masih "Invalid credentials" → User belum dibuat, lanjut ke Step 3.**

---

### Step 3: Buat User Admin (Jika Belum Ada)

#### Cara A - Menggunakan Script (Paling Mudah)
```bash
./scripts/create-admin.sh
```

Ikuti prompt, atau tekan Enter untuk pakai default:
- Username: `admin`
- Password: `Admin123456`

#### Cara B - Menggunakan curl
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123456"
  }'
```

**Expected Response (Success):**
```json
{
  "id": 1,
  "username": "admin",
  "role": "ADMIN",
  "createdAt": "2026-06-09T..."
}
```

**Jika dapat error "Username already taken" → User sudah ada, coba login lagi.**

---

### Step 4: Login Lagi

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123456"
  }'
```

**Expected Response (Success):**
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

✅ **Jika dapat `access_token` → SOLVED!**

---

## 🔍 Debugging Lebih Lanjut

### Check Database - Apakah User Benar-Benar Ada?

```bash
# Masuk ke PostgreSQL
psql -U your_username -d your_database_name

# Check users table
SELECT id, username, role, created_at FROM users;
```

**Expected Output:**
```
 id | username | role  |         created_at
----+----------+-------+----------------------------
  1 | admin    | ADMIN | 2026-06-09 10:00:00.000000
```

**Jika table kosong → User belum dibuat, kembali ke Step 3.**

**Jika ada user tapi password lupa → Reset password (lihat bagian bawah).**

---

## 🛠️ Kemungkinan Penyebab Lain

### 1. Password Salah Format
```javascript
// ❌ Password terlalu pendek (< 8 karakter)
{
  "username": "admin",
  "password": "Admin12"  // ❌ Only 7 chars
}

// ✅ Correct (>= 8 karakter)
{
  "username": "admin",
  "password": "Admin123456"  // ✅ 12 chars
}
```

---

### 2. Username Case-Sensitive
```javascript
// ❌ Wrong case
{
  "username": "Admin",  // ❌ Capital A
  "password": "Admin123456"
}

// ✅ Correct
{
  "username": "admin",  // ✅ lowercase
  "password": "Admin123456"
}
```

---

### 3. Extra Spaces atau Characters
```javascript
// ❌ Extra space
{
  "username": " admin",  // ❌ Space before
  "password": "Admin123456"
}

// ❌ Extra newline from copy-paste
{
  "username": "admin\n",  // ❌ Newline
  "password": "Admin123456"
}

// ✅ Correct - no extra spaces
{
  "username": "admin",
  "password": "Admin123456"
}
```

---

## 🔄 Reset Password (Jika Lupa)

### Option 1: Delete User & Create New
```bash
# 1. Connect to database
psql -U your_username -d your_database_name

# 2. Delete admin user
DELETE FROM users WHERE username = 'admin';

# 3. Exit PostgreSQL
\q

# 4. Create new admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"NewPassword123"}'
```

### Option 2: Update Password Hash
```bash
# 1. Generate new password hash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NewPassword123', 12));"

# Copy the hash (starts with $2a$12$...)

# 2. Update in database
psql -U your_username -d your_database_name

UPDATE users 
SET password = '$2a$12$paste_hash_here' 
WHERE username = 'admin';
```

---

## 📱 Frontend Implementation (Complete)

```javascript
// API Service
async function login(username, password) {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),  // Remove extra spaces
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error
      throw new Error(data.message || 'Login failed');
    }

    // Success - save token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Usage
const result = await login('admin', 'Admin123456');

if (result.success) {
  console.log('Login successful!');
  console.log('Token:', result.data.access_token);
} else {
  console.error('Login failed:', result.error);
}
```

---

## ✅ Quick Checklist

- [ ] Backend server running (`npm run start:dev`)
- [ ] Database connected (check `.env` file)
- [ ] Admin user exists (check with psql or create new)
- [ ] Username is exactly "admin" (lowercase)
- [ ] Password is exactly "Admin123456" (case-sensitive)
- [ ] Password minimal 8 karakter
- [ ] No extra spaces atau newlines
- [ ] Request body is valid JSON
- [ ] Content-Type header is "application/json"

---

## 🎯 Test Commands

```bash
# 1. Check server
curl http://localhost:3000

# 2. Try register (will fail if user exists, that's OK)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'

# 3. Try login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'

# 4. If success, test protected endpoint
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📞 Still Not Working?

### Run Complete Test Script:
```bash
./TEST_ENDPOINTS.sh
```

This will:
1. Check if server is running
2. Ask for your credentials
3. Try to login
4. Show detailed error if fails
5. Test all endpoints if login succeeds

---

## 💡 Prevention Tips

### Untuk Development:
1. Simpan credentials di `.env.local` (jangan commit ke git!)
2. Gunakan password yang sama untuk consistency
3. Document credentials di README tim

### Untuk Production:
1. JANGAN gunakan "Admin123456"!
2. Gunakan strong password (min 12 chars, mix upper/lower/number/symbol)
3. Enable 2FA jika tersedia
4. Rotate password regularly

---

**Common Working Credentials:**
```
Username: admin
Password: Admin123456
```

**Jika masih error, coba:**
```bash
# Complete reset
psql -U postgres -d your_database -c "DELETE FROM users WHERE username = 'admin';"
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'
```

---

**Status:** 🔧 Troubleshooting Guide Complete
