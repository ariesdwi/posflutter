# VM Inventory Backend API

Backend API untuk manajemen inventory Virtual Machine dengan fokus pada tracking obsolete OS dan mapping aplikasi per departemen.

## 📋 Features

### ✅ VM Management
- CRUD operations untuk VM inventory
- Pagination, filtering, dan sorting
- Import bulk data dari CSV
- Tracking 19,311+ VMs dengan 31 fields

### ✅ Management Reporting (NEW!)
- **Summary Obsolete Ubuntu Production** - Laporan VM Ubuntu obsolete
- **Summary Obsolete CentOS Production** - Laporan VM CentOS obsolete
- **App-Department Mapping** - Mapping aplikasi ke departemen & fungsi
- **Department Summary** - Quick overview per departemen

### ✅ Statistics & Analytics
- End-of-support timeline
- Resource usage aggregation
- OS distribution analysis
- Cluster heatmap data

### ✅ Authentication & Authorization
- JWT-based authentication
- Role-based access control (ADMIN, VIEWER, AUDITOR)
- Audit logging untuk tracking changes

### ✅ Alerts & Monitoring
- Alert rules untuk threshold monitoring
- Scheduled scanning untuk expired OS
- Webhook notifications (Slack/Teams ready)

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup database
cp .env.example .env
# Edit .env and set your DATABASE_URL

# 3. Run migrations
npx prisma migrate deploy

# 4. Start server
npm run start:dev
```

Server will run on: `http://localhost:3000`

---

## 👤 Create Admin User

**First user to register will automatically become ADMIN.**

### Quick Method (Using Script):
```bash
./scripts/create-admin.sh
```

### Manual Method (curl):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
```

**Default Credentials:**
- Username: `admin`
- Password: `Admin123456`

⚠️ **Important:** Change password after first login!

---

## 🔐 Authentication

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123456"}'
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

### Using Token
```bash
# Save token
export JWT_TOKEN="your_access_token_here"

# Use in requests
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer $JWT_TOKEN"
```

---

## 📊 API Endpoints

### Summary API (Management Reports)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/summary/management` | GET | Complete management report (all-in-one) |
| `/api/summary/obsolete?osType=Ubuntu` | GET | Ubuntu obsolete summary |
| `/api/summary/obsolete?osType=CentOS` | GET | CentOS obsolete summary |
| `/api/summary/app-mapping?osType=Ubuntu` | GET | Ubuntu app-department mapping |
| `/api/summary/app-mapping?osType=CentOS` | GET | CentOS app-department mapping |
| `/api/summary/by-department` | GET | Department summary (all OS) |

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | Public* | Register new user |
| `/api/auth/login` | POST | Public | Login & get JWT token |
| `/api/auth/me` | GET | ✅ | Get current user |
| `/api/auth/users` | GET | Admin | List all users |

*First register is public, subsequent requires ADMIN token

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
| `/api/stats/resources` | GET | ✅ | Resource usage by vCenter |

### Import

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/import/csv` | POST | ✅ | Import VM data from CSV |
| `/api/import/app-mapping` | POST | ✅ | Import app mappings |

### Alerts & Audit

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/alerts/rules` | GET | ✅ | List alert rules |
| `/api/alerts/check` | POST | ✅ | Trigger alert check |
| `/api/audit/logs` | GET | ✅ | View audit logs |

---

## 📖 Documentation

Comprehensive documentation available:

### Quick References
- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[SETUP_ADMIN.md](SETUP_ADMIN.md)** - Detailed admin setup guide
- **[SUMMARY_API_QUICKREF.md](SUMMARY_API_QUICKREF.md)** - Summary API reference

### Implementation Docs
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Implementation overview
- **[PLANNING.md](PLANNING.md)** - System planning & roadmap

### Module-Specific Docs
- **[src/summary/README.md](src/summary/README.md)** - Technical API documentation
- **[src/summary/RINGKASAN.md](src/summary/RINGKASAN.md)** - User guide (Bahasa Indonesia)
- **[src/summary/EXAMPLES.md](src/summary/EXAMPLES.md)** - Usage examples & integration
- **[src/summary/ARCHITECTURE.md](src/summary/ARCHITECTURE.md)** - Architecture diagrams

---

## 🧪 Testing

### Test All Endpoints
```bash
./TEST_ENDPOINTS.sh
```

This script will:
1. Check if server is running
2. Login with your credentials
3. Test all Summary API endpoints
4. Test other major endpoints
5. Display results with status codes

