# 🚀 Panduan Cepat – Casha AI CMO

> Panduan simple untuk admin menjalankan sistem marketing Casha sehari-hari.

---

## ⚡ Sebelum Mulai

Pastikan kamu sudah berada di folder project dan venv aktif:

```bash
cd cmo-casha
source venv/bin/activate
```

---

## 1. Buat Konten

```bash
# Buat 3 konten Instagram (default)
python main.py content

# Buat 1 konten dengan topik tertentu
python main.py content --count 1 --topic "cara nabung dari gaji UMR"

# Buat konten untuk semua platform
python main.py content --platform all --count 5
```

Konten otomatis masuk ke antrian di `data/queue/`.

---

## 2. Cek Antrian

```bash
# Lihat semua konten yang menunggu dipost
python main.py queue

# Lihat yang sudah berhasil dipost
python main.py queue --status posted

# Lihat yang gagal
python main.py queue --status failed
```

---

## 3. Tambahkan Gambar

Sebelum posting, kamu perlu menambahkan gambar/desain:

1. Cek **ID Konten** dari `python main.py queue` (contoh: `C5E804EB`)
2. Taruh gambar di folder `data/assets/instagram/`:
   - **Single image** → `data/assets/instagram/C5E804EB.jpg`
   - **Carousel** → buat folder, isi slide berurutan:
     ```
     data/assets/instagram/C5E804EB/
       ├── 1.jpg
       ├── 2.jpg
       └── 3.jpg
     ```

---

## 4. Posting

```bash
# Preview dulu (tidak benar-benar posting)
python main.py post --dry-run

# Post semua yang di antrian
python main.py post

# Post 1 konten spesifik berdasarkan ID
python main.py post --id C5E804EB

# Post hanya ke Instagram
python main.py post --platform instagram
```

---

## 5. Retry Konten Gagal

Jika ada posting yang gagal:

```bash
# Retry semua yang gagal
python main.py retry

# Retry 1 konten spesifik
python main.py retry --id C5E804EB

# Preview dulu sebelum retry
python main.py retry --id C5E804EB --dry-run
```

---

## 6. Regenerate Konten

Jika ingin buat ulang konten yang sudah ada (misal setelah update brand):

```bash
# Buat konten baru (ID baru)
python main.py content --count 1 --topic "topik yang sama"

# Atau overwrite konten lama (ID tetap) — jalankan dari root project:
venv/bin/python3 - <<'EOF'
import json, sys, os
sys.path.insert(0, os.getcwd())
from cmo_agent.content_gen import ContentGenerator
from utils.config_loader import load_config

gen = ContentGenerator(load_config())
content = gen.generate_single(
    platform="instagram",
    pillar="tips",
    topic="topik konten kamu",
)
content["id"] = "ID_LAMA"

with open("data/queue/instagram/ID_LAMA_20260420.json", "w", encoding="utf-8") as f:
    json.dump(content, f, ensure_ascii=False, indent=2)
print("✓ Done")
EOF
```

---

## 7. Buat Strategi

```bash
# Strategi mingguan
python main.py strategy

# Strategi bulanan
python main.py strategy --period monthly

# Dengan fokus kampanye tertentu
python main.py strategy --focus "Kampanye Lebaran"
```

---

## 8. Lihat Performa

```bash
# Laporan mingguan
python main.py analytics

# Laporan bulanan
python main.py analytics --period monthly

# Ekspor ke file
python main.py analytics --export laporan.json
```

---

## 9. Mode Autopilot

```bash
# Jalankan otomatis (cek setiap 60 menit)
python main.py run

# Jalankan sekali saja
python main.py run --once

# Berhenti: tekan Ctrl+C
```

> ⚠️ Pastikan `auto_post: true` di `config.yaml` sebelum pakai mode ini.

---

## 📋 Cheat Sheet

| Mau apa? | Perintah |
|----------|----------|
| Buat konten | `python main.py content` |
| Lihat antrian | `python main.py queue` |
| Preview posting | `python main.py post --dry-run` |
| Posting semua | `python main.py post` |
| Posting 1 konten | `python main.py post --id ABCD1234` |
| Retry gagal | `python main.py retry` |
| Buat strategi | `python main.py strategy` |
| Lihat performa | `python main.py analytics` |
| Mode autopilot | `python main.py run` |
| Cek setup | `python main.py setup` |
| Bantuan | `python main.py --help` |

---

## 🔴 Kalau Ada Error

| Masalah | Solusi |
|---------|--------|
| Posting gagal | Cek `python main.py post --dry-run` dulu |
| Konten tidak muncul | Pastikan gambar sudah ada di `data/assets/` |
| API error | Jalankan `python main.py setup` untuk cek koneksi |
| Module not found | `pip install -r requirements.txt` |
| Log error | Buka `logs/cmo.log` |

---

## 📅 Rutinitas Harian

**Senin pagi:**
```bash
python main.py strategy
python main.py content --platform all --count 15
```

**Setiap hari:**
```bash
python main.py post --dry-run    # preview
python main.py post              # posting
```

**Akhir minggu:**
```bash
python main.py analytics
```

---

*Casha AI CMO v1.0.0 • Panduan Admin*
