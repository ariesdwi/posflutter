# Summary API - Usage Examples

## Prerequisites

1. Ensure the server is running:
```bash
npm run start:dev
```

2. Get JWT Token (login first):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

Save the token from response, you'll need it for all subsequent requests.

---

## Example 1: Management Dashboard Report

**Full comprehensive report for management meeting**

```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

**Expected Response:**
```json
{
  "generatedAt": "2026-06-09T10:30:00.000Z",
  "overview": {
    "totalObsoleteUbuntu": 1250,
    "totalObsoleteCentOS": 890,
    "totalProductionVMs": 8500,
    "criticalObsolete": 450
  },
  "ubuntuObsolete": { ... },
  "centosObsolete": { ... },
  "ubuntuAppMapping": { ... },
  "centosAppMapping": { ... }
}
```

**Use Case:** Monthly management meeting dashboard

---

## Example 2: Ubuntu Obsolete Summary

**Detailed analysis of Ubuntu obsolete VMs in production**

```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

**Expected Response:**
```json
{
  "osType": "Ubuntu",
  "totalObsolete": 1250,
  "totalProduction": 4500,
  "obsoletePercentage": 27.78,
  "byKritikalitas": [
    {
      "kritikalitas": "Critical",
      "count": 320
    },
    {
      "kritikalitas": "Very High",
      "count": 280
    }
  ],
  "byCluster": [
    {
      "cluster": "GTI-COM-FJTS-CL04",
      "count": 85,
      "applications": ["Core Banking", "Payment Gateway"]
    }
  ],
  "endingSoon": [
    {
      "year": "2024",
      "count": 450
    },
    {
      "year": "2026",
      "count": 300
    }
  ]
}
```

**Use Case:** 
- Planning Ubuntu server migration/upgrade
- Prioritization based on kritikalitas
- Identifying most affected clusters

---

## Example 3: CentOS Obsolete Summary

**Detailed analysis of CentOS obsolete VMs in production**

```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=CentOS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

**Use Case:** 
- Planning CentOS to RHEL/Rocky Linux migration
- Budget estimation per cluster

---

## Example 4: Ubuntu Application-Department Mapping

**Mapping Ubuntu production applications to departments**

```bash
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=Ubuntu&category=Production" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

**Expected Response:**
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

**Use Case:**
- Department-wise resource allocation
- Identifying application owners
- Support planning (24h coverage)
- Cost allocation per department

---

## Example 5: CentOS Application-Department Mapping

**Mapping CentOS production applications to departments**

```bash
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=CentOS&category=Production" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

---

## Example 6: Department Summary (All OS Types)

**Quick overview per department across all OS types**

```bash
curl -X GET http://localhost:3000/api/summary/by-department \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

**Expected Response:**
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

**Use Case:**
- Quick executive dashboard
- Department comparison
- Identifying departments with highest obsolete percentage

---

## Example 7: Department Summary (Ubuntu Only)

**Department summary filtered by Ubuntu OS**

```bash
curl -X GET "http://localhost:3000/api/summary/by-department?osType=Ubuntu" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

---

## Example 8: Department Summary (CentOS Only)

**Department summary filtered by CentOS OS**

```bash
curl -X GET "http://localhost:3000/api/summary/by-department?osType=CentOS" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.'
```

---

## Integration with Frontend Dashboard

### React/Next.js Example

```typescript
// services/summaryService.ts
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

export const summaryService = {
  async getManagementReport(token: string) {
    const response = await axios.get(`${API_BASE}/summary/management`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getObsoleteSummary(osType: 'Ubuntu' | 'CentOS', token: string) {
    const response = await axios.get(`${API_BASE}/summary/obsolete`, {
      params: { osType },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getAppMapping(osType: 'Ubuntu' | 'CentOS', token: string) {
    const response = await axios.get(`${API_BASE}/summary/app-mapping`, {
      params: { osType, category: 'Production' },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getDepartmentSummary(token: string, osType?: 'Ubuntu' | 'CentOS') {
    const response = await axios.get(`${API_BASE}/summary/by-department`, {
      params: osType ? { osType } : {},
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
```

### Dashboard Component Example

```typescript
// components/ManagementDashboard.tsx
import { useEffect, useState } from 'react';
import { summaryService } from '../services/summaryService';

export function ManagementDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const token = localStorage.getItem('jwt_token');
      const report = await summaryService.getManagementReport(token);
      setData(report);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Management Dashboard</h1>
      
      <div className="overview-cards">
        <Card title="Total Obsolete Ubuntu" value={data.overview.totalObsoleteUbuntu} />
        <Card title="Total Obsolete CentOS" value={data.overview.totalObsoleteCentOS} />
        <Card title="Critical Obsolete" value={data.overview.criticalObsolete} />
      </div>

      <div className="charts">
        <ObsoleteChart data={data.ubuntuObsolete} />
        <ObsoleteChart data={data.centosObsolete} />
      </div>

      <div className="department-mapping">
        <DepartmentTable data={data.ubuntuAppMapping} />
        <DepartmentTable data={data.centosAppMapping} />
      </div>
    </div>
  );
}
```

---

## Export to Excel (Future Enhancement)

```bash
# Will be implemented as:
curl -X GET "http://localhost:3000/api/summary/management/export?format=xlsx" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output management-report.xlsx
```

---

## Scheduled Email Reports (Future Enhancement)

```bash
# Configure scheduled report:
curl -X POST http://localhost:3000/api/summary/schedule \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "frequency": "weekly",
    "recipients": ["manager1@company.com", "manager2@company.com"],
    "reportType": "management",
    "dayOfWeek": "monday",
    "hour": 9
  }'
```

---

## Tips

### Using jq for Better Formatting
Install jq: `brew install jq` (macOS)

### Save to File
```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  > management-report.json
```

### Filter Specific Department
```bash
curl -X GET http://localhost:3000/api/summary/by-department \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '.[] | select(.department == "IT Operations")'
```

### Count Total Obsolete
```bash
curl -X GET http://localhost:3000/api/summary/by-department \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  | jq '[.[].obsoleteVMs] | add'
```
