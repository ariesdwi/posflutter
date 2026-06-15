# VM Inventory — Dashboard & BE Service Planning

> Dataset: **19,311 VMs** · 31 fields · Source: `Bigdata_VM_2026-03-12`

---

## 1. Dashboard Recommendation

### 1.1 Overview / Hero Metrics (Top Cards)

| Card | Value Source | Priority |
|---|---|---|
| Total VMs | `GET /api/vms/stats → total` | P0 |
| OBSOLETE VMs | `byStatusOs.OBSOLETE` (4,935) | P0 |
| Critical VMs | `byKritikalitas.Critical` (7,151) | P0 |
| Production VMs | `byCategory.Production` (14,727) | P0 |
| NEED TO SET | `byStatusOs.NEED TO SET` (3,203) | P1 |
| End Support ≤ 2024 | query `endSupportDate` filter | P0 |

---

### 1.2 Chart Panels

#### Panel A — OS Support Status (Donut)
```
SUPPORTED     11,172  ████████████  57.8%
OBSOLETE       4,935  ██████        25.6%
NEED TO SET    3,203  ████          16.6%
```
**Action:** Click OBSOLETE segment → drill-down table filtered by `statusOs=OBSOLETE`

---

#### Panel B — Kritikalitas Distribution (Bar Horizontal)
```
Critical          7,151 ████████████████████
Dev & Testing     4,040 ███████████
Very High         2,527 ███████
High              1,389 ████
Medium            1,336 ████
CRA               1,231 ███
Unspecified         548 █
```

---

#### Panel C — vCenter Split (Stacked Bar by Category)
```
vCenter     Production   Non-Prod
GTI 2       ~8,000       ~1,900
GTI 1       ~2,700         ~600
ODC 1       ~2,100         ~500
TBN 2       ~2,000         ~560
TBN 1         ~700         ~220
```

---

#### Panel D — End-of-Support Timeline (Line/Area)
```
Year  | Count
2024  | 2,922  ← PAST DUE ⚠
2026  |   432  ← THIS YEAR ⚠
2027  | 1,505
2028  |   591
2029  | 6,139
2030  | 1,619
2032  |   791
```
Highlight years ≤ current year in red.

---

#### Panel E — Cluster Heatmap (Top 10 by VM count)
Metric per cell: VM count, OBSOLETE %, Critical count

```
GTI-COM-FJTS-CL04   836
GTI-COM-HPE-CL14    562
TBN-COM-LNV-CL01    535
GTI-COM-LNV-CL01    538
GTI-COM-FJTS-CL08   641
...
```

---

#### Panel F — Guest OS Distribution (Treemap)
```
Ubuntu Linux (64-bit)          5,778
RHEL 8 (64-bit)                4,191
Win Server 2016+ (64-bit)      2,060
RHEL 9 (64-bit)                1,696
Win Server 2019 (64-bit)       1,024
Win Server 2016 (64-bit)         679
RHEL 7 (64-bit)                  648
Win Server 2008 R2 (64-bit)      597  ← EOL ⚠
```

---

#### Panel G — OBSOLETE VMs Table (Filterable)
Columns: `namaList`, `cluster`, `guestOs`, `endSupportDate`, `kritikalitas`, `application`, `vcenter`
Filter by: cluster, kritikalitas, vcenter, application
Sort by: `endSupportDate ASC`

---

#### Panel H — Resource Summary (Aggregated)
> Requires adding aggregate endpoint to BE

| Metric | Aggregation |
|---|---|
| Total CPUs allocated | `SUM(cpus)` |
| Total Memory allocated | `SUM(memorySize parsed to GB)` |
| Total Provisioned Space | `SUM(provisionedSpace parsed to GB)` |
| Total Used Space | `SUM(usedSpace parsed to GB)` |
| Storage Utilization % | `usedSpace / provisionedSpace * 100` |

---

### 1.3 Recommended Dashboard Tools

| Option | Best For | Stack |
|---|---|---|
| **Grafana** | Ops teams, real-time | PostgreSQL datasource plugin |
| **Apache Superset** | Analytics, ad-hoc queries | SQL-native, self-hosted |
| **Next.js + Recharts** | Custom branded UI | Consumes this NestJS API |
| **Metabase** | Non-technical users | Auto-charts from PostgreSQL |

**Recommendation: Next.js + Recharts** — connects directly to `/api/vms/stats` and `/api/vms`.

---

## 2. BE Service System Plan

