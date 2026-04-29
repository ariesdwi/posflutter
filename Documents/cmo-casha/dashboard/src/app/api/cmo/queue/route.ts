import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), '..');

function getJsonFiles(dir: string, items: any[], status: string) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getJsonFiles(fullPath, items, status);
    } else if (file.endsWith('.json')) {
      try {
        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        content.status = status;
        content._filename = file;
        content._filepath = fullPath;
        items.push(content);
      } catch (e) {
        console.error('Error parsing', fullPath, e);
      }
    }
  }
}

export async function GET() {
  const rootDir = path.join(ROOT, 'data');
  const items: any[] = [];

  getJsonFiles(path.join(rootDir, 'queue'),  items, 'pending');
  getJsonFiles(path.join(rootDir, 'posted'), items, 'posted');
  getJsonFiles(path.join(rootDir, 'failed'), items, 'failed');

  return NextResponse.json(items);
}

export async function PATCH(req: Request) {
  try {
    const { filepath, caption } = await req.json();
    if (!filepath || typeof caption !== 'string') {
      return NextResponse.json({ error: 'filepath and caption are required' }, { status: 400 });
    }
    // Safety: only allow writes inside the project data/ directory
    const resolved = path.resolve(filepath);
    const dataDir  = path.resolve(path.join(ROOT, 'data'));
    if (!resolved.startsWith(dataDir)) {
      return NextResponse.json({ error: 'Invalid filepath' }, { status: 403 });
    }
    if (!fs.existsSync(resolved)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    const data = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    // Update wherever caption lives in the file
    data.caption = caption;
    if (data.content?.caption_reels !== undefined) data.content.caption_reels = caption;
    if (data.caption_reels !== undefined) data.caption_reels = caption;
    fs.writeFileSync(resolved, JSON.stringify(data, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
