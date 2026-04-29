# 🤖 Casha AI CMO – Sistem Marketing Otomatis dari Terminal

> **Chief Marketing Officer berbasis AI untuk Casha** – Dari strategi hingga posting otomatis, semua dari terminal.

```
  ██████╗ █████╗ ███████╗██╗  ██╗ █████╗ 
 ██╔════╝██╔══██╗██╔════╝██║  ██║██╔══██╗
 ██║     ███████║███████╗███████║███████║
 ██║     ██╔══██║╚════██║██╔══██║██╔══██║
 ╚██████╗██║  ██║███████║██║  ██║██║  ██║
  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
         🤖 AI Chief Marketing Officer
```

## 🎯 Gambaran Sistem

```
TERMINAL → AI CMO Agent → Auto Content Creation → Auto Posting → Auto Analytics
```

Sistem ini mengotomatiskan seluruh alur marketing Casha:
- ✍️ **Generate konten** (caption, hook, hashtag, script TikTok)
- 📅 **Jadwalkan posting** di waktu optimal per platform
- 🚀 **Auto-post** ke Instagram, TikTok, LinkedIn
- 📊 **Monitor KPI** dan optimalkan strategi secara otomatis

## 📁 Struktur Project

```
casha-ai-cmo/
├── main.py                     # Entry point CLI
├── config.yaml                 # Konfigurasi brand, platform, AI
├── .env.example                # Template env (salin ke .env)
├── requirements.txt
│
├── cmo_agent/
│   ├── strategist.py           # 🎯 Perencana strategi marketing (GPT-4o)
│   ├── content_gen.py          # ✍️  Generator konten multi-platform
│   ├── scheduler.py            # 📅 Penjadwalan & queue management
│   └── analytics.py            # 📊 Monitoring KPI & laporan
│
├── platforms/
│   ├── instagram.py            # Meta Graph API + instagrapi
│   ├── tiktok.py               # TikTok Content Posting API
│   └── linkedin.py             # LinkedIn UGC Posts API
│
├── templates/
│   ├── problem_solution.json   # Template konten Problem-Solution
│   ├── feature_showcase.json   # Template showcase fitur Casha
│   └── testimonial.json        # Template social proof & testimonial
│
└── utils/
    ├── config_loader.py        # Loader YAML + dotenv
    ├── logger.py               # Logging terpusat
    └── setup_wizard.py         # Wizard konfigurasi interaktif
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd casha-ai-cmo

# Buat dan aktifkan virtual environment
python3 -m venv venv
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Konfigurasi API Keys

```bash
cp .env.example .env
# Edit .env dan isi API keys yang diperlukan
```

**Minimal yang dibutuhkan:**
```
OPENAI_API_KEY=sk-...    # Wajib untuk AI features
```

### 3. Validasi Setup

```bash
python main.py setup
```

## 📋 Perintah Lengkap

### 🎯 Generate Strategi Marketing
```bash
python main.py strategy --period weekly
python main.py strategy --period monthly --focus "Kampanye Lebaran"
python main.py strategy --period quarterly --output strategy_q2.json
```

### ✍️ Generate Konten
```bash
# Buat 3 konten Instagram
python main.py content --platform instagram --count 3

# Konten TikTok dengan topik spesifik
python main.py content --platform tiktok --topic "cara nabung gaji UMR"

# Semua platform, pillar tips keuangan
python main.py content --platform all --pillar tips --count 5