### 2.1 Current State ✅
```
POST /api/import/csv       ← CSV upload & batch insert
GET  /api/vms              ← paginated list + filters
GET  /api/vms/stats        ← aggregated counts
GET  /api/vms/:id          ← single record
POST /api/vms              ← create
PATCH /api/vms/:id         ← update
DELETE /api/vms/:id        ← delete

# Management Summary Endpoints ✅
GET  /api/summary/management              ← comprehensive report for management
GET  /api/summary/obsolete?osType=Ubuntu  ← obsolete summary per OS type
GET  /api/summary/app-mapping?osType=...  ← app-department mapping
GET  /api/summary/by-department           ← quick summary per department
```

---

### 2.2 Phase 2 — Monitoring & Analytics Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/vms/stats/resources` | SUM of cpu/memory/storage per cluster/vcenter |
| `GET /api/vms/obsolete` | All OBSOLETE VMs sorted by kritikalitas |
| `GET /api/vms/expiring?days=90` | VMs whose `endSupportDate` is within N days |
| `GET /api/vms/stats/timeline` | Count by `endSupportDate` year |
| `GET /api/vms/stats/os-distribution` | Count by `guestOs` + `osDetail` |
| `GET /api/vms/stats/cluster` | Per-cluster: count, obsolete %, avg cpu |

---

### 2.3 Phase 3 — Data Quality & Alerting

| Feature | Description |
|---|---|
| **Validation on import** | Flag rows with empty `kritikalitas`, `application`, `endSupportDate` |
| **Duplicate detection** | Detect VMs with same `uuid` or same `namaList` + `cluster` |
| **Alert rules table** | `alerts` Prisma model: threshold rules (e.g. OBSOLETE > 20% in cluster) |
| **Scheduled scan** | `@nestjs/schedule` cron: daily check for newly-expired `endSupportDate` |
| **Webhook/notification** | POST to Slack/Teams when alert rule triggers |

---

### 2.4 Phase 4 — Auth & Multi-tenant

| Feature | Stack |
|---|---|
| JWT authentication | `@nestjs/jwt` + `passport-jwt` |
| Role-based access | `ADMIN`, `VIEWER`, `AUDITOR` guards |
| Audit log table | Record every PATCH/DELETE with user + timestamp |
| API key support | For dashboard tools (Grafana, Superset) to query without OAuth |

---

### 2.5 Prisma Schema Additions (Phase 2–3)

```prisma
model AlertRule {
  id        Int      @id @default(autoincrement())
  name      String
  field     String   // e.g. "statusOs", "endSupportDate"
  operator  String   // "eq", "lt", "gt", "contains"
  value     String
  severity  String   // "info", "warning", "critical"
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  @@map("alert_rules")
}

model ImportHistory {
  id         Int      @id @default(autoincrement())
  filename   String
  total      Int
  inserted   Int
  truncated  Boolean
  importedAt DateTime @default(now())
  @@map("import_history")
}
```

---

### 2.6 Recommended Next Steps (Priority Order)

```
P0  Add GET /api/vms/expiring?days=90   ← most urgent for ops team
P0  Add GET /api/vms/stats/resources    ← needed for dashboard Panel H
P1  Add ImportHistory logging           ← audit trail for CSV imports
P1  Add GET /api/vms/stats/timeline     ← dashboard Panel D data
P2  Add @nestjs/schedule daily scan     ← automated expired OS alerts
P2  Add JWT auth                        ← before exposing to network
P3  Build Next.js dashboard frontend    ← consume this API
```

---

### 2.7 Folder Structure (Target)

```
src/
  prisma/
  vm/
    vm.controller.ts
    vm.service.ts
    dto/
  import/
    import.controller.ts
    import.service.ts
  stats/                     ← Phase 2 ✅
    stats.controller.ts
    stats.service.ts
  summary/                   ← Management Reports ✅
    summary.controller.ts
    summary.service.ts
    README.md
  app-mapping/               ← Phase 2 ✅
    app-mapping.controller.ts
    app-mapping.service.ts
  alerts/                    ← Phase 3 ✅
    alerts.controller.ts
    alerts.service.ts
    alerts.scheduler.ts
  auth/                      ← Phase 4 ✅
    auth.module.ts
    jwt.strategy.ts
    guards/
  audit/                     ← Phase 4 ✅
    audit.controller.ts
    audit.service.ts
  common/
    filters/
    interceptors/
    decorators/
```
