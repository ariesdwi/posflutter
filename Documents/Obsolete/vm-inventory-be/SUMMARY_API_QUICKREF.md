# Summary API - Quick Reference

## Overview

Module Summary menyediakan 4 laporan utama yang dibutuhkan management:

1. ✅ Summary obsolete Ubuntu server Production
2. ✅ Summary obsolete CentOS server Production
3. ✅ Mapping aplikasi Ubuntu Production → departemen & fungsi
4. ✅ Mapping aplikasi CentOS Production → departemen & fungsi

---

## Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/summary/management` | **Report lengkap** untuk management (all-in-one) |
| `GET` | `/api/summary/obsolete?osType=Ubuntu` | Summary obsolete Ubuntu Production |
| `GET` | `/api/summary/obsolete?osType=CentOS` | Summary obsolete CentOS Production |
| `GET` | `/api/summary/app-mapping?osType=Ubuntu` | Mapping aplikasi Ubuntu → departemen |
| `GET` | `/api/summary/app-mapping?osType=CentOS` | Mapping aplikasi CentOS → departemen |
| `GET` | `/api/summary/by-department` | Quick summary per departemen (all OS) |
| `GET` | `/api/summary/by-department?osType=Ubuntu` | Quick summary per departemen (Ubuntu only) |

---

## Quick Start

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

### 2. Get Management Report (Recommended)
```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Data Structure

### Management Report Response
```json
{
  "generatedAt": "2026-06-09T10:30:00Z",
  "overview": {
    "totalObsoleteUbuntu": 1250,
    "totalObsoleteCentOS": 890,
    "totalProductionVMs": 8500,
    "criticalObsolete": 450
  },
  "ubuntuObsolete": { /* ObsoleteSummary */ },
  "centosObsolete": { /* ObsoleteSummary */ },
  "ubuntuAppMapping": { /* AppDepartmentMapping */ },
  "centosAppMapping": { /* AppDepartmentMapping */ }
}
```

### ObsoleteSummary Structure
```json
{
  "osType": "Ubuntu",
  "totalObsolete": 1250,
  "totalProduction": 4500,
  "obsoletePercentage": 27.78,
  "byKritikalitas": [
    {"kritikalitas": "Critical", "count": 320}
  ],
  "byCluster": [
    {"cluster": "GTI-COM-FJTS-CL04", "count": 85, "applications": [...]}
  ],
  "endingSoon": [
    {"year": "2024", "count": 450}
  ]
}
```

### AppDepartmentMapping Structure
```json
{
  "osType": "Ubuntu",
  "category": "Production",
  "totalVMs": 4500,
  "departments": [
    {
      "department": "IT Operations",
      "team": "Infrastructure",
      "vmCount": 850,
      "applications": [
        {
          "name": "Core Banking",
          "vmCount": 45,
          "kritikalitas": "Critical",
          "owner": "John Doe",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "srv-banking-01",
              "cluster": "GTI-COM-FJTS-CL04",
              "ipAddress": "10.10.10.100",
              "guestOs": "Ubuntu Linux (64-bit)"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Use Cases

### For Management Dashboard
→ Use: `GET /api/summary/management`
- Overview semua obsolete VM
- Breakdown per OS type
- Mapping aplikasi per departemen
- One API call untuk semua data

### For Migration Planning
→ Use: `GET /api/summary/obsolete?osType=Ubuntu` atau `CentOS`
- Jumlah VM yang perlu di-upgrade
- Prioritas berdasarkan kritikalitas
- Timeline end-of-support
- Cluster yang paling terpengaruh

### For Department Assignment
→ Use: `GET /api/summary/app-mapping?osType=...`
- VM assignment per departemen
- Aplikasi ownership
- Support 24h requirements
- Detail VM per aplikasi

### For Executive Summary
→ Use: `GET /api/summary/by-department`
- Quick stats per departemen
- Obsolete percentage comparison
- Application count per department

---

## Files & Documentation

```
src/summary/
├── summary.service.ts          # Core business logic
├── summary.controller.ts       # API endpoints
├── summary.module.ts           # NestJS module
├── dto/
│   └── query-summary.dto.ts    # Validation schemas
├── README.md                   # Technical documentation (English)
├── RINGKASAN.md               # User guide (Bahasa Indonesia)
└── EXAMPLES.md                # Usage examples & integration code
```

---

## Prerequisites

1. ✅ Tabel `vms` sudah terisi dengan data VM inventory
2. ✅ Tabel `app_mappings` sudah terisi dengan mapping aplikasi → departemen
3. ✅ JWT authentication sudah aktif
4. ✅ User sudah punya credentials untuk login

---

## Next Steps (Future Enhancement)

- [ ] Export to Excel/PDF
- [ ] Scheduled email reports
- [ ] Trend analysis (month-over-month)
- [ ] Alert system for threshold breach
- [ ] Drill-down endpoints per aplikasi/cluster

---

## Support & Contact

Untuk pertanyaan atau customization, hubungi tim development.

**Module Location:** `/src/summary/`  
**Created:** June 2026  
**Version:** 1.0.0
