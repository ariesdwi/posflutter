# 🔐 Cara Login Admin - Panduan Singkat

## Langkah-Langkah Login

### 1️⃣ Pastikan Server Berjalan

```bash
cd /Users/ptsiagaabdiutama/Desktop/Obsolete/vm-inventory-be
npm run start:dev
```

Tunggu hingga muncul:
```
Application successfully started
Listening on port 3000
```

---

### 2️⃣ Buat User Admin (Hanya Pertama Kali)

**Pilih salah satu cara:**

#### ✅ Cara A - Menggunakan Script (Paling Mudah)
```bash
./scripts/create-admin.sh
```

Script akan tanya username & password. Tekan Enter untuk pakai default:
- Username: `admin`
- Password: `Admin123456`

#### ✅ Cara B - Menggunakan curl
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
```

**Response jika berhasil:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "ADMIN",
  "createdAt": "2026-06-09T..."
}
```

⚠️ **Catatan:** User pertama yang register otomatis jadi ADMIN!

---

### 3️⃣ Login untuk Dapat Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE2ODY...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

**Simpan `access_token` ini!** Anda akan pakai untuk semua request API.

---

### 4️⃣ Gunakan Token untuk API Request

```bash
# Simpan token di environment variable (optional tapi praktis)
export JWT_TOKEN="paste_token_dari_step_3_disini"

# Test Summary API
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 🎯 Quick Commands

### Login Cepat & Simpan Token
```bash
# Login dan extract token sekaligus
export JWT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}' \
  | jq -r '.access_token')

# Verify token tersimpan
echo $JWT_TOKEN
```

### Test API dengan Token Tersimpan
```bash
# Management report
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

# Ubuntu obsolete
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'

# Department summary
curl -X GET http://localhost:3000/api/summary/by-department \
  -H "Authorization: Bearer $JWT_TOKEN" | jq '.'
```

---

## 🛠️ Troubleshooting

### ❌ Error: "Username already taken"
**Artinya:** User admin sudah dibuat sebelumnya.

**Solusi:** Langsung login saja (skip step 2, langsung ke step 3).

---

### ❌ Error: "Invalid credentials"
**Kemungkinan penyebab:**
1. Password salah (harus minimal 8 karakter)
2. Username typo (case-sensitive)

**Solusi:** 
- Coba password: `Admin123456` (perhatikan huruf besar)
- Atau reset via database (lihat SETUP_ADMIN.md)

---

### ❌ Error: "Cannot connect to server"
**Artinya:** Server belum berjalan.

**Solusi:**
```bash
cd /Users/ptsiagaabdiutama/Desktop/Obsolete/vm-inventory-be
npm run start:dev
```

---

### ❌ Error: "Unauthorized" atau 401
**Artinya:** Token expired atau tidak valid.

**Solusi:** Login ulang untuk dapat token baru (step 3).

---

## 📱 Menggunakan Postman

### Setup Collection

1. **Create Request: Register**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "username": "admin",
       "password": "Admin123456"
     }
     ```

2. **Create Request: Login**
   - Method: `POST`
   - URL: `http://localhost:3000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "username": "admin",
       "password": "Admin123456"
     }
     ```
   - Tests (untuk auto-save token):
     ```javascript
     pm.environment.set("jwt_token", pm.response.json().access_token);
     ```

3. **Create Request: Test API**
   - Method: `GET`
   - URL: `http://localhost:3000/api/summary/management`
   - Headers:
     - Key: `Authorization`
     - Value: `Bearer {{jwt_token}}`

---

## ✅ Checklist Login

- [ ] Server running (`npm run start:dev`)
- [ ] Admin user dibuat (via script atau curl)
- [ ] Login berhasil (dapat access_token)
- [ ] Token disimpan (di env variable atau notepad)
- [ ] Test API berhasil (dapat response JSON)

---

## 📚 Dokumentasi Lengkap

Untuk panduan lebih detail, lihat:
- **[SETUP_ADMIN.md](SETUP_ADMIN.md)** - Setup admin lengkap dengan troubleshooting
- **[QUICK_START.md](QUICK_START.md)** - Quick start guide lengkap
- **[README.md](README.md)** - Main documentation

---

## 💡 Tips

### Simpan Credentials Aman
Jangan share username/password atau JWT token ke orang lain!

### Ganti Password Default
Setelah login pertama kali, ganti password dari `Admin123456` ke yang lebih aman.

### Token Lifetime
JWT token akan expired dalam 24 jam. Setelah itu harus login ulang.

### Multiple Users
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

---

**🎉 Selamat! Anda sekarang bisa login dan menggunakan API.**

Untuk test semua endpoint sekaligus, jalankan:
```bash
./TEST_ENDPOINTS.sh
```