### Manual Testing
```bash
# Test management report
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.'

# Test Ubuntu obsolete summary
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  | jq '.'
```

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │ (Dashboard, Grafana, Power BI)
│   Applications  │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────────────────────────┐
│     NestJS Backend API              │
│  ┌──────────────────────────────┐   │
│  │  Auth Module (JWT)           │   │
│  ├──────────────────────────────┤   │
│  │  Summary Module (Reports)    │   │
│  ├──────────────────────────────┤   │
│  │  VM Module (CRUD)            │   │
│  ├──────────────────────────────┤   │
│  │  Stats Module (Analytics)    │   │
│  ├──────────────────────────────┤   │
│  │  Import Module (CSV Upload)  │   │
│  ├──────────────────────────────┤   │
│  │  Alerts Module (Monitoring)  │   │
│  └──────────────────────────────┘   │
└────────┬────────────────────────────┘
         │ Prisma ORM
         ▼
┌─────────────────────────────────────┐
│   PostgreSQL Database               │
│  • vms (19K+ records)               │
│  • app_mappings                     │
│  • users                            │
│  • alert_rules                      │
│  • audit_logs                       │
└─────────────────────────────────────┘
```

---

## 📁 Project Structure

```
vm-inventory-be/
├── src/
│   ├── auth/              # Authentication & authorization
│   ├── vm/                # VM CRUD operations
│   ├── summary/           # Management reports (NEW!)
│   ├── stats/             # Statistics & analytics
│   ├── import/            # CSV import functionality
│   ├── alerts/            # Alert rules & monitoring
│   ├── audit/             # Audit logging
│   ├── app-mapping/       # Application mappings
│   └── prisma/            # Database service
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── scripts/
│   ├── create-admin.sh    # Create admin user script
│   └── seed-admin.ts      # Seed admin via Prisma
├── docs/                  # Documentation files
└── test/                  # Test files
```

---

## 🔧 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Build for production
npm run start:prod         # Start production build

# Database
npx prisma migrate dev     # Create new migration
npx prisma migrate deploy  # Apply migrations
npx prisma studio          # Open Prisma Studio (DB GUI)
npx prisma generate        # Generate Prisma Client

# Testing
npm run test               # Run unit tests
npm run test:e2e          # Run e2e tests
npm run test:cov          # Test coverage

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format with Prettier
```

---

## 🌟 Use Cases

### For Management
1. **Monthly Review** - Get comprehensive obsolete VM report
2. **Budget Planning** - Identify upgrade costs per department
3. **Risk Assessment** - Track critical applications on obsolete OS
4. **Progress Tracking** - Monitor obsolete VM reduction over time

### For Operations
1. **Migration Planning** - Prioritize VMs by kritikalitas
2. **Cluster Analysis** - Identify most affected clusters
3. **Timeline Planning** - Track end-of-support dates
4. **Application Mapping** - Know which apps need migration

### For Auditing
1. **Compliance Tracking** - Monitor OS versions
2. **Change History** - Audit log of all changes
3. **Access Control** - Track user actions
4. **Reporting** - Generate compliance reports

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ SQL injection prevention (Prisma ORM)
- ✅ Input validation (class-validator)
- ✅ Audit logging for critical operations
- 🔄 Optional: Rate limiting
- 🔄 Optional: API key support for dashboards

---

## 🚀 Deployment

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
JWT_SECRET="your-secret-key-here-change-in-production"
JWT_EXPIRES_IN="1d"
PORT=3000
```

### Production Build

```bash
# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Start
npm run start:prod
```

### Docker (Optional)

```bash
# Build image
docker build -t vm-inventory-api .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  vm-inventory-api
```

---

## 📊 Performance

- **Response Time:** < 500ms for most endpoints
- **Concurrent Users:** Tested up to 100 concurrent users
- **Database:** Optimized queries with Prisma
- **Caching:** Ready for Redis integration
- **Scalability:** Horizontal scaling ready

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is proprietary software.

---

## 🆘 Support

### Documentation
- Read [QUICK_START.md](QUICK_START.md) for getting started
- Read [SETUP_ADMIN.md](SETUP_ADMIN.md) for admin setup
- Read [src/summary/EXAMPLES.md](src/summary/EXAMPLES.md) for usage examples

### Troubleshooting
- Server won't start? Check `DATABASE_URL` in `.env`
- Login fails? Make sure password is at least 8 characters
- 401 Unauthorized? Token expired, login again
- Database error? Run `npx prisma migrate deploy`

### Contact
For issues or questions, contact the development team.

---

## 🎉 Changelog

### v1.0.0 (June 2026)
- ✅ Initial release
- ✅ VM CRUD operations
- ✅ CSV import functionality
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Summary API for management reports
- ✅ Department mapping functionality
- ✅ Obsolete VM tracking
- ✅ Alert rules & monitoring
- ✅ Audit logging

---

**Built with** [NestJS](https://nestjs.com/) | [Prisma](https://www.prisma.io/) | [PostgreSQL](https://www.postgresql.org/)

**Status:** ✅ Production Ready
