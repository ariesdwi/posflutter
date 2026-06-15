# Summary Module - Laporan untuk Management

## Ringkasan

Module ini telah dibuat untuk menyediakan **4 jenis laporan** yang dibutuhkan management:

### 1. ✅ Summary Obsolete Ubuntu Server Production
**Endpoint:** `GET /api/summary/obsolete?osType=Ubuntu`

Memberikan informasi:
- Total VM Ubuntu obsolete di Production
- Persentase obsolete dari total Ubuntu Production
- Breakdown per kritikalitas (Critical, High, Very High, dll)
- Top 10 cluster yang paling banyak VM obsolete-nya
- Timeline end-of-support per tahun

### 2. ✅ Summary Obsolete CentOS Server Production  
**Endpoint:** `GET /api/summary/obsolete?osType=CentOS`

Sama seperti Ubuntu, tapi khusus untuk CentOS.

### 3. ✅ Mapping Aplikasi Ubuntu Production → Departemen & Fungsi
**Endpoint:** `GET /api/summary/app-mapping?osType=Ubuntu&category=Production`

Memberikan informasi:
- Grouping VM Ubuntu per departemen
- Breakdown aplikasi per departemen dengan detail:
  - Nama aplikasi
  - Jumlah VM per aplikasi
  - Kritikalitas aplikasi
  - Owner aplikasi
  - Support 24h atau tidak
  - List detail VM (nama, cluster, IP, OS)

### 4. ✅ Mapping Aplikasi CentOS Production → Departemen & Fungsi
**Endpoint:** `GET /api/summary/app-mapping?osType=CentOS&category=Production`

Sama seperti Ubuntu, tapi khusus untuk CentOS.

---

## Bonus Endpoint

### 5. Report Lengkap untuk Management (All-in-One)
**Endpoint:** `GET /api/summary/management`

Satu endpoint yang menggabungkan SEMUA summary di atas, jadi management tinggal hit 1 endpoint saja untuk dapat semua data.

### 6. Summary Per Departemen
**Endpoint:** `GET /api/summary/by-department?osType=Ubuntu`

Quick summary per departemen dengan statistik:
- Total VM per departemen
- Jumlah VM obsolete
- Jumlah VM critical
- Jumlah aplikasi
- Persentase obsolete

---

## Cara Menggunakan

### 1. Login untuk Dapat Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'
```

Simpan `token` dari response.

### 2. Request Summary Management (Paling Lengkap)
```bash
curl -X GET http://localhost:3000/api/summary/management \
  -H "Authorization: Bearer TOKEN_ANDA"
```

### 3. Request Summary Obsolete Ubuntu Saja
```bash
curl -X GET "http://localhost:3000/api/summary/obsolete?osType=Ubuntu" \
  -H "Authorization: Bearer TOKEN_ANDA"
```

### 4. Request Mapping Aplikasi Ubuntu ke Departemen
```bash
curl -X GET "http://localhost:3000/api/summary/app-mapping?osType=Ubuntu&category=Production" \
  -H "Authorization: Bearer TOKEN_ANDA"
```

---

## Contoh Response: Summary Obsolete Ubuntu

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

**Interpretasi:**
- Ada 1,250 VM Ubuntu yang obsolete dari total 4,500 VM Ubuntu Production (27.78%)
- 320 VM adalah Critical (prioritas tertinggi untuk di-handle)
- Cluster GTI-COM-FJTS-CL04 paling banyak VM obsolete-nya (85 VM)
- 450 VM sudah expired sejak 2024 (harus segera di-handle!)

---

## Contoh Response: Mapping Aplikasi Ubuntu ke Departemen

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

**Interpretasi:**
- Department IT Operations punya 850 VM Ubuntu
- Salah satu aplikasinya: Core Banking (45 VM, Critical, owner: John Doe)
- Aplikasi Core Banking perlu support 24h
- Bisa drill-down sampai detail VM per aplikasi

---

## Use Case untuk Management

### 1. Monthly Review Meeting
Management bisa langsung hit endpoint `/api/summary/management` untuk mendapat overview lengkap:
- Berapa total obsolete Ubuntu & CentOS
- Department mana yang paling banyak obsolete VM-nya
- Aplikasi critical mana yang masih pake obsolete OS

### 2. Budget Planning
Dari data mapping aplikasi per departemen, management bisa:
- Estimasi budget upgrade per departemen
- Prioritize department dengan critical applications
- Assign PIC per departemen untuk koordinasi upgrade

### 3. Risk Assessment
Dari summary obsolete per kritikalitas, management bisa:
- Identifikasi high-risk applications (Critical + Obsolete)
- Plan mitigation strategy
- Set timeline untuk upgrade berdasarkan prioritas

### 4. Progress Tracking
Hit endpoint secara berkala untuk track progress:
- Apakah jumlah obsolete VM berkurang dari bulan ke bulan?
- Department mana yang sudah berhasil reduce obsolete VM-nya?
- Timeline target tercapai atau tidak?

---

## Integrasi dengan Dashboard Frontend

Data dari endpoint ini bisa langsung di-consume oleh:
- **Grafana** - untuk real-time monitoring dashboard
- **Tableau/Power BI** - untuk advanced analytics & visualization
- **Custom React/Next.js Dashboard** - untuk customized UI sesuai kebutuhan perusahaan
- **Excel Export** (future) - untuk presentasi manual

---

## Dokumentasi Lengkap

Lihat file-file berikut untuk detail lebih lanjut:
- `README.md` - Dokumentasi teknis lengkap semua endpoint
- `EXAMPLES.md` - Contoh-contoh penggunaan dengan curl & integration code
- `dto/query-summary.dto.ts` - Validation schema untuk query parameters

---

## Next Steps (Future Enhancement)

1. **Export to Excel/PDF**
   - Endpoint untuk download report dalam format Excel atau PDF
   
2. **Scheduled Email Reports**
   - Auto-send report ke management email setiap minggu/bulan
   
3. **Trend Analysis**
   - Grafik perubahan jumlah obsolete VM over time
   - Compare month-to-month progress
   
4. **Alert System**
   - Notifikasi otomatis jika obsolete percentage naik di atas threshold
   - Alert untuk VM yang mendekati end-of-support

5. **Drill-down Endpoints**
   - Detail per aplikasi spesifik
   - Detail per cluster
   - Timeline comparison view

---

## Support

Jika ada pertanyaan atau butuh customization tambahan, silakan kontak tim development.
