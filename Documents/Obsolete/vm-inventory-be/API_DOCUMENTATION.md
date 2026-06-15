# API Documentation - VM Inventory Backend

**Base URL:** `http://localhost:3000/api`

**Authentication:** Bearer Token (JWT) diperlukan untuk semua endpoint

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Summary - Obsolete Ubuntu](#1-summary-obsolete-ubuntu-server-production)
3. [Summary - Obsolete CentOS](#2-summary-obsolete-centos-server-production)
4. [App Mapping - Ubuntu](#3-mapping-aplikasi-ubuntu-production)
5. [App Mapping - CentOS](#4-mapping-aplikasi-centos-production)
6. [Management Summary](#5-management-summary-comprehensive)
7. [Summary Per Departemen](#6-summary-per-departemen)

---

## Authentication

### Login
```bash
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin123456"
}
```

**Response (200 OK):**
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


---

## 1. ✅ Summary Obsolete Ubuntu Server Production

**Endpoint:**
```
GET /api/summary/obsolete?osType=Ubuntu
```

**Description:** 
Mendapatkan ringkasan lengkap VM Ubuntu yang sudah obsolete di environment Production, termasuk breakdown per kritikalitas, top 10 cluster, dan timeline end-of-support.

**Query Parameters:**
- `osType` (required): `Ubuntu`

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "osType": "Ubuntu",
  "totalObsolete": 145,
  "totalProduction": 320,
  "obsoletePercentage": 45.31,
  "byKritikalitas": [
    {
      "kritikalitas": "Critical",
      "count": 58
    },
    {
      "kritikalitas": "High",
      "count": 42
    },
    {
      "kritikalitas": "Medium",
      "count": 30
    },
    {
      "kritikalitas": "Low",
      "count": 15
    }
  ],
  "byCluster": [
    {
      "cluster": "CLS-PROD-01",
      "count": 28,
      "applications": ["E-Banking", "Core Banking", "ATM Switch"]
    },
    {
      "cluster": "CLS-PROD-02",
      "count": 22,
      "applications": ["Mobile Banking", "Internet Banking"]
    },
    {
      "cluster": "CLS-PROD-03",
      "count": 18,
      "applications": ["Payment Gateway", "Settlement"]
    },
    {
      "cluster": "CLS-PROD-04",
      "count": 15,
      "applications": ["CRM", "Customer Portal"]
    },
    {
      "cluster": "CLS-PROD-05",
      "count": 12,
      "applications": ["Reporting", "Analytics"]
    },
    {
      "cluster": "CLS-PROD-06",
      "count": 10,
      "applications": ["Middleware", "ESB"]
    },
    {
      "cluster": "CLS-PROD-07",
      "count": 8,
      "applications": ["Backup System"]
    },
    {
      "cluster": "CLS-PROD-08",
      "count": 7,
      "applications": ["Monitoring"]
    },
    {
      "cluster": "CLS-PROD-09",
      "count": 6,
      "applications": ["Security Gateway"]
    },
    {
      "cluster": "CLS-PROD-10",
      "count": 5,
      "applications": ["Document Management"]
    }
  ],
  "endingSoon": [
    {
      "year": "2023",
      "count": 35
    },
    {
      "year": "2024",
      "count": 48
    },
    {
      "year": "2025",
      "count": 32
    },
    {
      "year": "2026",
      "count": 20
    },
    {
      "year": "2027",
      "count": 10
    }
  ]
}
```

**Response Fields:**
- `osType`: Tipe OS yang diminta (Ubuntu)
- `totalObsolete`: Total jumlah VM yang sudah obsolete
- `totalProduction`: Total jumlah VM Production untuk OS ini
- `obsoletePercentage`: Persentase VM obsolete dari total production
- `byKritikalitas`: Array breakdown per tingkat kritikalitas
- `byCluster`: Array top 10 cluster dengan VM obsolete terbanyak
  - `applications`: List aplikasi yang berjalan di cluster tersebut
- `endingSoon`: Timeline end-of-support per tahun

---


## 2. ✅ Summary Obsolete CentOS Server Production

**Endpoint:**
```
GET /api/summary/obsolete?osType=CentOS
```

**Description:** 
Mendapatkan ringkasan lengkap VM CentOS yang sudah obsolete di environment Production, dengan struktur data yang sama seperti Ubuntu.

**Query Parameters:**
- `osType` (required): `CentOS`

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=CentOS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "osType": "CentOS",
  "totalObsolete": 98,
  "totalProduction": 215,
  "obsoletePercentage": 45.58,
  "byKritikalitas": [
    {
      "kritikalitas": "Critical",
      "count": 42
    },
    {
      "kritikalitas": "High",
      "count": 31
    },
    {
      "kritikalitas": "Medium",
      "count": 18
    },
    {
      "kritikalitas": "Low",
      "count": 7
    }
  ],
  "byCluster": [
    {
      "cluster": "CLS-CORE-01",
      "count": 24,
      "applications": ["Core System", "Database Server"]
    },
    {
      "cluster": "CLS-CORE-02",
      "count": 19,
      "applications": ["Application Server"]
    },
    {
      "cluster": "CLS-WEB-01",
      "count": 15,
      "applications": ["Web Server", "Portal"]
    },
    {
      "cluster": "CLS-APP-01",
      "count": 12,
      "applications": ["Business Apps"]
    },
    {
      "cluster": "CLS-BACKUP-01",
      "count": 8,
      "applications": ["Backup Server"]
    },
    {
      "cluster": "CLS-MONITORING",
      "count": 6,
      "applications": ["Monitoring Tools"]
    },
    {
      "cluster": "CLS-FILE-01",
      "count": 5,
      "applications": ["File Server"]
    },
    {
      "cluster": "CLS-EMAIL-01",
      "count": 4,
      "applications": ["Email Server"]
    },
    {
      "cluster": "CLS-DNS-01",
      "count": 3,
      "applications": ["DNS Server"]
    },
    {
      "cluster": "CLS-PROXY-01",
      "count": 2,
      "applications": ["Proxy Server"]
    }
  ],
  "endingSoon": [
    {
      "year": "2023",
      "count": 28
    },
    {
      "year": "2024",
      "count": 41
    },
    {
      "year": "2025",
      "count": 19
    },
    {
      "year": "2026",
      "count": 10
    }
  ]
}
```

**Response Fields:**
Sama seperti endpoint Ubuntu, dengan `osType` yang berbeda.

---


## 3. ✅ Mapping Aplikasi Ubuntu Production → Departemen & Fungsi

**Endpoint:**
```
GET /api/summary/app-mapping?osType=Ubuntu&category=Production
```

**Description:** 
Mendapatkan mapping lengkap aplikasi Ubuntu Production ke departemen dan team, termasuk detail VM per aplikasi dengan informasi owner, kritikalitas, dan support 24h.

**Query Parameters:**
- `osType` (required): `Ubuntu`
- `category` (optional, default: `Production`): Environment category

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=Ubuntu&category=Production" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "osType": "Ubuntu",
  "category": "Production",
  "totalVMs": 320,
  "departments": [
    {
      "department": "IT & Digital Banking",
      "team": "Digital Channels",
      "vmCount": 85,
      "applications": [
        {
          "name": "Mobile Banking",
          "vmCount": 24,
          "kritikalitas": "Critical",
          "owner": "John Doe",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-MBANK-APP-01",
              "cluster": "CLS-PROD-01",
              "ipAddress": "10.10.1.15",
              "guestOs": "Ubuntu 18.04.6 LTS"
            },
            {
              "namaList": "PROD-MBANK-APP-02",
              "cluster": "CLS-PROD-01",
              "ipAddress": "10.10.1.16",
              "guestOs": "Ubuntu 18.04.6 LTS"
            },
            {
              "namaList": "PROD-MBANK-WEB-01",
              "cluster": "CLS-PROD-02",
              "ipAddress": "10.10.2.20",
              "guestOs": "Ubuntu 20.04.3 LTS"
            }
          ]
        },
        {
          "name": "Internet Banking",
          "vmCount": 18,
          "kritikalitas": "Critical",
          "owner": "Jane Smith",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-IBANK-APP-01",
              "cluster": "CLS-PROD-01",
              "ipAddress": "10.10.1.25",
              "guestOs": "Ubuntu 20.04.3 LTS"
            },
            {
              "namaList": "PROD-IBANK-APP-02",
              "cluster": "CLS-PROD-01",
              "ipAddress": "10.10.1.26",
              "guestOs": "Ubuntu 20.04.3 LTS"
            }
          ]
        },
        {
          "name": "E-Banking Portal",
          "vmCount": 15,
          "kritikalitas": "High",
          "owner": "Mike Johnson",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-EBANK-WEB-01",
              "cluster": "CLS-PROD-02",
              "ipAddress": "10.10.2.30",
              "guestOs": "Ubuntu 18.04.6 LTS"
            }
          ]
        }
      ]
    },
    {
      "department": "Core Banking",
      "team": "Core Systems",
      "vmCount": 62,
      "applications": [
        {
          "name": "Core Banking System",
          "vmCount": 35,
          "kritikalitas": "Critical",
          "owner": "Sarah Williams",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-CBS-APP-01",
              "cluster": "CLS-CORE-01",
              "ipAddress": "10.20.1.10",
              "guestOs": "Ubuntu 18.04.6 LTS"
            },
            {
              "namaList": "PROD-CBS-APP-02",
              "cluster": "CLS-CORE-01",
              "ipAddress": "10.20.1.11",
              "guestOs": "Ubuntu 18.04.6 LTS"
            }
          ]
        },
        {
          "name": "ATM Switch",
          "vmCount": 27,
          "kritikalitas": "Critical",
          "owner": "Robert Brown",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-ATM-SW-01",
              "cluster": "CLS-CORE-02",
              "ipAddress": "10.20.2.15",
              "guestOs": "Ubuntu 20.04.3 LTS"
            }
          ]
        }
      ]
    },
    {
      "department": "Payment & Settlement",
      "team": "Payment Systems",
      "vmCount": 45,
      "applications": [
        {
          "name": "Payment Gateway",
          "vmCount": 28,
          "kritikalitas": "Critical",
          "owner": "David Lee",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-PAYMENT-GW-01",
              "cluster": "CLS-PROD-03",
              "ipAddress": "10.30.1.20",
              "guestOs": "Ubuntu 20.04.3 LTS"
            }
          ]
        },
        {
          "name": "Settlement System",
          "vmCount": 17,
          "kritikalitas": "High",
          "owner": "Emily Davis",
          "support24h": "No",
          "vms": []
        }
      ]
    }
  ]
}
```

**Response Fields:**
- `osType`: Tipe OS yang diminta
- `category`: Environment category
- `totalVMs`: Total jumlah VM
- `departments`: Array departemen (sorted by vmCount desc)
  - `department`: Nama departemen
  - `team`: Nama team (bisa null)
  - `vmCount`: Total VM di departemen ini
  - `applications`: Array aplikasi di departemen ini (sorted by vmCount desc)
    - `name`: Nama aplikasi
    - `vmCount`: Jumlah VM untuk aplikasi ini
    - `kritikalitas`: Tingkat kritikalitas (Critical/High/Medium/Low)
    - `owner`: Application owner
    - `support24h`: Apakah ada support 24 jam (Yes/No/Unknown)
    - `vms`: Array detail VM untuk aplikasi ini
      - `namaList`: Hostname VM
      - `cluster`: Nama cluster
      - `ipAddress`: IP address
      - `guestOs`: Guest OS detail

---


## 4. ✅ Mapping Aplikasi CentOS Production → Departemen & Fungsi

**Endpoint:**
```
GET /api/summary/app-mapping?osType=CentOS&category=Production
```

**Description:** 
Mendapatkan mapping lengkap aplikasi CentOS Production ke departemen dan team, dengan struktur data yang sama seperti Ubuntu.

**Query Parameters:**
- `osType` (required): `CentOS`
- `category` (optional, default: `Production`): Environment category

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=CentOS&category=Production" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "osType": "CentOS",
  "category": "Production",
  "totalVMs": 215,
  "departments": [
    {
      "department": "Infrastructure & Operations",
      "team": "Infrastructure Team",
      "vmCount": 72,
      "applications": [
        {
          "name": "Database Server",
          "vmCount": 35,
          "kritikalitas": "Critical",
          "owner": "Tom Anderson",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-DB-01",
              "cluster": "CLS-CORE-01",
              "ipAddress": "10.40.1.10",
              "guestOs": "CentOS Linux 7.9.2009"
            },
            {
              "namaList": "PROD-DB-02",
              "cluster": "CLS-CORE-01",
              "ipAddress": "10.40.1.11",
              "guestOs": "CentOS Linux 7.9.2009"
            },
            {
              "namaList": "PROD-DB-03",
              "cluster": "CLS-CORE-02",
              "ipAddress": "10.40.2.10",
              "guestOs": "CentOS Linux 8.5.2111"
            }
          ]
        },
        {
          "name": "Web Server",
          "vmCount": 22,
          "kritikalitas": "High",
          "owner": "Lisa Chen",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-WEB-01",
              "cluster": "CLS-WEB-01",
              "ipAddress": "10.50.1.20",
              "guestOs": "CentOS Linux 7.9.2009"
            },
            {
              "namaList": "PROD-WEB-02",
              "cluster": "CLS-WEB-01",
              "ipAddress": "10.50.1.21",
              "guestOs": "CentOS Linux 7.9.2009"
            }
          ]
        },
        {
          "name": "Application Server",
          "vmCount": 15,
          "kritikalitas": "High",
          "owner": "Mark Wilson",
          "support24h": "No",
          "vms": [
            {
              "namaList": "PROD-APP-01",
              "cluster": "CLS-APP-01",
              "ipAddress": "10.60.1.15",
              "guestOs": "CentOS Linux 8.5.2111"
            }
          ]
        }
      ]
    },
    {
      "department": "Business Applications",
      "team": "ERP Team",
      "vmCount": 48,
      "applications": [
        {
          "name": "ERP System",
          "vmCount": 28,
          "kritikalitas": "Critical",
          "owner": "Nancy Taylor",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-ERP-APP-01",
              "cluster": "CLS-APP-01",
              "ipAddress": "10.70.1.25",
              "guestOs": "CentOS Linux 7.9.2009"
            },
            {
              "namaList": "PROD-ERP-APP-02",
              "cluster": "CLS-APP-01",
              "ipAddress": "10.70.1.26",
              "guestOs": "CentOS Linux 7.9.2009"
            }
          ]
        },
        {
          "name": "CRM System",
          "vmCount": 20,
          "kritikalitas": "Medium",
          "owner": "Paul Martinez",
          "support24h": "No",
          "vms": [
            {
              "namaList": "PROD-CRM-APP-01",
              "cluster": "CLS-APP-02",
              "ipAddress": "10.70.2.30",
              "guestOs": "CentOS Linux 8.5.2111"
            }
          ]
        }
      ]
    },
    {
      "department": "Monitoring & Operations",
      "team": null,
      "vmCount": 38,
      "applications": [
        {
          "name": "Monitoring System",
          "vmCount": 22,
          "kritikalitas": "High",
          "owner": "Kevin White",
          "support24h": "Yes",
          "vms": [
            {
              "namaList": "PROD-MON-01",
              "cluster": "CLS-MONITORING",
              "ipAddress": "10.80.1.10",
              "guestOs": "CentOS Linux 7.9.2009"
            }
          ]
        },
        {
          "name": "Backup Server",
          "vmCount": 16,
          "kritikalitas": "Medium",
          "owner": "Rachel Green",
          "support24h": "No",
          "vms": []
        }
      ]
    }
  ]
}
```

