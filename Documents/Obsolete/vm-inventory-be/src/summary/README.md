# Summary Module - Management Report API

Module ini menyediakan API untuk membuat summary report yang ditujukan untuk management, dengan fokus pada:
1. Summary obsolete VM Ubuntu di server Production
2. Summary obsolete VM CentOS di server Production  
3. Mapping aplikasi Ubuntu Production dengan departemen dan fungsi
4. Mapping aplikasi CentOS Production dengan departemen dan fungsi

## Endpoints

### 1. GET `/api/summary/management`
**Comprehensive Management Report**

Menghasilkan report lengkap untuk management yang mencakup semua summary dalam satu API call.

**Response Structure:**
```json
{
  "generatedAt": "2026-06-09T10:30:00.000Z",
  "overview": {
    "totalObsoleteUbuntu": 1250,
    "totalObsoleteCentOS": 890,
    "totalProductionVMs": 8500,
    "criticalObsolete": 450
  },
  "ubuntuObsolete": {
    "osType": "Ubuntu",
    "totalObsolete": 1250,
    "totalProduction": 4500,
    "obsoletePercentage": 27.78,
    "byKritikalitas": [
      { "kritikalitas": "Critical", "count": 320 },
      { "kritikalitas": "High", "count": 280 }
    ],
    "byCluster": [
      {
        "cluster": "GTI-COM-FJTS-CL04",
        "count": 85,
        "applications": ["App1", "App2"]
      }
    ],
    "endingSoon": [
      { "year": "2024", "count": 450 },
      { "year": "2026", "count": 300 }
    ]
  },
  "centosObsolete": { /* same structure as ubuntuObsolete */ },
  "ubuntuAppMapping": {
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
  },
  "centosAppMapping": { /* same structure as ubuntuAppMapping */ }
}
```

**Use Case:** Dashboard utama management untuk melihat overview semua obsolete VM dan mapping aplikasi per departemen.

---

### 2. GET `/api/summary/obsolete?osType=Ubuntu`
**Obsolete VM Summary by OS Type**

Summary detail VM obsolete untuk OS tertentu (Ubuntu atau CentOS) di environment Production.

**Query Parameters:**
- `osType` (required): `Ubuntu` atau `CentOS`

**Response:**
```json
{
  "osType": "Ubuntu",
  "totalObsolete": 1250,
  "totalProduction": 4500,
  "obsoletePercentage": 27.78,
  "byKritikalitas": [
    { "kritikalitas": "Critical", "count": 320 },
    { "kritikalitas": "Very High", "count": 280 },
    { "kritikalitas": "High", "count": 210 }
  ],
  "byCluster": [
    {
      "cluster": "GTI-COM-FJTS-CL04",
      "count": 85,
      "applications": ["Core Banking", "Payment Gateway"]
    }
  ],
  "endingSoon": [
    { "year": "2024", "count": 450 },
    { "year": "2026", "count": 300 }
  ]
}
```

**Use Case:** Detail analysis per OS type untuk planning migrasi atau upgrade.

---

### 3. GET `/api/summary/app-mapping?osType=Ubuntu&category=Production`
**Application-Department Mapping**

Mapping aplikasi dengan departemen dan detail VM yang menggunakannya.

**Query Parameters:**
- `osType` (required): `Ubuntu` atau `CentOS`
- `category` (optional, default: `Production`): Category VM

**Response:**
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
            },
            {
              "namaList": "srv-banking-02",
              "cluster": "GTI-COM-FJTS-CL04",
              "ipAddress": "10.10.10.101",
              "guestOs": "Ubuntu Linux (64-bit)"
            }
          ]
        },
        {
          "name": "Payment Gateway",
          "vmCount": 32,
          "kritikalitas": "Very High",
          "owner": "Jane Smith",
          "support24h": "Yes",
          "vms": [ /* ... */ ]
        }
      ]
    },
    {
      "department": "Digital Banking",
      "team": "Mobile Apps",
      "vmCount": 620,
      "applications": [ /* ... */ ]
    }
  ]
}
```

**Use Case:** 
- Management dashboard per departemen
- Planning ownership dan responsibility
- Cost allocation per department

---

### 4. GET `/api/summary/by-department?osType=Ubuntu`
**Department Summary**

Summary ringkas per departemen dengan statistik penting.

**Query Parameters:**
- `osType` (optional): `Ubuntu` atau `CentOS`. Jika tidak diisi, akan menampilkan semua OS.

**Response:**
```json
[
  {
    "department": "IT Operations",
    "totalVMs": 850,
    "obsoleteVMs": 240,
    "criticalVMs": 320,
    "applicationCount": 45,
    "obsoletePercentage": 28.24
  },
  {
    "department": "Digital Banking",
    "totalVMs": 620,
    "obsoleteVMs": 180,
    "criticalVMs": 250,
    "applicationCount": 32,
    "obsoletePercentage": 29.03
  }
]
```

**Use Case:** Quick overview untuk management meeting, sorted by jumlah VM terbanyak.

---

## Data Flow

### Prerequisite
Module ini membutuhkan data dari 2 tabel:
1. **vms** - Data VM inventory
2. **app_mappings** - Mapping aplikasi ke departemen

### Mapping Logic
1. Setiap VM memiliki field `application`
2. Field `application` di-match dengan `aplikasi` di tabel `app_mappings` (case-insensitive)
3. Dari `app_mappings`, kita dapat informasi: `department`, `team`, `applicationOwner`, `support24h`, dll
4. Jika tidak ada mapping, VM akan masuk ke "Unknown Department"

---

## Example Usage

### Management Dashboard - Full Report
```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ubuntu Obsolete Report  
```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### CentOS Obsolete Report
```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=CentOS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ubuntu App-Department Mapping
```bash
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=Ubuntu&category=Production" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Department Summary (All OS)
```bash
curl -X GET http://localhost:3000/api/summary/by-department \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Department Summary (Ubuntu Only)
```bash
curl -X GET "http://localhost:3000/api/summary/by-department?osType=Ubuntu" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes

### Authentication
Semua endpoint dilindungi dengan JWT authentication (`@UseGuards(JwtAuthGuard)`). 
Pastikan menyertakan valid JWT token di header request.

### Performance
- Endpoint `/api/summary/management` melakukan 4 query parallel untuk efisiensi
- Query menggunakan PostgreSQL native untuk performance optimal
- Top 10 cluster limit pada summary obsolete untuk menghindari payload terlalu besar

### Data Quality
- VM tanpa `application` akan di-skip dari app-department mapping
- VM dengan `application` yang tidak ada di `app_mappings` akan masuk "Unknown Department"
- Empty atau null values akan di-handle dengan default values ("Unknown", "Unspecified", etc.)

---

## Future Enhancements

1. **Export to Excel/PDF**
   - Add endpoint untuk download report dalam format Excel atau PDF
   
2. **Scheduled Reports**
   - Auto-generate dan email report ke management secara berkala
   
3. **Trend Analysis**
   - Track perubahan jumlah obsolete VM over time
   
4. **Alert Thresholds**
   - Notifikasi jika obsolete percentage melewati threshold tertentu per department

5. **Drill-down Endpoints**
   - Detail per aplikasi
   - Detail per cluster
   - Timeline comparison
