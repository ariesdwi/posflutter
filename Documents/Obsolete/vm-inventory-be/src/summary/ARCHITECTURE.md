# Summary Module - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT / FRONTEND                          │
│  (Dashboard, Mobile App, Grafana, Power BI, Excel Export)          │
└────────────────┬────────────────────────────────────────────────────┘
                 │ HTTP/REST
                 │ Authorization: Bearer JWT_TOKEN
                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY / NestJS                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    JwtAuthGuard                               │ │
│  │              (Validate JWT Token)                             │ │
│  └───────────────┬──────────────────────────────────────────────┘ │
│                  │ Authorized Request                              │
│                  ▼                                                  │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              SummaryController                                │ │
│  │                                                               │ │
│  │  Routes:                                                      │ │
│  │  • GET /api/summary/management                               │ │
│  │  • GET /api/summary/obsolete?osType=Ubuntu                   │ │
│  │  • GET /api/summary/app-mapping?osType=Ubuntu                │ │
│  │  • GET /api/summary/by-department                            │ │
│  └───────────────┬──────────────────────────────────────────────┘ │
└──────────────────┼──────────────────────────────────────────────────┘
                   │ Delegate to Service
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    SummaryService                             │ │
│  │                                                               │ │
│  │  Methods:                                                     │ │
│  │  • getManagementSummary()                                    │ │
│  │  • getObsoleteSummary(osType)                                │ │
│  │  • getAppDepartmentMapping(osType, category)                 │ │
│  │  • getSummaryByDepartment(osType?)                           │ │
│  │                                                               │ │
│  │  Features:                                                    │ │
│  │  • Parallel query execution (Promise.all)                    │ │
│  │  • Data aggregation & transformation                         │ │
│  │  • Application-Department mapping logic                      │ │
│  └───────────────┬──────────────────────────────────────────────┘ │
└──────────────────┼──────────────────────────────────────────────────┘
                   │ Query Database
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    PrismaService                              │ │
│  │                                                               │ │
│  │  • Prisma Client ORM                                         │ │
│  │  • Query builder                                             │ │
│  │  • Raw SQL for complex aggregations                          │ │
│  │  • Type-safe database access                                 │ │
│  └───────────────┬──────────────────────────────────────────────┘ │
└──────────────────┼──────────────────────────────────────────────────┘
                   │ SQL Queries
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE (PostgreSQL)                        │
│                                                                     │
│  ┌────────────────────────┐  ┌──────────────────────────────────┐ │
│  │   vms Table            │  │   app_mappings Table             │ │
│  │                        │  │                                  │ │
│  │  • 19,311 records      │  │  • aplikasi (PK)                 │ │
│  │  • guestOs             │  │  • department                    │ │
│  │  • statusOs            │  │  • team                          │ │
│  │  • category            │  │  • applicationOwner              │ │
│  │  • kritikalitas        │  │  • kritikalitas                  │ │
│  │  • application         │◄─┼──• support24h                   │ │
│  │  • cluster             │  │  • squadLead                     │ │
│  │  • endSupportDate      │  │                                  │ │
│  │  • ...31 fields total  │  │                                  │ │
│  └────────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Flow 1: Get Management Summary

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ GET /api/summary/management
     │ Authorization: Bearer token
     ▼
┌────────────────┐
│  JwtAuthGuard  │  ← Validate JWT token
└────┬───────────┘
     │ ✓ Authorized
     ▼
┌──────────────────────────┐
│  SummaryController       │
│  getManagementSummary()  │
└────┬─────────────────────┘
     │ Delegate
     ▼
┌──────────────────────────────────────────────────────────────┐
│  SummaryService.getManagementSummary()                       │
│                                                              │
│  Execute in PARALLEL (Promise.all):                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. getObsoleteSummary('Ubuntu')                        │ │
│  │ 2. getObsoleteSummary('CentOS')                        │ │
│  │ 3. getAppDepartmentMapping('Ubuntu', 'Production')     │ │
│  │ 4. getAppDepartmentMapping('CentOS', 'Production')     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Combine results + generate overview                        │
└────┬─────────────────────────────────────────────────────────┘
     │ Return combined report
     ▼