**Response Fields:**
Sama seperti endpoint Ubuntu, dengan `osType` yang berbeda.

---

## 5. 📊 Management Summary (Comprehensive)

**Endpoint:**
```
GET /api/summary/management
```

**Description:** 
Mendapatkan comprehensive management report yang menggabungkan semua summary (obsolete + app mapping) untuk Ubuntu dan CentOS dalam satu response.

**Request Example:**
```bash
curl -X GET "http://localhost:3000/api/summary/management" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK):**
```json
{
  "generatedAt": "2026-06-09T10:30:00.000Z",
  "overview": {
    "totalObsoleteUbuntu": 145,
    "totalObsoleteCentOS": 98,
    "totalProductionVMs": 535,
    "criticalObsolete": 100
  },
  "ubuntuObsolete": {
    "osType": "Ubuntu",
    "totalObsolete": 145,
    "totalProduction": 320,
    "obsoletePercentage": 45.31,
    "byKritikalitas": [
      {
        "kritikalitas": "Critical",
        "count": 58
      },
      {
        "kritikalitas": "High",
        "count": 42
      }
    ],
    "byCluster": [
      {
        "cluster": "CLS-PROD-01",
        "count": 28,
        "applications": ["E-Banking", "Core Banking"]
      }
    ],
    "endingSoon": [
      {
        "year": "2023",
        "count": 35
      },
      {
        "year": "2024",
        "count": 48
      }
    ]
  },
  "centosObsolete": {
    "osType": "CentOS",
    "totalObsolete": 98,
    "totalProduction": 215,
    "obsoletePercentage": 45.58,
    "byKritikalitas": [
      {
        "kritikalitas": "Critical",
        "count": 42
      }
    ],
    "byCluster": [
      {
        "cluster": "CLS-CORE-01",
        "count": 24,
        "applications": ["Core System"]
      }
    ],
    "endingSoon": [
      {
        "year": "2023",
        "count": 28
      }
    ]
  },
  "ubuntuAppMapping": {
    "osType": "Ubuntu",
    "category": "Production",
    "totalVMs": 320,
    "departments": [
      {
        "department": "IT & Digital Banking",
        "team": "Digital Channels",
        "vmCount": 85,
        "applications": [
          {
            "name": "Mobile Banking",
            "vmCount": 24,
            "kritikalitas": "Critical",
            "owner": "John Doe",
            "support24h": "Yes",
            "vms": [
              {
                "namaList": "PROD-MBANK-APP-01",
                "cluster": "CLS-PROD-01",
                "ipAddress": "10.10.1.15",
                "guestOs": "Ubuntu 18.04.6 LTS"
              }
            ]
          }
        ]
      }
    ]
  },
  "centosAppMapping": {
    "osType": "CentOS",
    "category": "Production",
    "totalVMs": 215,
    "departments": [
      {
        "department": "Infrastructure & Operations",
        "team": "Infrastructure Team",
        "vmCount": 72,
        "applications": [
          {
            "name": "Database Server",
            "vmCount": 35,
            "kritikalitas": "Critical",
            "owner": "Tom Anderson",
            "support24h": "Yes",
            "vms": []
          }
        ]
      }
    ]
  }
}
```

**Response Fields:**
- `generatedAt`: Timestamp when report was generated
- `overview`: Quick summary overview
  - `totalObsoleteUbuntu`: Total obsolete Ubuntu VMs
  - `totalObsoleteCentOS`: Total obsolete CentOS VMs
  - `totalProductionVMs`: Total production VMs (Ubuntu + CentOS)
  - `criticalObsolete`: Total critical obsolete VMs
- `ubuntuObsolete`: Full obsolete summary for Ubuntu (sama dengan endpoint #1)
- `centosObsolete`: Full obsolete summary for CentOS (sama dengan endpoint #2)
- `ubuntuAppMapping`: Full app mapping for Ubuntu (sama dengan endpoint #3)
- `centosAppMapping`: Full app mapping for CentOS (sama dengan endpoint #4)

**Use Case:**
Endpoint ini perfect untuk management dashboard yang butuh semua data dalam satu API call, mengurangi jumlah request dan mempercepat loading dashboard.

---

## 6. 📊 Summary Per Departemen

**Endpoint:**
```
GET /api/summary/by-department
GET /api/summary/by-department?osType=Ubuntu
GET /api/summary/by-department?osType=CentOS
```

**Description:** 
Mendapatkan quick overview statistik per departemen dengan informasi total VMs, obsolete VMs, critical VMs, dan jumlah aplikasi. Filter by OS type adalah optional.

**Query Parameters:**
- `osType` (optional): `Ubuntu` | `CentOS` - Jika tidak disertakan, akan menampilkan semua OS

**Request Examples:**

### All OS Types
```bash
curl -X GET "http://localhost:3000/api/summary/by-department" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Ubuntu Only
```bash
curl -X GET "http://localhost:3000/api/summary/by-department?osType=Ubuntu" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### CentOS Only
```bash
curl -X GET "http://localhost:3000/api/summary/by-department?osType=CentOS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200 OK) - All OS:**
```json
[
  {
    "department": "IT & Digital Banking",
    "totalVMs": 142,
    "obsoleteVMs": 68,
    "criticalVMs": 95,
    "applicationCount": 12,
    "obsoletePercentage": 47.89
  },
  {
    "department": "Core Banking",
    "totalVMs": 98,
    "obsoleteVMs": 45,
    "criticalVMs": 72,
    "applicationCount": 8,
    "obsoletePercentage": 45.92
  },
  {
    "department": "Infrastructure & Operations",
    "totalVMs": 85,
    "obsoleteVMs": 38,
    "criticalVMs": 51,
    "applicationCount": 10,
    "obsoletePercentage": 44.71
  },
  {
    "department": "Payment & Settlement",
    "totalVMs": 67,
    "obsoleteVMs": 32,
    "criticalVMs": 45,
    "applicationCount": 6,
    "obsoletePercentage": 47.76
  },
  {
    "department": "Business Applications",
    "totalVMs": 54,
    "obsoleteVMs": 22,
    "criticalVMs": 28,
    "applicationCount": 5,
    "obsoletePercentage": 40.74
  },
  {
    "department": "Monitoring & Operations",
    "totalVMs": 42,
    "obsoleteVMs": 18,
    "criticalVMs": 22,
    "applicationCount": 4,
    "obsoletePercentage": 42.86
  },
  {
    "department": "Security & Compliance",
    "totalVMs": 28,
    "obsoleteVMs": 12,
    "criticalVMs": 18,
    "applicationCount": 3,
    "obsoletePercentage": 42.86
  },
  {
    "department": "Unknown Department",
    "totalVMs": 19,
    "obsoleteVMs": 8,
    "criticalVMs": 5,
    "applicationCount": 7,
    "obsoletePercentage": 42.11
  }
]
```

