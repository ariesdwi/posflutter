# Frontend Quick Start - Fix "Invalid Credentials"

## 🚨 Problem: Getting "Invalid credentials" error?

### ✅ SOLUTION: Jalankan script ini dulu!

```bash
./TEST_LOGIN.sh
```

Script akan:
1. ✅ Check apakah server running
2. ✅ Coba login dengan credentials Anda
3. ✅ Kalau gagal, tawarkan create user admin
4. ✅ Test protected endpoint
5. ✅ Berikan token untuk frontend Anda

---

## 📚 Dokumentasi Lengkap

### Untuk Fix Error Login:
→ **[FIX_INVALID_CREDENTIALS.md](FIX_INVALID_CREDENTIALS.md)** ⭐⭐⭐
- Troubleshooting lengkap
- Step-by-step solution
- Common causes & fixes

### Untuk Integrasi Frontend:
→ **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** ⭐⭐⭐
- React/Next.js implementation
- Vue.js implementation  
- Angular implementation
- Vanilla JavaScript example
- Complete code examples

### Untuk Setup Backend:
→ **[CARA_LOGIN_ADMIN.md](CARA_LOGIN_ADMIN.md)** ⭐⭐
- Panduan setup admin (Bahasa Indonesia)
- Quick commands

---

## 🎯 Default Credentials

```
Username: admin
Password: Admin123456
```

⚠️ **IMPORTANT:** 
- Username case-sensitive (harus lowercase "admin")
- Password minimal 8 karakter
- User pertama yang register otomatis jadi ADMIN

---

## 🔧 Quick Fix Commands

### 1. Check Backend Running
```bash
curl http://localhost:3000
```

### 2. Create Admin User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'
```

### 3. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}'
```

### 4. Test API
```bash
# Save token from step 3, then:
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Frontend Code (Copy-Paste Ready)

### React/Next.js

```javascript
// Login function
async function login(username, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  const data = await response.json();
  
  // Save token
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

// Usage
try {
  const result = await login('admin', 'Admin123456');
  console.log('Login success!', result);
  // Redirect to dashboard
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Fetch Data with Token

```javascript
async function getSummary() {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:3000/api/summary/management', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return await response.json();
}
```

---

## ✅ Testing Checklist

- [ ] Backend server running
- [ ] Database connected
- [ ] Admin user created
- [ ] Login successful (got token)
- [ ] Token works with protected endpoints
- [ ] Frontend can save & use token

---

## 🐛 Common Errors

### Error: "Invalid credentials"
→ Read: [FIX_INVALID_CREDENTIALS.md](FIX_INVALID_CREDENTIALS.md)

### Error: "CORS"
→ Backend CORS sudah enabled by default

### Error: "Network request failed"
→ Check backend running di port 3000

### Error: "401 Unauthorized" on protected endpoints
→ Check token format: `Bearer YOUR_TOKEN` (with space!)

---

## 📞 Need Help?

1. **Run test script:** `./TEST_LOGIN.sh`
2. **Read fix guide:** [FIX_INVALID_CREDENTIALS.md](FIX_INVALID_CREDENTIALS.md)
3. **Check integration:** [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)

---

**Status:** ✅ Ready for Frontend Integration

**Next Steps:**
1. Run `./TEST_LOGIN.sh` untuk test login
2. Copy token yang didapat
3. Implement di frontend Anda
4. Done! 🚀