┌──────────┐
│  Client  │  ← Receive complete management report
└──────────┘
```

---

## Flow 2: Get Obsolete Summary (Ubuntu/CentOS)

```
Client
  │
  │ GET /api/summary/obsolete?osType=Ubuntu
  ▼
Controller ──→ Service.getObsoleteSummary('Ubuntu')
                 │
                 ├─→ Query 1: Count total obsolete
                 │     WHERE statusOs = 'OBSOLETE'
                 │     AND category = 'Production'
                 │     AND guestOs ILIKE '%Ubuntu%'
                 │
                 ├─→ Query 2: Count total production
                 │     WHERE category = 'Production'
                 │     AND guestOs ILIKE '%Ubuntu%'
                 │
                 ├─→ Query 3: Group by kritikalitas
                 │     SELECT kritikalitas, COUNT(*)
                 │     GROUP BY kritikalitas
                 │
                 ├─→ Query 4: Group by cluster (Top 10)
                 │     SELECT cluster, COUNT(*), ARRAY_AGG(application)
                 │     GROUP BY cluster
                 │     ORDER BY count DESC
                 │     LIMIT 10
                 │
                 ├─→ Query 5: Group by end support year
                 │     SELECT SUBSTRING(endSupportDate, 1, 4), COUNT(*)
                 │     GROUP BY year
                 │
                 ▼
              Aggregate & format response
                 │
                 ▼
              Return ObsoleteSummary object
                 │
                 ▼
              Client receives:
              {
                "osType": "Ubuntu",
                "totalObsolete": 1250,
                "obsoletePercentage": 27.78,
                "byKritikalitas": [...],
                "byCluster": [...],
                "endingSoon": [...]
              }
```

---

## Flow 3: Get Application-Department Mapping

```
Client
  │
  │ GET /api/summary/app-mapping?osType=Ubuntu&category=Production
  ▼
Controller ──→ Service.getAppDepartmentMapping('Ubuntu', 'Production')
                 │
                 ├─→ Query 1: Get all VMs
                 │     WHERE category = 'Production'
                 │     AND guestOs ILIKE '%Ubuntu%'
                 │     AND application IS NOT NULL
                 │     SELECT namaList, cluster, ipAddress, 
                 │            guestOs, application, kritikalitas
                 │
                 ├─→ Query 2: Get all app_mappings
                 │     SELECT aplikasi, department, team,
                 │            applicationOwner, support24h, kritikalitas
                 │
                 ▼
              MAPPING LOGIC:
              ┌────────────────────────────────────────────────┐
              │ For each VM:                                   │
              │   1. Get VM.application                        │
              │   2. Lookup in app_mappings (case-insensitive) │
              │   3. Get department & team                     │
              │   4. If no match → "Unknown Department"        │
              │                                                │
              │ Group by:                                      │
              │   Department → Team → Application → VMs        │
              │                                                │
              │ Sort by:                                       │
              │   • Departments by vmCount DESC                │
              │   • Applications by vmCount DESC               │
              └────────────────────────────────────────────────┘
                 │
                 ▼
              Return AppDepartmentMapping object
                 │
                 ▼
              Client receives:
              {
                "osType": "Ubuntu",
                "totalVMs": 4500,
                "departments": [
                  {
                    "department": "IT Operations",
                    "vmCount": 850,
                    "applications": [
                      {
                        "name": "Core Banking",
                        "vmCount": 45,
                        "vms": [...]
                      }
                    ]
                  }
                ]
              }
```

---

## Component Interactions

```
┌───────────────────────────────────────────────────────────────┐
│                         app.module.ts                         │
│                                                               │
│  imports: [                                                   │
│    ScheduleModule,                                            │
│    PrismaModule,      ◄───────┐                               │
│    AuthModule,        ◄───┐   │                               │
│    SummaryModule  ◄───┐   │   │                               │
│  ]                    │   │   │                               │
└───────────────────────┼───┼───┼───────────────────────────────┘
                        │   │   │
        ┌───────────────┘   │   │
        │                   │   │
        ▼                   │   │