**Response (200 OK) - Ubuntu Only:**
```json
[
  {
    "department": "IT & Digital Banking",
    "totalVMs": 85,
    "obsoleteVMs": 42,
    "criticalVMs": 58,
    "applicationCount": 8,
    "obsoletePercentage": 49.41
  },
  {
    "department": "Core Banking",
    "totalVMs": 62,
    "obsoleteVMs": 28,
    "criticalVMs": 45,
    "applicationCount": 5,
    "obsoletePercentage": 45.16
  },
  {
    "department": "Payment & Settlement",
    "totalVMs": 45,
    "obsoleteVMs": 22,
    "criticalVMs": 28,
    "applicationCount": 4,
    "obsoletePercentage": 48.89
  },
  {
    "department": "Business Applications",
    "totalVMs": 38,
    "obsoleteVMs": 16,
    "criticalVMs": 20,
    "applicationCount": 3,
    "obsoletePercentage": 42.11
  },
  {
    "department": "Security & Compliance",
    "totalVMs": 28,
    "obsoleteVMs": 12,
    "criticalVMs": 18,
    "applicationCount": 3,
    "obsoletePercentage": 42.86
  },
  {
    "department": "Monitoring & Operations",
    "totalVMs": 24,
    "obsoleteVMs": 10,
    "criticalVMs": 12,
    "applicationCount": 2,
    "obsoletePercentage": 41.67
  },
  {
    "department": "Unknown Department",
    "totalVMs": 12,
    "obsoleteVMs": 5,
    "criticalVMs": 3,
    "applicationCount": 4,
    "obsoletePercentage": 41.67
  }
]
```

