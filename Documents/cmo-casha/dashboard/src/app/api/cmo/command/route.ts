import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), '..');
const VENV_PYTHON = path.join(ROOT, 'venv', 'bin', 'python');
const PYTHON = fs.existsSync(VENV_PYTHON) ? `"${VENV_PYTHON}"` : 'python3';

function walkFind(dir: string, id: string): string | null {
  if (!fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      const r = walkFind(full, id);
      if (r) return r;
    } else if (entry.startsWith(id) && entry.endsWith('.json')) {
      return full;
    }
  }
  return null;
}

function findFile(id: string): string | null {
  for (const folder of ['queue', 'posted', 'failed']) {
    const r = walkFind(path.join(ROOT, 'data', folder), id);
    if (r) return r;
  }
  return null;
}

function runCmd(command: string): Promise<NextResponse> {
  return new Promise((resolve) => {
    exec(command, { cwd: ROOT }, (error, stdout, stderr) => {
      if (error) {
        // Return 200 with error details so the frontend can parse the JSON and show it
        resolve(NextResponse.json({ error: error.message, stderr, stdout }, { status: 200 }));
      } else {
        resolve(NextResponse.json({ success: true, stdout }));
      }
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, topic, count, format, no_shooting } = body;
    const noShooting = no_shooting === false || no_shooting === 'false' ? false : true;

    // ── Input sanitization (allowlist) ────────────────────────────────────────
    const VALID_PLATFORMS = new Set(['instagram', 'tiktok', 'all']);
    const VALID_FORMATS   = new Set(['auto', 'Carousel', 'Reels', 'Story', 'Single', 'Video', 'Short']);

    const rawPlatform  = String(body.platform  || '').toLowerCase();
    const rawId        = String(body.id        || '');
    const rawPlatforms = String(body.platforms || '');

    // platform: single value (generate / post / retry)
    const platform = VALID_PLATFORMS.has(rawPlatform) ? rawPlatform : '';

    // id: alphanumeric + underscore only
    const id = /^[A-Za-z0-9_]+$/.test(rawId) ? rawId : '';

    // platforms: comma-separated list of valid platform names (blast)
    const platforms = rawPlatforms
      .split(',')
      .map(p => p.trim().toLowerCase())
      .filter(p => VALID_PLATFORMS.has(p) && p !== 'all')
      .join(',');

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const filepath = findFile(id);
      if (!filepath) return NextResponse.json({ error: `File ${id} not found` }, { status: 404 });
      
      fs.unlinkSync(filepath);

      // Hapus folder/file asset terkait jika ada
      const assetsDir = path.join(ROOT, 'data', 'assets');
      if (fs.existsSync(assetsDir)) {
        for (const plat of fs.readdirSync(assetsDir)) {
          const platPath = path.join(assetsDir, plat);
          if (!fs.statSync(platPath).isDirectory()) continue;
          
          // Hapus jika berbentuk directory (carousel)
          const targetDir = path.join(platPath, id);
          if (fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
            fs.rmSync(targetDir, { recursive: true, force: true });
          }
          
          // Hapus jika berbentuk file (single)
          const exts = ['.jpg', '.jpeg', '.png', '.mp4', '.mov'];
          for (const ext of exts) {
            const lowerFile = path.join(platPath, `${id}${ext}`);
            const upperFile = path.join(platPath, `${id}${ext.toUpperCase()}`);
            if (fs.existsSync(lowerFile)) fs.unlinkSync(lowerFile);
            if (fs.existsSync(upperFile)) fs.unlinkSync(upperFile);
          }
        }
      }

      return NextResponse.json({ success: true });
    }

    let command = '';
    if (action === 'generate') {
      const safePlatform = platform || 'instagram';
      const safeCount    = Math.max(1, Math.min(10, parseInt(String(count)) || 1));
      const safeFormat   = VALID_FORMATS.has(String(format)) ? String(format) : 'auto';
      const safeTopic    = String(topic || '').replace(/["`$\\]/g, '').slice(0, 200);
      command = `${PYTHON} main.py content --platform ${safePlatform} --count ${safeCount}`;
      if (safeTopic) command += ` --topic "${safeTopic}"`;
      if (safeFormat !== 'auto') command += ` --format ${safeFormat}`;
      command += noShooting ? ' --no-shooting' : ' --allow-shooting';
    } else if (action === 'post') {
      command = `${PYTHON} main.py post --platform ${platform || 'all'}`;
    } else if (action === 'post_id') {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      // Kirim --platform agar hanya platform item itu yg diposting, bukan semua
      command = `${PYTHON} main.py post --id ${id}${platform ? ` --platform ${platform}` : ''}`;
    } else if (action === 'retry') {
      command = `${PYTHON} main.py retry --platform ${platform || 'all'}`;
    } else if (action === 'retry_id') {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      // Kirim --platform agar retry hanya untuk platform item itu
      command = `${PYTHON} main.py retry --id ${id}${platform ? ` --platform ${platform}` : ''}`;
    } else if (action === 'blast_id') {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const blastPlatforms = platforms || 'instagram,tiktok';
      command = `${PYTHON} main.py blast --id ${id} --platforms "${blastPlatforms}"`;
    } else if (action === 'requeue_id') {
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      command = `${PYTHON} main.py requeue --id ${id}`;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return runCmd(command);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
