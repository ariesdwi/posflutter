# 📖 Dokumentasi Penggunaan – Casha AI CMO

> Panduan lengkap cara menggunakan sistem Casha AI CMO dari awal hingga mahir.

---

## 📋 Daftar Isi

1. [Persyaratan Sistem](#-persyaratan-sistem)
2. [Instalasi & Setup](#-instalasi--setup)
3. [Konfigurasi](#-konfigurasi)
4. [Panduan Perintah](#-panduan-perintah)
   - [Setup Wizard](#1%EF%B8%8F⃣-setup-wizard)
   - [Generate Strategi](#2%EF%B8%8F⃣-generate-strategi-marketing)
   - [Generate Konten](#3%EF%B8%8F⃣-generate-konten)
   - [Regenerate Konten by ID](#-regenerate-konten-by-id)
   - [Kelola Jadwal](#4%EF%B8%8F⃣-kelola-jadwal)
   - [Posting Konten](#5%EF%B8%8F⃣-posting-konten)
   - [Analytics & Laporan](#6%EF%B8%8F⃣-analytics--laporan)
   - [Optimasi AI](#7%EF%B8%8F⃣-optimasi-ai)
   - [Mode Otomatis (Daemon)](#8%EF%B8%8F⃣-mode-otomatis-daemon)
   - [Lihat Antrian](#9%EF%B8%8F⃣-lihat-antrian)
5. [Alur Kerja Harian](#-alur-kerja-harian)
6. [Konfigurasi Platform](#-konfigurasi-platform)
7. [Kustomisasi Brand](#-kustomisasi-brand)
8. [Struktur Data](#-struktur-data)
9. [Troubleshooting](#-troubleshooting)
10. [FAQ](#-faq)

---

## 💻 Persyaratan Sistem

| Komponen | Versi Minimum |
|----------|--------------|
| Python | 3.10+ |
| pip | 22.0+ |
| OS | macOS / Linux / Windows |
| RAM | 512MB+ |
| Internet | Diperlukan untuk AI & posting |

**API Key yang diperlukan:**

| API Key | Status | Kegunaan |
|---------|--------|----------|
| `OPENAI_API_KEY` | **Wajib** | AI untuk generate strategi & konten |
| `META_ACCESS_TOKEN` | Opsional | Posting ke Instagram (Graph API) |
| `TIKTOK_SESSION_ID` | Opsional | Posting ke TikTok |
| `LINKEDIN_ACCESS_TOKEN` | Opsional | Posting ke LinkedIn |

---

## 🚀 Instalasi & Setup

### Step 1: Clone & Masuk ke Direktori

```bash
cd cmo-casha
```

### Step 2: Buat Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate       # macOS / Linux
# venv\Scripts\activate        # Windows
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Konfigurasi Environment

```bash
cp .env.example .env
```

Buka file `.env` dan isi minimal:

```env
OPENAI_API_KEY=sk-proj-xxxxx-api-key-kamu-disini
```

### Step 5: Validasi Instalasi

```bash
python main.py setup
```

Wizard akan mengecek:
- ✅ Koneksi OpenAI API
- ✅ Status konfigurasi setiap platform (Instagram, TikTok, LinkedIn)
- ✅ Validitas file `config.yaml`

### Step 6: Coba Perintah Pertama

```bash
python main.py --help
```

Output akan menampilkan semua perintah yang tersedia.

---

## ⚙️ Konfigurasi

### File `.env` – API Keys & Credentials

File ini menyimpan semua API keys dan credentials. **Tidak pernah di-commit ke Git.**

```env
# WAJIB
OPENAI_API_KEY=sk-proj-...

# OPSIONAL – Instagram
META_ACCESS_TOKEN=your-meta-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-ig-business-id
INSTAGRAM_USERNAME=casha_app
INSTAGRAM_PASSWORD=your_password

# OPSIONAL – TikTok
TIKTOK_SESSION_ID=your-session-id

# OPSIONAL – LinkedIn
LINKEDIN_ACCESS_TOKEN=your-token
LINKEDIN_ORGANIZATION_ID=your-org-id

# OPSIONAL – Notifikasi
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

### File `config.yaml` – Konfigurasi Brand & Sistem

File ini mengatur identitas brand, pengaturan AI, jadwal posting, dan KPI target.

**Bagian penting yang perlu disesuaikan:**

```yaml
# Identitas brand kamu
brand:
  name: "Casha"
  tagline: "Aplikasi Keuangan Cerdas untuk Hidup Lebih Terencana"
  voice:
    tone: "friendly, empowering, conversational"

# Model AI yang digunakan
ai:
  model: "gpt-4o"          # bisa diganti: gpt-4o-mini, gpt-4-turbo
  temperature: 0.8          # 0.0 = konsisten, 1.0 = kreatif

# Frekuensi posting per minggu
content:
  posting_frequency:
    instagram: 7
    tiktok: 5
    linkedin: 3

# Target KPI
analytics:
  target_metrics:
    instagram_engagement_rate: 3.5
    tiktok_average_views: 10000
```

---

## 🎮 Panduan Perintah

### 1️⃣ Setup Wizard

**Validasi seluruh konfigurasi sistem.**

```bash
python main.py setup
```

**Apa yang dilakukan:**
- Mengecek apakah `OPENAI_API_KEY` valid dan bisa terkoneksi
- Menampilkan status konfigurasi setiap platform (Aktif / Belum)
- Memvalidasi file `config.yaml`
- Menampilkan langkah selanjutnya

**Kapan digunakan:** Pertama kali setup, atau setelah mengubah `.env`.

---

### 2️⃣ Generate Strategi Marketing

**AI CMO merancang strategi marketing lengkap.**

```bash
# Strategi mingguan (default)
python main.py strategy

# Strategi bulanan
python main.py strategy --period monthly

# Strategi kuartalan
python main.py strategy --period quarterly

# Dengan fokus kampanye tertentu
python main.py strategy --period weekly --focus "Kampanye Lebaran"

# Simpan ke file
python main.py strategy --period monthly --output strategi_mei.json
```

**Opsi tersedia:**

| Flag | Alias | Nilai | Default | Keterangan |
|------|-------|-------|---------|------------|
| `--period` | `-p` | weekly / monthly / quarterly | weekly | Periode strategi |
| `--focus` | `-f` | teks bebas | – | Fokus kampanye khusus |
| `--output` | `-o` | path file | – | Simpan strategi ke file |

**Output yang dihasilkan:**
- Executive Summary
- Key Themes
- Content Ideas (tabel lengkap per platform)
- Hashtag Strategy
- KPI Targets
- Action Items dengan prioritas
- CMO Notes

**File otomatis tersimpan di:** `data/strategies/strategy_weekly_YYYYMMDD_HHMM.json`

---

### 3️⃣ Generate Konten

**AI membuat konten siap posting: caption, hook, hashtag, script video.**

```bash
# 3 konten Instagram (default)
python main.py content

# 5 konten untuk semua platform
python main.py content --platform all --count 5

# Konten TikTok dengan topik spesifik
python main.py content --platform tiktok --topic "cara nabung gaji UMR"

# Konten LinkedIn pillar edukasi
python main.py content --platform linkedin --pillar edukasi

# Preview saja, tidak simpan ke antrian
python main.py content --platform instagram --no-save
```

**Opsi tersedia:**

| Flag | Alias | Nilai | Default | Keterangan |
|------|-------|-------|---------|------------|
| `--platform` | `-pl` | instagram / tiktok / linkedin / all | instagram | Target platform |
| `--count` | `-c` | angka | 3 | Jumlah konten |
| `--pillar` | `-p` | tips / fitur / motivasi / edukasi / auto | auto | Content pillar |
| `--topic` | `-t` | teks bebas | – | Topik spesifik |
| `--save/--no-save` | – | – | --save | Simpan ke antrian |

**Output per konten:**
- 📌 Pillar, Topik, Format
- 🎣 Hook (kalimat pembuka yang menarik)
- ✍️ Caption lengkap siap posting
- 🎬 Script Video (khusus TikTok)
- 🏷️ Hashtags
- 📊 Content Score (Engagement Potential, Brand Alignment)
- ⏰ Best Post Time
- 💬 CMO Recommendation

**Konten otomatis tersimpan di:** `data/queue/{platform}/{ID}_{tanggal}.json`

---

### 🔄 Regenerate Konten by ID

**Generate ulang konten yang sudah ada berdasarkan ID, dengan brand & config terbaru.**

Gunakan ini ketika kamu ingin membuat ulang konten lama (misalnya setelah update brand colors atau config), sambil mempertahankan ID yang sama.

**Cara 1 – Generate baru dengan ID baru (file baru):**

```bash
source venv/bin/activate
python main.py content --pillar tips --platform instagram --count 1 \
  --topic "Mengatur Keuangan agar Gaji Tahan hingga Akhir Bulan"
```

Konten baru tersimpan di `data/queue/instagram/` dengan ID yang di-generate otomatis.

**Cara 2 – Overwrite file konten yang ada (ID tetap):**

```bash
venv/bin/python3 - <<'EOF'
import json, sys, os
sys.path.insert(0, os.getcwd())
from cmo_agent.content_gen import ContentGenerator
from utils.config_loader import load_config

gen = ContentGenerator(load_config())
content = gen.generate_single(
    platform="instagram",
    pillar="tips",
    topic="<topik konten>",       # ganti sesuai topik asli
)
content["id"] = "<ID_KONTEN>"    # ganti dengan ID yang ingin di-overwrite

with open("data/queue/instagram/<ID_KONTEN>_<tanggal>.json", "w", encoding="utf-8") as f:
    json.dump(content, f, ensure_ascii=False, indent=2)
print("✓ Done:", content["id"])
EOF
```

> **Catatan:** Ganti `<ID_KONTEN>`, `<topik konten>`, dan `<tanggal>` sesuai file yang ingin di-overwrite.
> Script ini harus dijalankan dari root direktori project (`cmo-casha/`).

**Perbedaan kedua cara:**

| | Cara 1 (`main.py content`) | Cara 2 (script manual) |
|---|---|---|
| ID | Baru (auto-generated) | Tetap (dipertahankan) |
| File | File baru | Overwrite file lama |
| Cara pakai | Mudah, via CLI | Fleksibel, via script |

---

### 4️⃣ Kelola Jadwal

**Lihat, optimalkan, atau hapus jadwal posting.**

```bash
# Lihat semua jadwal
python main.py schedule show

# Optimalkan jadwal ke waktu terbaik
python main.py schedule optimize

# Optimalkan hanya Instagram
python main.py schedule optimize --platform instagram

# Hapus semua jadwal
python main.py schedule clear
```

**Waktu optimal posting (dari `config.yaml`):**

| Platform | Hari Kerja | Weekend |
|----------|-----------|---------|
| Instagram | 07:00, 12:00, 19:00, 21:00 | 08:00, 11:00, 16:00, 20:00 |
| TikTok | 06:00, 10:00, 19:00, 22:00 | 09:00, 14:00, 20:00 |
| LinkedIn | 08:00, 12:00, 17:00 | – |

---

### 5️⃣ Posting Konten

**Eksekusi posting dari antrian ke platform sosial media.**

```bash
# Post semua konten terjadwal
python main.py post

# Preview dulu (tidak benar-benar posting)
python main.py post --dry-run

# Hanya posting ke Instagram
python main.py post --platform instagram

# Post konten spesifik berdasarkan ID
python main.py post --id ABCD1234
```

**Opsi tersedia:**

| Flag | Alias | Nilai | Default | Keterangan |
|------|-------|-------|---------|------------|
| `--platform` | `-p` | instagram / tiktok / linkedin / all | all | Target platform |
| `--dry-run` | – | – | false | Preview tanpa posting |
| `--id` | – | content ID | – | Post konten spesifik |

**Catatan penting:**
- Mode `--dry-run` **sangat direkomendasikan** untuk testing pertama kali
- Konten yang berhasil dipost dipindahkan ke `data/posted/`
- Konten yang gagal dipindahkan ke `data/failed/`
- Butuh API keys platform yang valid untuk posting sungguhan

**Mode posting Instagram:**
1. **Meta Graph API** (Rekomendasi) – Untuk akun bisnis/kreator. Butuh `META_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID`
2. **instagrapi** (Alternatif) – Untuk akun personal. Butuh `INSTAGRAM_USERNAME` + `INSTAGRAM_PASSWORD`

---

### 6️⃣ Analytics & Laporan

**Monitor performa konten di semua platform.**

```bash
# Laporan mingguan semua platform (default)
python main.py analytics

# Laporan harian
python main.py analytics --period daily

# Laporan bulanan
python main.py analytics --period monthly

# Hanya TikTok
python main.py analytics --platform tiktok

# Ekspor ke JSON
python main.py analytics --export laporan.json

# Ekspor ke CSV
python main.py analytics --export laporan.csv
```

**Opsi tersedia:**

| Flag | Alias | Nilai | Default | Keterangan |
|------|-------|-------|---------|------------|
| `--period` | `-p` | daily / weekly / monthly | weekly | Periode laporan |
| `--platform` | `-pl` | instagram / tiktok / linkedin / all | all | Filter platform |
| `--export` | `-e` | path file (.json/.csv) | – | Ekspor laporan |

**Metrik yang ditampilkan:**

| Platform | Metrik |
|----------|--------|
| Instagram | Followers, Reach, Impressions, Likes, Comments, Saves, Shares, Profile Visits, Link Clicks |
| TikTok | Followers, Views, Likes, Comments, Shares, Avg Watch Time, Completion Rate |
| LinkedIn | Followers, Impressions, Reactions, Comments, Reposts, CTR |

**Output laporan:**
- Tabel metrik per platform
- KPI vs Target (dengan progress bar visual)
- AI Insights otomatis
- Rekomendasi aksi

**Laporan otomatis tersimpan di:** `data/analytics/report_{period}_{tanggal}.json`

> **Catatan:** Saat ini data analytics menggunakan simulasi realistis. Akan otomatis menggunakan data nyata ketika API keys platform sudah dikonfigurasi.

---

### 7️⃣ Optimasi AI

**AI menganalisis data performa dan memberikan rekomendasi optimasi.**

```bash
# Lihat rekomendasi optimasi
python main.py optimize

# Terapkan optimasi secara otomatis
python main.py optimize --auto-apply
```

**Output:**
- Tabel rekomendasi dengan prioritas (HIGH/MEDIUM/LOW)
- Kategori: content, posting_time, hashtag, platform, budget
- Expected impact per rekomendasi
- Quick wins yang bisa dilakukan hari ini

---

### 8️⃣ Mode Otomatis (Daemon)

**AI CMO berjalan terus-menerus secara otomatis.**

```bash
# Jalankan daemon (cek setiap 60 menit)
python main.py run

# Cek setiap 30 menit
python main.py run --interval 30

# Jalankan sekali lalu berhenti
python main.py run --once
```

**Apa yang dilakukan daemon:**
1. Memeriksa jadwal posting setiap interval
2. Auto-post konten jika `auto_post: true` di `config.yaml`
3. Auto-generate konten baru jika antrian < 3 item
4. Tekan `Ctrl+C` untuk menghentikan

**Pengaturan `auto_post` di `config.yaml`:**

```yaml
scheduler:
  auto_post: false    # Ubah ke true untuk posting otomatis
```

> ⚠️ **Pastikan API keys sudah dikonfigurasi dan diuji sebelum mengaktifkan `auto_post: true`!**

---

### 9️⃣ Lihat Antrian

**Tampilkan daftar konten dalam antrian posting.**

```bash
# Semua antrian pending
python main.py queue

# Yang sudah dipost
python main.py queue --status posted

# Yang gagal
python main.py queue --status failed

# Filter platform
python main.py queue --platform instagram

# Semua status
python main.py queue --status all
```

---

## 📅 Alur Kerja Harian

Berikut rekomendasi penggunaan harian:

### 🌅 Pagi (Senin)
```bash
# 1. Generate strategi mingguan
python main.py strategy --period weekly

# 2. Buat konten untuk seminggu
python main.py content --platform all --count 15

# 3. Optimalkan jadwal
python main.py schedule optimize
```

### 🌞 Setiap Hari
```bash
# Cek antrian hari ini
python main.py schedule show

# Post konten (atau dry-run dulu)
python main.py post --dry-run
python main.py post

# Atau jalankan daemon
python main.py run --interval 60
```

### 🌙 Akhir Minggu
```bash
# Review performa minggu ini
python main.py analytics --period weekly

# Lihat rekomendasi optimasi
python main.py optimize

# Ekspor laporan
python main.py analytics --export laporan_minggu.json
```

### 📊 Akhir Bulan
```bash
# Laporan bulanan
python main.py analytics --period monthly --export laporan_bulan.csv

# Strategi bulan depan
python main.py strategy --period monthly
```

---

## 🔗 Konfigurasi Platform

### Instagram – Meta Graph API (Direkomendasikan)

1. Buka [Meta for Developers](https://developers.facebook.com)
2. Buat App → **Business** type
3. Tambahkan product: **Instagram Graph API**
4. Generate long-lived access token
5. Dapatkan Instagram Business Account ID

```env
META_ACCESS_TOKEN=EAAxxxx...
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400xxxxx
META_PAGE_ID=xxxxxxxxxxxx
```

> 💡 **Cara mendapatkan `META_PAGE_ID`:** Buka [facebook.com/YOUR_PAGE_NAME/about](https://www.facebook.com) → scroll ke bagian bawah → lihat **Page ID**. Atau lewat [Meta Business Suite](https://business.facebook.com) → pilih Page → **Settings** → **Page Info** → **Page ID**.

### Instagram – instagrapi (Alternatif)

Untuk akun personal tanpa API bisnis:

```env
INSTAGRAM_USERNAME=casha_app
INSTAGRAM_PASSWORD=your_password
```

> ⚠️ Metode ini menggunakan unofficial API. Gunakan dengan hati-hati.

### TikTok

1. Daftar di [TikTok for Developers](https://developers.tiktok.com)
2. Buat app dan request **Content Posting API** access
3. Dapatkan session credentials

```env
TIKTOK_SESSION_ID=xxxxxxxxxxxx
TIKTOK_MS_TOKEN=xxxxxxxxxxxx
```

### LinkedIn

1. Buka [LinkedIn Developer Portal](https://developer.linkedin.com)
2. Buat app, request permission `w_member_social`
3. Generate access token

```env
LINKEDIN_ACCESS_TOKEN=AQVxxx...
LINKEDIN_ORGANIZATION_ID=xxxxxxxxxxxx
```

---

## 🎨 Kustomisasi Brand

Edit `config.yaml` untuk menyesuaikan dengan brand kamu:

### Identitas Brand
```yaml
brand:
  name: "Nama Brand Kamu"
  tagline: "Tagline brand kamu"
  color_primary: "#2E7D32"   # cashaPrimary (hijau finance-growth)
  voice:
    tone: "friendly, empowering"
    avoid:
      - "bahasa terlalu formal"
    keywords:
      - "keyword brand kamu"
```

### Target Audience
```yaml
  target_audience:
    primary: "Milenial Indonesia usia 20-35"
    pain_points:
      - "Masalah utama audiens"
    desires:
      - "Keinginan audiens"
```

### Content Pillars
```yaml
content:
  content_pillars:
    - name: "Nama Pillar"
      description: "Deskripsi pillar"
      weight: 35    # Persentase frekuensi (total semua = 100)
```

---

## 🖼️ Menambahkan Desain Visual / Gambar

Karena sistem ini **belum men-generate gambar secara otomatis**, kamu perlu membuat desainnya sendiri berdasarkan `visual_brief` yang dihasilkan AI. 

Untuk menghubungkan gambar yang sudah kamu desain agar bisa di-posting secara otomatis, ikuti cara ini:

1. Buat desain gambarmu (bisa format `.jpg`, `.jpeg`, `.png`, `.mp4`, `.mov`).
2. Lihat **ID Konten** yang ingin kamu tambahkan gambar (misal: ID `C5E804EB`). Kamu bisa melihat ID ini dari perintah `python main.py queue`.
3. Tentukan jenis format kontenmu:
   - **Jika gambar tunggal/video**: Ubah nama file gambarmu menjadi sesuai dengan ID tersebut (misal: `C5E804EB.jpg`).
   - **Jika carousel (multiple images)**: Buat sebuah **folder** dengan nama ID tersebut (misal: `C5E804EB/`), lalu masukkan semua slide gambar ke dalam folder itu. Pastikan penamaannya berurutan (misal: `1.jpg`, `2.jpg`, `3.jpg`).
4. Taruh file atau folder tersebut ke dalam folder **assets** yang sesuai dengan platformnya:
   - Instagram (Single): `data/assets/instagram/C5E804EB.jpg`
   - Instagram (Carousel): `data/assets/instagram/C5E804EB/1.jpg`, `data/assets/instagram/C5E804EB/2.jpg`, dst.
   - TikTok: `data/assets/tiktok/C5E804EB.mp4`
   - LinkedIn: `data/assets/linkedin/C5E804EB.png`

Sistem (Scheduler) akan **secara otomatis mendeteksi** gambar/video tersebut dan menyertakannya saat proses `python main.py post` berjalan!

---

## 📂 Struktur Data

```
data/
├── assets/                   # Tempat menaruh gambar/video hasil desainmu
│   ├── instagram/
│   │   ├── C5E804EB.jpg      # Contoh Single Image
│   │   └── ABCD1234/         # Contoh Carousel (dalam folder)
│   │       ├── 1.jpg
│   │       ├── 2.jpg
│   │       └── 3.jpg
│   ├── tiktok/
│   └── linkedin/
│
├── queue/                    # Konten menunggu posting
│   ├── instagram/
│   │   └── ABCD1234_20260420.json
│   ├── tiktok/
│   └── linkedin/
│
├── posted/                   # Konten yang sudah dipost
│   ├── instagram/
│   ├── tiktok/
│   └── linkedin/
│
├── failed/                   # Konten yang gagal dipost
│   ├── instagram/
│   ├── tiktok/
│   └── linkedin/
│
├── strategies/               # Strategi yang di-generate
│   └── strategy_weekly_20260420_1030.json
│
└── analytics/                # Laporan analytics
    └── report_weekly_20260420.json
```

**Format file konten (JSON):**

```json
{
  "id": "ABCD1234",
  "platform": "instagram",
  "pillar": "Tips Keuangan",
  "topic": "5 Cara Menabung untuk Gen-Z",
  "format": "carousel",
  "hook": "Gaji 4 juta tapi bisa nabung 1 juta? Ini caranya...",
  "caption": "Caption lengkap...",
  "hashtags": ["#TipsKeuangan", "#Nabung"],
  "cta": "Download Casha gratis!",
  "best_post_time": "19:00 WIB",
  "status": "pending",
  "created_at": "2026-04-20T10:00:00"
}
```

---

## 🔧 Troubleshooting

### ❌ Error: `OPENAI_API_KEY not set`

```bash
# Pastikan .env sudah ada dan terisi
cat .env | grep OPENAI

# Pastikan virtual environment aktif
source venv/bin/activate
```

### ❌ Error: `ModuleNotFoundError`

```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### ❌ Error: `config.yaml tidak ditemukan`

```bash
# Pastikan menjalankan dari root project
pwd
# Harus di: /path/to/cmo-casha
```

### ❌ Platform tidak aktif

Cek `config.yaml`:
```yaml
platforms:
  instagram:
    enabled: true    # Pastikan true
```

### ❌ Konten tidak tergenerate

- Pastikan `OPENAI_API_KEY` valid
- Cek saldo/kuota OpenAI API
- Coba jalankan `python main.py setup` untuk validasi

### ❌ Posting gagal

- Jalankan `python main.py post --dry-run` dulu
- Pastikan API keys platform sudah benar
- Cek file error di `data/failed/`
- Lihat log di `logs/cmo.log`

---

## ❓ FAQ

**Q: Apakah bisa digunakan tanpa API keys platform (Instagram/TikTok/LinkedIn)?**
> Ya! Fitur AI (generate strategi & konten) hanya butuh `OPENAI_API_KEY`. API keys platform hanya diperlukan untuk auto-posting.

**Q: Berapa biaya OpenAI API?**
> Tergantung penggunaan. Rata-rata generate 1 konten menggunakan ~1000-2000 tokens GPT-4o. Cek [OpenAI Pricing](https://openai.com/pricing).

**Q: Apakah data analytics-nya real?**
> Saat ini menggunakan simulasi realistis. Akan otomatis mengambil data nyata ketika API keys platform sudah dikonfigurasi.

**Q: Bisa ganti model AI?**
> Ya, edit `config.yaml` di bagian `ai.model`. Contoh: `gpt-4o-mini` (lebih murah), `gpt-4-turbo`, dll.

**Q: Apakah sistem ini membuat desain/gambar otomatis?**
> Belum. Saat ini hanya menghasilkan `visual_brief` (arahan teks untuk desainer). Konten yang dihasilkan berupa teks (caption, hook, hashtag, script).

**Q: Bagaimana cara melihat log?**
> Log tersimpan di `logs/cmo.log`. Gunakan: `tail -f logs/cmo.log`

**Q: Apakah aman menyimpan password di `.env`?**
> File `.env` sudah di-`.gitignore` sehingga tidak ter-commit ke Git. Pastikan tidak membagikan file ini.

---

## 📝 Ringkasan Semua Perintah

| Perintah | Fungsi |
|----------|--------|
| `python main.py setup` | ⚙️ Validasi konfigurasi sistem |
| `python main.py strategy` | 🎯 Generate strategi marketing |
| `python main.py content` | ✍️ Generate konten siap posting |
| `venv/bin/python3 -` (script) | 🔄 Regenerate konten by ID (overwrite) |
| `python main.py schedule show` | 📅 Lihat jadwal posting |
| `python main.py schedule optimize` | 📅 Optimalkan jadwal |
| `python main.py post` | 🚀 Posting konten ke platform |
| `python main.py post --dry-run` | 🔍 Preview posting |
| `python main.py analytics` | 📊 Lihat laporan performa |
| `python main.py optimize` | 🔮 Rekomendasi optimasi AI |
| `python main.py run` | 🤖 Mode daemon otomatis |
| `python main.py queue` | 📋 Lihat antrian konten |
| `python main.py --help` | ❓ Bantuan |

---

*Dokumentasi ini dibuat untuk Casha AI CMO v1.0.0 • Terakhir diperbarui: 21 April 2026*