**Response (200 OK) - CentOS Only:**
```json
[
  {
    "department": "Infrastructure & Operations",
    "totalVMs": 72,
    "obsoleteVMs": 35,
    "criticalVMs": 48,
    "applicationCount": 8,
    "obsoletePercentage": 48.61
  },
  {
    "department": "IT & Digital Banking",
    "totalVMs": 57,
    "obsoleteVMs": 26,
    "criticalVMs": 37,
    "applicationCount": 6,
    "obsoletePercentage": 45.61
  },
  {
    "department": "Core Banking",
    "totalVMs": 36,
    "obsoleteVMs": 17,
    "criticalVMs": 27,
    "applicationCount": 4,
    "obsoletePercentage": 47.22
  },
  {
    "department": "Payment & Settlement",
    "totalVMs": 22,
    "obsoleteVMs": 10,
    "criticalVMs": 17,
    "applicationCount": 3,
    "obsoletePercentage": 45.45
  },
  {
    "department": "Monitoring & Operations",
    "totalVMs": 18,
    "obsoleteVMs": 8,
    "criticalVMs": 10,
    "applicationCount": 2,
    "obsoletePercentage": 44.44
  },
  {
    "department": "Business Applications",
    "totalVMs": 16,
    "obsoleteVMs": 6,
    "criticalVMs": 8,
    "applicationCount": 2,
    "obsoletePercentage": 37.50
  },
  {
    "department": "Unknown Department",
    "totalVMs": 7,
    "obsoleteVMs": 3,
    "criticalVMs": 2,
    "applicationCount": 3,
    "obsoletePercentage": 42.86
  }
]
```