# Preview tanpa simpan ke antrian
python main.py content --platform instagram --no-save
```

### 📅 Kelola Jadwal
```bash
python main.py schedule show              # Lihat jadwal saat ini
python main.py schedule optimize          # Optimalkan ke waktu terbaik
python main.py schedule optimize --platform instagram
python main.py schedule clear             # Hapus semua jadwal
```

### 🚀 Posting Konten
```bash
python main.py post                       # Post semua yang terjadwal
python main.py post --platform instagram  # Hanya Instagram
python main.py post --dry-run             # Preview tanpa posting sungguhan
python main.py post --id ABCD1234        # Post konten spesifik
```

### 📊 Analytics & Laporan
```bash
python main.py analytics                          # Laporan mingguan semua platform
python main.py analytics --period monthly         # Laporan bulanan
python main.py analytics --platform tiktok        # Hanya TikTok
python main.py analytics --export report.json     # Export ke JSON
python main.py analytics --export report.csv      # Export ke CSV
```

### 🔮 Optimasi AI
```bash
python main.py optimize              # Lihat rekomendasi optimasi
python main.py optimize --auto-apply # Terapkan otomatis
```

### 🤖 Mode Otomatis (Daemon)
```bash
python main.py run                   # Daemon, cek tiap 60 menit
python main.py run --interval 30     # Cek tiap 30 menit
python main.py run --once            # Jalankan sekali lalu berhenti
```

### 📋 Lihat Antrian
```bash
python main.py queue                          # Semua antrian pending
python main.py queue --status posted          # Yang sudah dipost
python main.py queue --platform instagram     # Filter platform
```

## 🔑 Panduan API Keys

### Instagram (Meta Graph API) – Direkomendasikan
1. Buka [Meta for Developers](https://developers.facebook.com)
2. Buat App → Business → Instagram Graph API
3. Dapatkan: `META_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`

### Instagram (instagrapi) – Alternatif
```bash
pip install instagrapi
```
Set: `INSTAGRAM_USERNAME`, `INSTAGRAM_PASSWORD`

### TikTok
1. Daftar di [TikTok for Developers](https://developers.tiktok.com)
2. Buat app dan request Content Posting API access
3. Set: `TIKTOK_SESSION_ID`

### LinkedIn
1. Buka [LinkedIn Developer Portal](https://developer.linkedin.com)
2. Buat app, request `w_member_social` permission
3. Set: `LINKEDIN_ACCESS_TOKEN`, `LINKEDIN_ORGANIZATION_ID`

## ⚙️ Konfigurasi Brand

Edit `config.yaml` untuk menyesuaikan brand Casha:

```yaml
brand:
  name: "Casha"
  tagline: "Aplikasi Keuangan Cerdas untuk Hidup Lebih Terencana"
  voice:
    tone: "friendly, empowering, conversational"

content:
  posting_frequency:
    instagram: 7    # post per minggu
    tiktok: 5
    linkedin: 3
```

## 🏗️ Arsitektur

```
main.py (Typer CLI)
    │
    ├── cmo_agent/strategist.py  →  OpenAI GPT-4o
    │                                    │ Strategi, optimasi
    │
    ├── cmo_agent/content_gen.py →  OpenAI GPT-4o
    │                                    │ Caption, hook, script, hashtag
    │
    ├── cmo_agent/scheduler.py   →  data/queue/*.json
    │                                    │ Antrian, jadwal, daemon
    │
    ├── cmo_agent/analytics.py   →  Platform APIs / Simulasi
    │                                    │ KPI, laporan, insights
    │
    └── platforms/
         ├── instagram.py  →  Meta Graph API / instagrapi
         ├── tiktok.py     →  TikTok Content Posting API
         └── linkedin.py   →  LinkedIn UGC Posts API
```

## 📊 KPI yang Dimonitor

| Platform | Metrik |
|----------|--------|
| Instagram | Engagement Rate, Reach, Saves, Link Clicks |
| TikTok | Views, Completion Rate, Watch Time |
| LinkedIn | Impressions, CTR, Engagement Rate |
| Semua | Follower Growth, Content Performance |

## 🔐 Keamanan

- File `.env` **tidak di-commit** ke Git (ada di `.gitignore`)
- Data antrian di `data/` folder juga diabaikan Git
- Gunakan `.env.example` sebagai referensi

## 📄 License

Internal tool Casha – tidak untuk didistribusikan.