┌────────────────────────┐ │   │
│   summary.module.ts    │ │   │
│                        │ │   │
│  imports: [            │ │   │
│    PrismaModule  ──────┼─┼───┘
│  ]                     │ │
│                        │ │
│  controllers: [        │ │
│    SummaryController   │ │
│  ]                     │ │
│                        │ │
│  providers: [          │ │
│    SummaryService      │ │
│  ]                     │ │
└────┬────────────────┬──┘ │
     │                │    │
     │                │    │
     ▼                ▼    │
┌──────────────┐ ┌──────────────┐
│   summary.   │ │   summary.   │
│ controller.ts│ │  service.ts  │
│              │ │              │
│  Uses:       │ │  Uses:       │
│  @UseGuards  │─┼──► PrismaService
│  (JwtAuth... │ │              │
│  Guard)      │ │  Implements: │
│              │ │  • Business  │
│  Endpoints:  │ │    logic     │
│  • /management│ │  • Queries   │
│  • /obsolete │ │  • Mapping   │
│  • /app-mapping│ │             │
│  • /by-dept  │ │              │
└──────────────┘ └──────────────┘
```

---

## Database Query Patterns

### Pattern 1: Simple Count
```typescript
await this.prisma.vm.count({
  where: {
    statusOs: 'OBSOLETE',
    category: 'Production',
    guestOs: { contains: 'Ubuntu', mode: 'insensitive' }
  }
});
```

### Pattern 2: Group By with Aggregation (Raw SQL)
```typescript
await this.prisma.$queryRaw`
  SELECT
    kritikalitas,
    COUNT(*) AS count
  FROM vms
  WHERE statusOs = 'OBSOLETE'
    AND category = 'Production'
    AND guestOs ILIKE '%Ubuntu%'
  GROUP BY kritikalitas
  ORDER BY count DESC
`;
```

### Pattern 3: Array Aggregation (PostgreSQL)
```typescript
await this.prisma.$queryRaw`
  SELECT
    cluster,
    COUNT(*) AS count,
    ARRAY_AGG(DISTINCT application) FILTER (WHERE application IS NOT NULL) AS apps
  FROM vms
  WHERE ...
  GROUP BY cluster
  ORDER BY count DESC
  LIMIT 10
`;
```

### Pattern 4: In-Memory Mapping
```typescript
// Get all data first
const vms = await this.prisma.vm.findMany({ where: ... });
const mappings = await this.prisma.appMapping.findMany();

// Create lookup map
const lookupMap = new Map(
  mappings.map(m => [m.aplikasi?.toLowerCase(), m])
);

// Apply mapping logic
for (const vm of vms) {
  const mapping = lookupMap.get(vm.application?.toLowerCase());
  // ... group by department
}
```

---

## Performance Optimization Strategies

### 1. Parallel Query Execution
```typescript
const [ubuntu, centos, ubuntuApp, centosApp] = await Promise.all([
  this.getObsoleteSummary('Ubuntu'),
  this.getObsoleteSummary('CentOS'),
  this.getAppDepartmentMapping('Ubuntu', 'Production'),
  this.getAppDepartmentMapping('CentOS', 'Production'),
]);
```
**Benefit:** 4x faster than sequential queries

### 2. Top N Limits
```sql
SELECT ... LIMIT 10
```
**Benefit:** Reduce payload size, faster response

### 3. Raw SQL for Complex Aggregations
```typescript
await this.prisma.$queryRaw`...`
```
**Benefit:** Better performance than ORM for complex queries

### 4. Database Indexing (Recommended)
```sql
CREATE INDEX idx_vms_status_category_os ON vms(statusOs, category, guestOs);
CREATE INDEX idx_vms_application ON vms(application);
CREATE INDEX idx_app_mappings_aplikasi ON app_mappings(LOWER(aplikasi));
```
**Benefit:** Much faster WHERE and JOIN operations

---

## Error Handling Flow

```
Request
  │
  ├─→ Invalid JWT?
  │     └─→ 401 Unauthorized (by JwtAuthGuard)
  │
  ├─→ Missing osType parameter?
  │     └─→ 400 Bad Request { error: "Please specify osType..." }
  │
  ├─→ Invalid osType value?
  │     └─→ 400 Bad Request { error: "osType must be Ubuntu or CentOS" }
  │
  ├─→ Database connection error?
  │     └─→ 500 Internal Server Error (logged)
  │
  └─→ Success
        └─→ 200 OK with data
