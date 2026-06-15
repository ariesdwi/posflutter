# Quick Start Guide - VM Inventory Backend

## 🚀 Setup dalam 5 Menit

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Copy .env.example ke .env (sudah ada)
# Edit DATABASE_URL di .env jika perlu

# Run migrations
npx prisma migrate deploy

# (Optional) Generate Prisma Client
npx prisma generate
```

### 3. Start Server
```bash
npm run start:dev
```

Server akan berjalan di: `http://localhost:3000`

---

## 👤 Create Admin User (First Time Only)

### Cara Cepat (Menggunakan Script):
```bash
./scripts/create-admin.sh
```

### Cara Manual (curl):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
```

**Default Credentials:**
- Username: `admin`
- Password: `Admin123456`

⚠️ **PENTING:** User pertama yang register otomatis jadi ADMIN!

---

## 🔐 Login & Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "admin", "role": "ADMIN" }
}
```

**Simpan token** dari response untuk digunakan di semua request berikutnya.

### Simpan Token di Environment (Opsional):
```bash
export JWT_TOKEN="paste_your_token_here"
```

---

## 📊 Test Summary API

### 1. Management Report (All-in-One)
```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 2. Ubuntu Obsolete Summary
```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 3. CentOS Obsolete Summary
```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=CentOS" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 4. Ubuntu App-Department Mapping
```bash
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=Ubuntu" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 5. Department Summary
```bash
curl -X GET http://localhost:3000/api/summary/by-department \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 📥 Import Data (If Needed)

### Import VM Data from CSV
```bash
curl -X POST http://localhost:3000/api/import/csv \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@your_vm_data.csv" \
  -F "truncate=true"
```

### Import App Mapping from CSV
```bash
curl -X POST http://localhost:3000/api/import/app-mapping \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@app_mapping.csv" \
  -F "truncate=true"
```

---

## 📚 Available Endpoints

### Authentication
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public* | Register user (first = ADMIN) |
| `/api/auth/login` | POST | Public | Login & get JWT token |
| `/api/auth/me` | GET | ✅ | Get current user info |
| `/api/auth/users` | GET | Admin | List all users |

*First register is public, subsequent requires ADMIN token

### Summary (Management Reports)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/summary/management` | GET | ✅ | Complete management report |
| `/api/summary/obsolete?osType=Ubuntu` | GET | ✅ | Obsolete summary by OS |
| `/api/summary/app-mapping?osType=Ubuntu` | GET | ✅ | App-department mapping |
| `/api/summary/by-department` | GET | ✅ | Department summary |

### VM Management
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/vms` | GET | ✅ | List VMs (paginated) |
| `/api/vms/stats` | GET | ✅ | VM statistics |
| `/api/vms/:id` | GET | ✅ | Get single VM |
| `/api/vms` | POST | ✅ | Create VM |
| `/api/vms/:id` | PATCH | ✅ | Update VM |
| `/api/vms/:id` | DELETE | Admin | Delete VM |

### Statistics
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/stats/timeline` | GET | ✅ | End-of-support timeline |
| `/api/stats/resources` | GET | ✅ | Resource usage stats |

### Import
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/import/csv` | POST | ✅ | Import VM data from CSV |
| `/api/import/app-mapping` | POST | ✅ | Import app mappings |

### Alerts & Audit
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/alerts/rules` | GET | ✅ | List alert rules |
| `/api/audit/logs` | GET | ✅ | View audit logs |

---

## 🛠️ Common Commands

### Development
```bash
npm run start:dev          # Start in dev mode (hot reload)
npm run build              # Build for production
npm run start:prod         # Start production build
```

### Database
```bash
npx prisma migrate dev     # Create new migration
npx prisma migrate deploy  # Apply migrations
npx prisma studio          # Open DB GUI
npx prisma generate        # Generate Prisma Client
```

### Testing
```bash
npm run test               # Run unit tests
npm run test:e2e          # Run e2e tests
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `SETUP_ADMIN.md` | Detailed admin setup guide |
| `SUMMARY_API_QUICKREF.md` | Summary API reference |
| `IMPLEMENTATION_SUMMARY.md` | Implementation overview |
| `src/summary/README.md` | Technical API docs |
| `src/summary/RINGKASAN.md` | User guide (Indonesia) |
| `src/summary/EXAMPLES.md` | Usage examples |
| `src/summary/ARCHITECTURE.md` | Architecture diagrams |

---

## ⚡ Pro Tips

### 1. Pretty Print JSON
```bash
curl ... | jq '.'
```

### 2. Save Response to File
```bash
curl ... > report.json
```

### 3. Extract Just the Token
```bash
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}' \
  | jq -r '.access_token')

echo $TOKEN
```

### 4. Use Token in All Requests
```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.overview'
```

### 5. Filter Specific Department
```bash
curl -X GET http://localhost:3000/api/summary/by-department \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.[] | select(.department == "IT Operations")'
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Database connection error
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection
npx prisma db pull
```

### "Invalid credentials"
- Password minimal 8 karakter
- Username case-sensitive
- Check typo

### "Unauthorized" / 401 error
- Token expired (login ulang)
- Token tidak valid
- Missing "Bearer " prefix

---

## 📞 Need Help?

- **Setup Issues:** Lihat `SETUP_ADMIN.md`
- **API Documentation:** Lihat `src/summary/README.md`
- **Examples:** Lihat `src/summary/EXAMPLES.md`
- **Architecture:** Lihat `src/summary/ARCHITECTURE.md`

---

**Status: ✅ Ready to Use!**

Server berjalan → Admin dibuat → Login berhasil → Test API ✨