**Response Fields:**
- `department`: Nama departemen
- `totalVMs`: Total jumlah VM di departemen ini
- `obsoleteVMs`: Jumlah VM yang sudah obsolete
- `criticalVMs`: Jumlah VM dengan kritikalitas Critical
- `applicationCount`: Jumlah aplikasi unik di departemen ini
- `obsoletePercentage`: Persentase VM obsolete (dihitung dari totalVMs)

**Sorting:**
Response selalu di-sort berdasarkan `totalVMs` descending (departemen dengan VM terbanyak di atas).

**Use Cases:**

### 1. Department Overview Dashboard
```bash
GET /api/summary/by-department
```
Perfect untuk menampilkan quick stats per departemen dalam bentuk table atau card.

### 2. Ubuntu Migration Planning
```bash
GET /api/summary/by-department?osType=Ubuntu
```
Focus pada departemen mana yang memiliki paling banyak Ubuntu obsolete servers.

### 3. CentOS EOL Planning
```bash
GET /api/summary/by-department?osType=CentOS
```
Identify departemen yang paling terdampak oleh CentOS EOL.

### 4. Priority Planning
Sort by `obsoletePercentage` atau `criticalVMs` di frontend untuk menentukan departemen mana yang harus diprioritaskan untuk migration.

---

