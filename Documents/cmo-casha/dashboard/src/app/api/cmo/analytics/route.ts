import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), '..');
const VENV_PYTHON = path.join(ROOT, 'venv', 'bin', 'python');
const PYTHON = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';

function latestAnalyticsFallback(_period: string) {
  // Tidak mengembalikan data dari file lama karena berisi data simulasi.
  // Dashboard akan menampilkan error daripada angka palsu.
  return null;
}

export async function GET(req: Request) {
  const token = process.env.META_ACCESS_TOKEN;
  const igId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!token || !igId) {
    return NextResponse.json(
      { error: 'META_ACCESS_TOKEN atau INSTAGRAM_BUSINESS_ACCOUNT_ID belum diisi di .env' },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'weekly';

  const py = `
import os, json, requests, time, warnings

warnings.filterwarnings('ignore', message='.*LibreSSL.*')
warnings.filterwarnings('ignore', message='.*NotOpenSSLWarning.*')

token = os.getenv('META_ACCESS_TOKEN', '')
ig_id = os.getenv('INSTAGRAM_BUSINESS_ACCOUNT_ID', '')
period = os.getenv('ANALYTICS_PERIOD', 'weekly')
base = 'https://graph.facebook.com/v19.0'

api_period = {'daily':'day','weekly':'week','monthly':'days_28'}.get(period, 'week')
days_back = {'day':1,'week':7,'days_28':28}.get(api_period, 7)
since_ts = int(time.time()) - (days_back * 86400)

def gget(url, params):
  last_err = None
  for _ in range(3):
    try:
      r = requests.get(url, params=params, timeout=20)
      r.raise_for_status()
      return r.json()
    except requests.RequestException as e:
      last_err = e
      time.sleep(0.4)
  raise last_err

try:
    acc = gget(f'{base}/{ig_id}', {
      'fields': 'id,name,username,biography,website,profile_picture_url,followers_count,follows_count,media_count',
      'access_token': token,
    })

    insight_map = {}
    try:
        ins = gget(f'{base}/{ig_id}/insights', {
          'metric': 'reach,profile_views,website_clicks,follower_count,total_interactions',
          'period': api_period,
          'access_token': token,
        })
        for d in ins.get('data', []):
          insight_map[d.get('name')] = sum(v.get('value', 0) for v in d.get('values', []))
    except Exception:
        pass

    likes = comments = saves = shares = 0
    posts_count = 0
    try:
        media_data = gget(f'{base}/{ig_id}/media', {
          'fields': 'id,like_count,comments_count,timestamp,media_product_type',
          'since': str(since_ts),
          'limit': '50',
          'access_token': token,
        })
        media = media_data.get('data', [])
        posts_count = len(media)
        for m in media:
          likes += m.get('like_count', 0)
          comments += m.get('comments_count', 0)
          try:
            mi = gget(f"{base}/{m.get('id')}/insights", {
              'metric': 'saved,shares',
              'access_token': token,
            })
            for e in mi.get('data', []):
              val = e.get('value', 0)
              if e.get('name') == 'saved': saves += val
              if e.get('name') == 'shares': shares += val
          except Exception:
            pass
    except Exception:
        pass

    followers = acc.get('followers_count', 0)
    total_interactions = likes + comments + saves + shares
    engagement_rate = round((total_interactions / followers) * 100, 2) if followers else 0

    print(json.dumps({
      'ok': True,
      '_source': 'graph_api',
      '_period': period,
      'fetched_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
      'name': acc.get('name', ''),
      'username': acc.get('username', ''),
      'biography': acc.get('biography', ''),
      'website': acc.get('website', ''),
      'profile_picture_url': acc.get('profile_picture_url', ''),
      'followers': followers,
      'follows_count': acc.get('follows_count', 0),
      'media_count': acc.get('media_count', 0),
      'followers_gained': insight_map.get('follower_count', 0),
      'posts_count': posts_count,
      'total_reach': insight_map.get('reach', 0),
      'impressions': insight_map.get('total_interactions', 0),
      'profile_visits': insight_map.get('profile_views', 0),
      'link_clicks': insight_map.get('website_clicks', 0),
      'likes': likes,
      'comments': comments,
      'saves': saves,
      'shares': shares,
      'engagement_rate': engagement_rate,
    }))
except requests.HTTPError as e:
    response = getattr(e, 'response', None)
    try:
        payload = response.json() if response is not None else {}
    except Exception:
        payload = {}
    err = payload.get('error', {}) if isinstance(payload, dict) else {}
    code = err.get('code')
    subcode = err.get('error_subcode')
    message = err.get('message') or str(e)
    if code == 190 and subcode == 463:
        message = 'META_ACCESS_TOKEN expired. Generate token baru di Meta Graph API lalu update .env.'
    print(json.dumps({'ok': False, 'error': message, 'code': code, 'subcode': subcode}))
except Exception as e:
    print(json.dumps({'ok': False, 'error': str(e)}))
`;

  const r = spawnSync(PYTHON, ['-c', py], {
    cwd: ROOT,
    env: { ...process.env, ANALYTICS_PERIOD: period },
    encoding: 'utf8',
    timeout: 30000,
  });

  try {
    const data = JSON.parse(r.stdout.trim());
    if (r.status !== 0) {
      const err = data?.error || r.stderr?.trim() || r.stdout?.trim() || 'Unknown analytics error';
      const fallback = latestAnalyticsFallback(period);
      if (fallback) {
        return NextResponse.json(fallback, { status: 200 });
      }
      return NextResponse.json({ error: err }, { status: 500 });
    }
    if (data?.ok === false) {
      const fallback = latestAnalyticsFallback(period);
      if (fallback) {
        return NextResponse.json(fallback, { status: 200 });
      }
      const status = data?.code === 190 ? 401 : 500;
      return NextResponse.json({ error: data.error }, { status });
    }
    if (data?.ok === true) {
      delete data.ok;
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Invalid analytics response from Python bridge' }, { status: 500 });
  }
}