```

---

## Module Dependencies

```
SummaryModule
    │
    ├─── depends on ──→ PrismaModule
    │                    (Database access)
    │
    └─── protected by ─→ AuthModule
                          (JwtAuthGuard)
```

---

## Type Safety Flow

```typescript
// Exported interfaces (public API)
export interface ManagementSummary { ... }
export interface ObsoleteSummary { ... }
export interface AppDepartmentMapping { ... }

// Service returns typed data
class SummaryService {
  async getManagementSummary(): Promise<ManagementSummary> { ... }
  async getObsoleteSummary(osType): Promise<ObsoleteSummary> { ... }
}

// Controller uses types
class SummaryController {
  @Get('management')
  async getManagementSummary(): Promise<ManagementSummary> {
    return this.summaryService.getManagementSummary();
  }
}

// Client receives typed JSON
// TypeScript/JavaScript clients can import types for type checking
```

---

## Scalability Considerations

### Current State (19K records)
- ✅ Fast response times
- ✅ No caching needed yet

### Future (100K+ records)
Consider:
1. **Redis Caching**
   - Cache management report for 5-15 minutes
   - Invalidate on data import

2. **Database Read Replicas**
   - Route read-heavy summary queries to replica
   - Keep writes to primary

3. **Pagination**
   - Add pagination to department lists
   - Limit VMs per application display

4. **Background Jobs**
   - Pre-compute summaries nightly
   - Store in materialized views

---

## Security Architecture

```
┌──────────────────────────────────────────────────────┐
│  Internet / External Network                         │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  API Gateway / Load Balancer                         │
│  - HTTPS/TLS encryption                              │
│  - Rate limiting                                     │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│  NestJS Application                                  │
│  ┌────────────────────────────────────────────────┐ │
│  │  1. JwtAuthGuard                               │ │
│  │     - Verify JWT signature                     │ │
│  │     - Check token expiration                   │ │
│  │     - Extract user info                        │ │
│  └────────────────┬───────────────────────────────┘ │
│                   │                                  │
│  ┌────────────────▼───────────────────────────────┐ │
│  │  2. RolesGuard (optional)                      │ │
│  │     - Check user role                          │ │
│  │     - Enforce RBAC policies                    │ │
│  └────────────────┬───────────────────────────────┘ │
│                   │                                  │
│  ┌────────────────▼───────────────────────────────┐ │
│  │  3. Controller Logic                           │ │
│  │     - Input validation                         │ │
│  │     - Business logic                           │ │
│  └────────────────┬───────────────────────────────┘ │
└───────────────────┼──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│  Database (PostgreSQL)                               │
│  - Connection pooling                                │
│  - Prepared statements (SQL injection prevention)    │
│  - Row-level security (optional)                     │
└──────────────────────────────────────────────────────┘
```

**Security Features:**
1. ✅ JWT authentication required
2. ✅ No sensitive data in responses
3. ✅ Parameterized queries (SQL injection safe)
4. ✅ Input validation via DTOs
5. 🔄 Optional: Role-based access control (RBAC)
6. 🔄 Optional: API rate limiting
7. 🔄 Optional: Audit logging

---

This architecture ensures scalability, maintainability, and security while providing comprehensive management reporting capabilities.
