import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), '..');
const ASSETS_ROOT = path.join(ROOT, 'data', 'assets');

function safeJoin(base: string, ...parts: string[]) {
  const resolved = path.resolve(base, ...parts);
  if (!resolved.startsWith(path.resolve(base))) return null;
  return resolved;
}

function mimeFromExt(file: string) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.webm') return 'video/webm';
  return 'application/octet-stream';
}

function isPreviewable(file: string) {
  const ext = path.extname(file).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.mp4', '.mov', '.webm'].includes(ext);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const platform = (searchParams.get('platform') || '').trim().toLowerCase();
    const id = (searchParams.get('id') || '').trim();
    const file = (searchParams.get('file') || '').trim();

    if (!platform || !id) {
      return NextResponse.json({ error: 'platform and id are required' }, { status: 400 });
    }

    const dir = safeJoin(ASSETS_ROOT, platform, id);
    if (!dir) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    if (file) {
      const absFile = safeJoin(dir, file);
      if (!absFile || !fs.existsSync(absFile) || fs.statSync(absFile).isDirectory()) {
        return NextResponse.json({ error: 'Asset file not found' }, { status: 404 });
      }
      const buf = fs.readFileSync(absFile);
      return new NextResponse(buf as any, {
        status: 200,
        headers: {
          'Content-Type': mimeFromExt(absFile),
          'Cache-Control': 'no-store',
        },
      });
    }

    if (!fs.existsSync(dir)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(dir)
      .filter((f) => isPreviewable(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((f) => ({
        name: f,
        url: `/api/cmo/assets?platform=${encodeURIComponent(platform)}&id=${encodeURIComponent(id)}&file=${encodeURIComponent(f)}`,
        type: mimeFromExt(f).startsWith('video/') ? 'video' : 'image',
      }));

    return NextResponse.json({ files });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