## Error Responses

### Missing or Invalid osType
```json
{
  "error": "Please specify osType as Ubuntu or CentOS"
}
```

### Unauthorized (No Token)
**Status Code:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Invalid Token
**Status Code:** 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid token"
}
```

---


## 📝 Quick Test Commands

### 1. Login and Get Token
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123456"}' | jq -r '.access_token')

echo "Token: $TOKEN"
```

### 2. Test All Endpoints
```bash
# Ubuntu Obsolete Summary
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# CentOS Obsolete Summary
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=CentOS" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Ubuntu App Mapping
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=Ubuntu&category=Production" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# CentOS App Mapping
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=CentOS&category=Production" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Management Summary (All in One)
curl -X GET "http://localhost:3000/api/summary/management" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Summary by Department (All OS)
curl -X GET "http://localhost:3000/api/summary/by-department" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Summary by Department (Ubuntu Only)
curl -X GET "http://localhost:3000/api/summary/by-department?osType=Ubuntu" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Summary by Department (CentOS Only)
curl -X GET "http://localhost:3000/api/summary/by-department?osType=CentOS" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---


## 🔍 Use Cases

### For Management Dashboard
```bash
# Get comprehensive overview for management presentation
GET /api/summary/management
```
Returns all data in one call - perfect for dashboard yang menampilkan overview lengkap.

### For Department Quick Stats
```bash
# Quick overview all departments (all OS)
GET /api/summary/by-department

