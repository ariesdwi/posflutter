import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), '..');
const VENV_PYTHON = path.join(ROOT, 'venv', 'bin', 'python');
const PYTHON = fs.existsSync(VENV_PYTHON) ? `"${VENV_PYTHON}"` : 'python3';

function latestJson(dir: string): any | null {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  if (!files.length) return null;
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, files[0].name), 'utf8'));
  } catch { return null; }
}

function allJsons(dir: string): any[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse()
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { return null; }
    })
    .filter(Boolean);
}

export async function GET() {
  const strategy  = latestJson(path.join(ROOT, 'data', 'strategies'));
  const analytics = latestJson(path.join(ROOT, 'data', 'analytics'));
  const allStrats = allJsons(path.join(ROOT, 'data', 'strategies'));
  return NextResponse.json({ strategy, analytics, allStrats });
}

export async function POST(req: Request) {
  try {
    const { action, period, focus } = await req.json();
    if (action !== 'generate') return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    let command = `${PYTHON} main.py strategy --period ${period || 'weekly'}`;
    if (focus) command += ` --focus "${focus}"`;
    return new Promise<NextResponse>((resolve) => {
      exec(command, { cwd: ROOT }, (error, stdout, stderr) => {
        if (error) resolve(NextResponse.json({ error: error.message, stderr, stdout }));
        else resolve(NextResponse.json({ success: true, stdout }));
      });
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