# Department stats for Ubuntu only
GET /api/summary/by-department?osType=Ubuntu

# Department stats for CentOS only
GET /api/summary/by-department?osType=CentOS
```
Returns quick stats per department - perfect untuk table atau card view.

### For OS-Specific Analysis
```bash
# Focus on Ubuntu obsolete servers only
GET /api/summary/obsolete?osType=Ubuntu

# Focus on CentOS obsolete servers only
GET /api/summary/obsolete?osType=CentOS
```
Returns detailed breakdown per OS untuk analisis spesifik.

### For Department Detailed View
```bash
# See Ubuntu apps organized by department
GET /api/summary/app-mapping?osType=Ubuntu&category=Production

# See CentOS apps organized by department
GET /api/summary/app-mapping?osType=CentOS&category=Production
```
Returns hierarchical view: Department → Team → Application → VMs

### For Drill-Down Analysis
1. Start with **by-department** untuk quick overview per departemen
2. Drill ke **management summary** untuk full picture
3. Drill ke specific OS dengan **obsolete endpoint**
4. Drill ke specific department dengan **app-mapping endpoint**
5. Drill ke specific VM details dari vms array

---

## 📊 Data Highlights

### Key Metrics Available:
- ✅ Total obsolete VMs per OS
- ✅ Obsolete percentage
- ✅ Breakdown by kritikalitas (Critical/High/Medium/Low)
- ✅ Top 10 clusters dengan VM obsolete terbanyak
- ✅ Timeline end-of-support per tahun
- ✅ Mapping aplikasi ke departemen & team
- ✅ Detail VM per aplikasi (hostname, IP, cluster, OS)
- ✅ Application owner & support info

---

**Last Updated:** June 9, 2026  
**API Version:** 1.0.0  
**Backend:** NestJS + Prisma + PostgreSQL
