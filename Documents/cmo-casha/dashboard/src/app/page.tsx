'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface HashtagGroups {
  branded?: string[];
  niche?: string[];
  volume_tinggi?: string[];
  trending?: string[];
}
interface ContentSection {
  hook?: string;
  hook_visual?: string;
  caption_reels?: string;
  cta_primary?: string;
  cta_secondary?: string;
  hashtags?: HashtagGroups | string[];
}
interface SubScene {
  tip: number;
  duration_sec: number;
  visual?: string;
  text_overlay?: string;
  vo?: string;
}
interface Scene {
  scene: number;
  label?: string;
  duration_sec: number;
  timestamp?: string;
  visual?: string;
  text_overlay?: string;
  text_animation?: string;
  vo?: string;
  color_palette?: string[];
  typography?: string;
  retention_hook?: boolean;
  note?: string;
  sub_scenes?: SubScene[];
}
interface VideoProduction {
  duration_seconds?: number;
  fps?: number;
  aspect_ratio?: string;
  dimensions?: string;
  safe_zone_note?: string;
  scene_breakdown?: Scene[];
  talent?: { type?: string; on_screen?: boolean; tone?: string; note?: string };
  audio?: { bgm_mood?: string; bgm_note?: string; voiceover?: boolean; vo_tone?: string; sfx?: string[] };
  post_production?: { transition_style?: string; subtitle_style?: Record<string, string>; color_grading?: string };
  export_specs?: { format?: string; codec?: string; resolution?: string; fps?: number; bitrate?: string; file_size_max?: string };
}
interface ContentScore {
  engagement_potential?: number;
  brand_alignment?: number;
  relatability?: number;
  shareability?: number;
  educational_value?: number;
  cmo_recommendation?: string;
}
interface TargetPersona {
  segment?: string;
  age_range?: string;
  geo?: string;
  income_range?: string;
  pain_point?: string;
}
interface CMOContent {
  id: string;
  platform: string;
  pillar?: string;
  topic?: string;
  format?: string;
  status: string;
  created_at?: string;
  _filename?: string;
  _filepath?: string;
  // flat fields
  hook?: string;
  caption?: string;
  hashtags?: HashtagGroups | string[];
  best_post_time?: string | { primary: string; secondary: string };
  hook_visual?: string;
  caption_reels?: string;
  cta_primary?: string;
  cta_secondary?: string;
  content_score?: ContentScore;
  target_persona?: TargetPersona;
  video_production?: VideoProduction;
  visual_brief?: any;
  brand_safety_notes?: string;
  reference_content?: string[];
  approval_workflow?: Record<string, string>;
  carousel_slides?: string[];
  // nested fields
  content?: ContentSection;
  distribution?: { best_post_time?: { primary: string; secondary: string }; posting_account?: string; utm_link?: string };
  post_result?: { method?: string; status?: string; post_id?: string; note?: string };
}

// Strategy types
interface ContentIdea {
  title: string;
  pillar?: string;
  platform: string;
  format: string;
  hook?: string;
  description?: string;
}
interface ActionItem {
  priority: string;
  task: string;
  deadline: string;
  owner?: string;
}
interface Strategy {
  period?: string;
  generated_at?: string;
  executive_summary?: string;
  main_objective?: string;
  key_themes?: string[];
  weekly_content_plan?: Array<{
    week_label?: string;
    focus?: string;
    instagram_posts?: number;
    tiktok_videos?: number;
    campaign_idea?: string;
    key_message?: string;
  }>;
  content_ideas?: ContentIdea[];
  hashtag_strategy?: { primary?: string[]; secondary?: string[]; trending_suggestions?: string[] };
  kpi_targets?: Record<string, string>;
  action_items?: ActionItem[];
  competitor_insights?: string;
  cmo_notes?: string;
  growth_roadmap?: {
    current_state?: string;
    bottleneck?: string;
    primary_lever?: string;
    milestone_week_1?: string;
    milestone_week_2?: string;
    milestone_week_4?: string;
  };
}
interface Analytics {
  period?: string;
  generated_at?: string;
  metrics?: {
    instagram?: Record<string, number>;
    tiktok?: Record<string, number>;
  };
  kpis?: Record<string, Record<string, number>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function norm(item: CMOContent) {
  const c = item.content;
  return {
    hook:         c?.hook         || item.hook        || '',
    hookVisual:   c?.hook_visual  || item.hook_visual || '',
    caption:      c?.caption_reels || item.caption_reels || item.caption || '',
    ctaPrimary:   c?.cta_primary  || item.cta_primary  || '',
    ctaSecondary: c?.cta_secondary || item.cta_secondary || '',
    hashtags:     (c?.hashtags    || item.hashtags) as HashtagGroups | string[] | undefined,
    bestPostTime: item.distribution?.best_post_time || item.best_post_time,
    score:        item.content_score,
    persona:      item.target_persona,
    videoProd:    item.video_production,
    visualBrief:  item.visual_brief,
    brandSafety:  item.brand_safety_notes,
    approval:     item.approval_workflow,
    refs:         item.reference_content,
    carouselSlides: item.carousel_slides,
  };
}
const PLAT_COLOR: Record<string, string> = { instagram: '#E1306C', tiktok: '#EE1D52' };
const PLAT_ICON:  Record<string, string> = { instagram: '📸', tiktok: '🎵' };
const FMT_COLOR:  Record<string, string> = { reels: '#9C27B0', video: '#9C27B0', carousel: '#FF6F00', 'single image': '#1565C0' };
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: '#fff8e1', color: '#E65100', border: '#FFE082' },
  posted:  { bg: '#e8f5e9', color: '#2E7D32', border: '#A5D6A7' },
  failed:  { bg: '#ffebee', color: '#C62828', border: '#EF9A9A' },
};
function scoreColor(v: number) { return v >= 85 ? '#2E7D32' : v >= 70 ? '#F57C00' : '#C62828'; }
function fmtDate(s?: string) {
  if (!s) return '–';
  try { return new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return s; }
}
function avgScore(score?: ContentScore) {
  if (!score) return 0;
  const vals = [score.engagement_potential, score.brand_alignment, score.relatability, score.shareability, score.educational_value].filter(Boolean) as number[];
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span style={{ background: bg, color, border: `1px solid ${border || bg}`, padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)' }}>
      {label}
    </span>
  );
}
function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1.5rem 0 0.75rem' }}>
      <span style={{ fontSize: '1rem' }}>{icon}</span>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2E7D32', fontFamily: 'var(--font-sans)' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: '#e8eaed' }} />
    </div>
  );
}
function ScoreBar({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  const color = scoreColor(value);
  return (
    <div style={{ marginBottom: '0.65rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
        <span style={{ color: '#555' }}>{label}</span>
        <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-sans)' }}>{value}%</span>
      </div>
      <div style={{ background: '#f0f0f0', borderRadius: 999, height: 7, overflow: 'hidden' }}>
        <div style={{ background: color, borderRadius: 999, height: 7, width: `${value}%`, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}
function HashtagPills({ hashtags }: { hashtags?: HashtagGroups | string[] }) {
  if (!hashtags) return null;
  if (Array.isArray(hashtags)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {hashtags.map((t, i) => <span key={i} style={{ background: '#e8f5e9', color: '#2E7D32', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.74rem' }}>{t}</span>)}
      </div>
    );
  }
  const groups = [
    { k: 'branded'       as const, label: 'Brand',         color: '#2E7D32', bg: '#e8f5e9' },
    { k: 'niche'         as const, label: 'Niche',          color: '#0277BD', bg: '#e1f5fe' },
    { k: 'volume_tinggi' as const, label: 'Volume Tinggi',  color: '#6A1B9A', bg: '#f3e5f5' },
    { k: 'trending'      as const, label: 'Trending',       color: '#E65100', bg: '#fff3e0' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {groups.filter(g => (hashtags as HashtagGroups)[g.k]?.length).map(g => (
        <div key={g.k}>
          <div style={{ fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: g.color, marginBottom: '0.3rem' }}>{g.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
            {(hashtags as HashtagGroups)[g.k]!.map((t, i) => <span key={i} style={{ background: g.bg, color: g.color, padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 500 }}>{t}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}
function BestTime({ bpt }: { bpt?: string | { primary: string; secondary: string } }) {
  if (!bpt) return <span style={{ color: '#bbb' }}>–</span>;
  if (typeof bpt === 'string') return <span>⏰ {bpt}</span>;
  return <span>⏰ <strong>{bpt.primary}</strong> <span style={{ color: '#999', fontSize: '0.75rem' }}>/ {bpt.secondary}</span></span>;
}
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.4rem 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ color: '#999', minWidth: 100, flexShrink: 0, fontSize: '0.8rem' }}>{label}</span>
      <span style={{ color: highlight ? '#C62828' : '#333', fontWeight: highlight ? 600 : 400, fontSize: '0.82rem', lineHeight: 1.4 }}>{value}</span>
    </div>
  );
}
function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f0f4ff', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: '0.78rem', display: 'flex', gap: '0.3rem' }}>
      <span style={{ color: '#aaa' }}>{label}</span>
      <span style={{ fontWeight: 700, color: '#3949AB' }}>{value}</span>
    </div>
  );
}

// ─── Scene Timeline ───────────────────────────────────────────────────────────
function SceneTimeline({ scenes }: { scenes: Scene[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {scenes.map((s, i) => (
        <div key={i} style={{ borderLeft: `3px solid ${s.retention_hook ? '#E65100' : '#4CAF50'}`, paddingLeft: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.3rem' }}>
            <div style={{ background: '#2E7D32', color: 'white', borderRadius: 999, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>{s.scene}</div>
            {s.label    && <span style={{ fontWeight: 700, fontSize: '0.83rem', color: '#212121' }}>{s.label}</span>}
            {s.timestamp && <span style={{ fontSize: '0.72rem', color: '#aaa', fontFamily: 'monospace' }}>{s.timestamp}</span>}
            <span style={{ background: '#f0f4ff', color: '#3949AB', padding: '0.1rem 0.45rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600 }}>{s.duration_sec}s</span>
            {s.retention_hook && <span style={{ background: '#fff3e0', color: '#E65100', padding: '0.1rem 0.45rem', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700 }}>🔥 Pattern Interrupt</span>}
          </div>
          {s.text_overlay && <div style={{ fontSize: '0.8rem', color: '#333', fontWeight: 600, marginBottom: '0.2rem' }}>📌 "{s.text_overlay}"</div>}
          {s.vo          && <div style={{ fontSize: '0.78rem', color: '#555', marginBottom: '0.2rem' }}>🎙 {s.vo}</div>}
          {s.visual      && <div style={{ fontSize: '0.75rem', color: '#777' }}>🎥 {s.visual}</div>}
          {s.note        && <div style={{ fontSize: '0.72rem', color: '#E65100', marginTop: '0.25rem', fontStyle: 'italic' }}>💡 {s.note}</div>}
          {!!s.sub_scenes?.length && (
            <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {s.sub_scenes.map((ss, j) => (
                <div key={j} style={{ background: '#f9fafb', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem', border: '1px solid #f0f0f0' }}>
                  <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Tip {ss.tip} <span style={{ color: '#aaa', fontWeight: 400 }}>({ss.duration_sec}s)</span></div>
                  {ss.text_overlay && <div style={{ color: '#555' }}>📌 {ss.text_overlay}</div>}
                  {ss.vo           && <div style={{ color: '#777', marginTop: '0.15rem' }}>🎙 {ss.vo}</div>}
                  {ss.visual       && <div style={{ color: '#999', marginTop: '0.15rem' }}>🎥 {ss.visual}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Detail Side Panel ────────────────────────────────────────────────────────
function DetailPanel({ item, onClose, onPost, onDelete, posting, onCaptionSaved, onBlast, onRequeue }: {
  item: CMOContent; onClose: () => void;
  onPost: (id: string) => void; onDelete: (id: string) => void; posting: boolean;
  onCaptionSaved?: (id: string, newCaption: string) => void;
  onBlast?: (id: string, platforms: string) => void;
  onRequeue?: (id: string) => void;
}) {
  const n = norm(item);
  const scenes = n.videoProd?.scene_breakdown || (n.visualBrief?.scene_breakdown as Scene[] | undefined) || [];
  const ss = STATUS_STYLE[item.status] || { bg: '#f5f5f5', color: '#555', border: '#ddd' };
  const platColor = PLAT_COLOR[item.platform?.toLowerCase()] || '#555';

  const [editCaption, setEditCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(n.caption);
  const [savingCaption, setSavingCaption] = useState(false);
  const [captionSaveMsg, setCaptionSaveMsg] = useState<string | null>(null);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [blasting,      setBlasting]      = useState(false);
  const [blastMsg,      setBlastMsg]      = useState<string | null>(null);

  // Default blast ke platform LAIN dari platform item ini
  const itemPlat = item.platform?.toLowerCase() || '';
  const defaultBlast = itemPlat === 'instagram' ? 'tiktok'
                     : itemPlat === 'tiktok'    ? 'instagram'
                     : 'instagram,tiktok';
  const [blastPlatforms, setBlastPlatforms] = useState(defaultBlast);

  const handleBlastClick = async () => {
    if (!onBlast) return;
    setBlasting(true);
    setBlastMsg(null);
    try {
      await onBlast(item.id, blastPlatforms);
      setBlastMsg('✅ Blast selesai!');
    } catch {
      setBlastMsg('❌ Blast gagal');
    }
    setBlasting(false);
  };

  const isInboxUploaded = item.platform?.toLowerCase() === 'tiktok' &&
    (item.post_result?.method === 'content_posting_api_inbox_file_upload' ||
     item.post_result?.status === 'inbox_uploaded');

  const handleCopyTikTokCaption = () => {
    const allTags = !n.hashtags ? [] : Array.isArray(n.hashtags)
      ? n.hashtags
      : Object.values(n.hashtags as HashtagGroups).flat();
    const text = [n.caption, allTags.join(' ')].filter(Boolean).join('\n\n');
    navigator.clipboard.writeText(text);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2500);
  };

  const handleSaveCaption = async () => {
    if (!item._filepath) return;
    setSavingCaption(true);
    setCaptionSaveMsg(null);
    try {
      const res = await fetch('/api/cmo/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: item._filepath, caption: captionDraft }),
      });
      if (res.ok) {
        setCaptionSaveMsg('✅ Tersimpan');
        setEditCaption(false);
        onCaptionSaved?.(item.id, captionDraft);
      } else {
        const d = await res.json();
        setCaptionSaveMsg(`❌ ${d.error || 'Gagal menyimpan'}`);
      }
    } catch {
      setCaptionSaveMsg('❌ Gagal menyimpan');
    }
    setSavingCaption(false);
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(3px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 560, background: 'white', zIndex: 101, overflowY: 'auto', boxShadow: '-12px 0 48px rgba(0,0,0,0.18)', animation: 'slideIn 0.28s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column' }}>

        {/* ── Panel header ── */}
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: 'white', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#bbb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Content ID</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.5rem', color: '#212121', letterSpacing: '0.08em' }}>{item.id}</div>
            </div>
            <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, fontSize: '1.1rem', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <Badge label={`${PLAT_ICON[item.platform?.toLowerCase()] || '📱'} ${item.platform}`} color={platColor} bg={platColor + '18'} border={platColor + '40'} />
            {item.format && <Badge label={item.format} color={FMT_COLOR[item.format.toLowerCase()] || '#555'} bg={(FMT_COLOR[item.format.toLowerCase()] || '#555') + '18'} />}
            <Badge label={item.status} color={ss.color} bg={ss.bg} border={ss.border} />
            {item.pillar && <Badge label={item.pillar} color="#555" bg="#f5f5f5" />}
          </div>
          {item.topic    && <div style={{ fontSize: '0.88rem', color: '#333', fontWeight: 600, marginBottom: '0.35rem' }}>📌 {item.topic}</div>}
          <div style={{ fontSize: '0.75rem', color: '#bbb' }}>📅 {fmtDate(item.created_at)}</div>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Primary action — full width */}
            {item.status !== 'posted' && (
              <button onClick={() => onPost(item.id)} disabled={posting} style={{ width: '100%', background: posting ? '#a5d6a7' : item.status === 'failed' ? 'linear-gradient(135deg, #1565C0, #1976D2)' : 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: 'white', border: 'none', borderRadius: 10, padding: '0.8rem 1rem', fontWeight: 700, fontSize: '0.9rem', cursor: posting ? 'not-allowed' : 'pointer', opacity: posting ? 0.8 : 1, fontFamily: 'var(--font-sans)', boxShadow: posting ? 'none' : '0 4px 12px rgba(46,125,50,0.28)', letterSpacing: '-0.01em' }}>
                {posting ? '⏳ Posting...' : item.status === 'failed' ? `🔄 Retry ke ${PLAT_ICON[item.platform?.toLowerCase()] || ''} ${item.platform}` : `🚀 Post ke ${PLAT_ICON[item.platform?.toLowerCase()] || ''} ${item.platform}`}
              </button>
            )}
            {/* Secondary actions row */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(item, null, 2)); alert('JSON berhasil disalin!'); }} style={{ flex: 1, background: '#f8f9fa', color: '#555', border: '1px solid #e8eaed', borderRadius: 8, padding: '0.55rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>📋 Copy JSON</button>
              {item.status === 'pending' && (
                <button onClick={() => onDelete(item.id)} style={{ flex: 1, background: '#fff5f5', color: '#C62828', border: '1px solid #ffcdd2', borderRadius: 8, padding: '0.55rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>🗑 Hapus</button>
              )}
              {(item.status === 'posted' || item.status === 'failed') && onRequeue && (
                <button onClick={() => onRequeue(item.id)} style={{ flex: 1, background: '#f0f7ff', color: '#1565C0', border: '1px solid #bbdefb', borderRadius: 8, padding: '0.55rem', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>↩️ Antrian</button>
              )}
            </div>
            {/* Blast — compact single-line */}
            {onBlast && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff8f3', border: '1px solid #ffd5b4', borderRadius: 10, padding: '0.5rem 0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#E65100', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>💥 Blast ke</span>
                <select
                  value={blastPlatforms}
                  onChange={e => setBlastPlatforms(e.target.value)}
                  disabled={blasting}
                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.22rem 0.5rem', borderRadius: 6, border: '1px solid #ffd5b4', background: 'white', cursor: 'pointer', width: 'auto', minWidth: 0 }}
                >
                  {itemPlat !== 'tiktok'    && <option value="tiktok">🎵 TikTok</option>}
                  {itemPlat !== 'instagram' && <option value="instagram">📸 Instagram</option>}
                  {itemPlat !== 'instagram' && itemPlat !== 'tiktok' && <option value="instagram,tiktok">📸 IG + 🎵 TikTok</option>}
                </select>
                <button onClick={handleBlastClick} disabled={blasting} style={{ background: blasting ? '#ccc' : '#E65100', color: 'white', border: 'none', borderRadius: 7, padding: '0.32rem 0.85rem', fontWeight: 700, fontSize: '0.78rem', cursor: blasting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {blasting ? '⏳' : 'Blast'}
                </button>
                {blastMsg && <span style={{ fontSize: '0.7rem', color: blastMsg.startsWith('✅') ? '#2E7D32' : '#C62828', whiteSpace: 'nowrap', flexShrink: 0 }}>{blastMsg}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel body ── */}
        <div style={{ padding: '0 1.5rem 2.5rem', flex: 1 }}>

          {/* Target Persona */}
          {n.persona && (
            <>
              <SectionTitle icon="👤" title="Target Persona" />
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid #f0f0f0' }}>
                {n.persona.segment      && <InfoRow label="Segmen"     value={n.persona.segment} />}
                {n.persona.age_range    && <InfoRow label="Usia"       value={n.persona.age_range} />}
                {n.persona.geo          && <InfoRow label="Lokasi"     value={n.persona.geo} />}
                {n.persona.income_range && <InfoRow label="Income"     value={n.persona.income_range} />}
                {n.persona.pain_point   && <InfoRow label="Pain Point" value={n.persona.pain_point} highlight />}
              </div>
            </>
          )}

          {/* Content */}
          <SectionTitle icon="✍️" title="Content" />

          {n.hook && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>🎣 Hook</div>
              <div style={{ background: '#fffbf0', borderLeft: '3px solid #FFA726', padding: '0.7rem 0.9rem', borderRadius: '0 8px 8px 0', fontSize: '0.88rem', lineHeight: 1.6, color: '#333', fontStyle: 'italic' }}>{n.hook}</div>
            </div>
          )}
          {n.hookVisual && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>👁 Hook Visual (0–3 detik)</div>
              <div style={{ background: '#f8f9fa', borderLeft: '3px solid #90A4AE', padding: '0.7rem 0.9rem', borderRadius: '0 8px 8px 0', fontSize: '0.84rem', lineHeight: 1.6, color: '#555' }}>{n.hookVisual}</div>
            </div>
          )}
          {/* TikTok Inbox Banner */}
          {isInboxUploaded && (
            <div style={{ background: '#fff3e0', border: '1.5px solid #FFB300', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#E65100', marginBottom: '0.4rem' }}>🎵 Video ada di TikTok Inbox</div>
              <div style={{ fontSize: '0.78rem', color: '#6D4C41', lineHeight: 1.6, marginBottom: '0.65rem' }}>
                TikTok tidak otomatis mengisi caption. Sebelum tap <strong>Post</strong> di inbox, copy caption + hashtag di bawah dan paste ke kolom deskripsi.
              </div>
              <button
                onClick={handleCopyTikTokCaption}
                style={{ background: captionCopied ? '#2E7D32' : '#E65100', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'background 0.2s' }}
              >
                {captionCopied ? '✅ Tersalin!' : '📋 Copy Caption + Hashtag'}
              </button>
            </div>
          )}

          {n.caption && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>📝 Caption Reels</div>
              {editCaption ? (
                <div>
                  <textarea
                    value={captionDraft}
                    onChange={e => setCaptionDraft(e.target.value)}
                    rows={10}
                    style={{ width: '100%', background: '#fafffe', border: '1.5px solid #4CAF50', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.84rem', lineHeight: 1.7, color: '#333', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                    <button onClick={handleSaveCaption} disabled={savingCaption} style={{ background: savingCaption ? '#a5d6a7' : '#2E7D32', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.82rem', cursor: savingCaption ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)' }}>
                      {savingCaption ? '⏳ Menyimpan...' : '💾 Simpan'}
                    </button>
                    <button onClick={() => { setEditCaption(false); setCaptionDraft(n.caption); setCaptionSaveMsg(null); }} style={{ background: '#f5f5f5', color: '#555', border: '1px solid #e0e0e0', borderRadius: 8, padding: '0.5rem 0.85rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                      Batal
                    </button>
                    {captionSaveMsg && <span style={{ fontSize: '0.8rem', color: captionSaveMsg.startsWith('✅') ? '#2E7D32' : '#C62828' }}>{captionSaveMsg}</span>}
                  </div>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{ background: '#fafafa', border: '1px solid #e8eaed', padding: '0.85rem 1rem', borderRadius: 10, fontSize: '0.84rem', lineHeight: 1.7, color: '#333', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>{captionDraft}</div>
                  {item.status !== 'posted' && item._filepath && (
                    <button onClick={() => { setCaptionDraft(captionDraft); setEditCaption(true); setCaptionSaveMsg(null); }} style={{ position: 'absolute', top: 8, right: 8, background: 'white', border: '1px solid #e0e0e0', borderRadius: 6, padding: '0.2rem 0.55rem', fontSize: '0.74rem', fontWeight: 600, color: '#555', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      ✏️ Edit
                    </button>
                  )}
                  {captionSaveMsg && <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#2E7D32' }}>{captionSaveMsg}</div>}
                </div>
              )}
            </div>
          )}
          {(n.ctaPrimary || n.ctaSecondary) && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.4rem' }}>📣 CTA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {n.ctaPrimary   && <div style={{ background: '#2E7D32', color: 'white', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.83rem', fontWeight: 600 }}>🚀 {n.ctaPrimary}</div>}
                {n.ctaSecondary && <div style={{ background: '#e8f5e9', color: '#2E7D32', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.83rem', fontWeight: 600, border: '1px solid #c8e6c9' }}>🔖 {n.ctaSecondary}</div>}
              </div>
            </div>
          )}
          {n.hashtags && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.4rem' }}>🏷 Hashtags</div>
              <HashtagPills hashtags={n.hashtags} />
            </div>
          )}
          {n.bestPostTime && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.3rem' }}>📅 Waktu Posting</div>
              <div style={{ fontSize: '0.9rem', color: '#333' }}><BestTime bpt={n.bestPostTime} /></div>
            </div>
          )}

          {/* Score - Hiden by User Request
          {n.score && (
            ...
          )}
          */}

          {/* Video Production */}
          {n.videoProd && (
            <>
              <SectionTitle icon="🎬" title="Video Production" />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                {n.videoProd.duration_seconds && <MetaChip label="Durasi" value={`${n.videoProd.duration_seconds}s`} />}
                {n.videoProd.fps              && <MetaChip label="FPS"    value={`${n.videoProd.fps}`} />}
                {n.videoProd.aspect_ratio     && <MetaChip label="Rasio"  value={n.videoProd.aspect_ratio} />}
                {n.videoProd.dimensions       && <MetaChip label="Size"   value={n.videoProd.dimensions} />}
              </div>
              {n.videoProd.audio && (
                <div style={{ background: '#fafafa', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.85rem', fontSize: '0.82rem', border: '1px solid #f0f0f0' }}>
                  🎵 BGM: <strong>{n.videoProd.audio.bgm_mood}</strong>
                  {n.videoProd.audio.bgm_note && <span style={{ color: '#777' }}> — {n.videoProd.audio.bgm_note}</span>}
                  {n.videoProd.audio.vo_tone  && <div style={{ color: '#555', marginTop: '0.35rem' }}>🎙 VO Tone: {n.videoProd.audio.vo_tone}</div>}
                  {!!n.videoProd.audio.sfx?.length && <div style={{ color: '#555', marginTop: '0.25rem' }}>🔊 SFX: {n.videoProd.audio.sfx.join(', ')}</div>}
                </div>
              )}
              {!!scenes.length && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.65rem' }}>Scene Breakdown</div>
                  <SceneTimeline scenes={scenes} />
                </div>
              )}
              {n.videoProd.post_production && (
                <div style={{ marginTop: '0.85rem', background: '#fafafa', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', border: '1px solid #f0f0f0' }}>
                  ✂️ <strong>Transisi:</strong> {n.videoProd.post_production.transition_style}
                  {n.videoProd.post_production.color_grading && <div style={{ marginTop: '0.25rem', color: '#555' }}>🎨 Color: {n.videoProd.post_production.color_grading}</div>}
                </div>
              )}
              {n.videoProd.export_specs && (
                <div style={{ marginTop: '0.6rem', background: '#fafafa', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.8rem', color: '#555', border: '1px solid #f0f0f0' }}>
                  💾 {n.videoProd.export_specs.format} · {n.videoProd.export_specs.codec} · {n.videoProd.export_specs.resolution} · {n.videoProd.export_specs.fps}fps · {n.videoProd.export_specs.bitrate}
                  {n.videoProd.export_specs.file_size_max && ` · max ${n.videoProd.export_specs.file_size_max}`}
                </div>
              )}
            </>
          )}

          {/* Carousel Slides */}
          {n.carouselSlides && n.carouselSlides.length > 0 && (
            <>
              <SectionTitle icon="🖼️" title="Carousel Slides" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {n.carouselSlides.map((slide: string, i: number) => (
                  <div key={i} style={{ background: '#fafafa', padding: '0.85rem 1rem', borderRadius: 10, fontSize: '0.85rem', color: '#333', border: '1px solid #f0f0f0', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 800, marginRight: '0.5rem', color: '#2E7D32', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Slide {i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{slide.replace(/^slide \d+:\s*/i, '')}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Visual Brief */}
          {n.visualBrief && (
            <>
              <SectionTitle icon="🎨" title="Visual Brief" />
              <div style={{ background: '#fafafa', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid #f0f0f0', marginBottom: '0.85rem' }}>
                {n.visualBrief.image_dimensions && <InfoRow label="Dimensi" value={n.visualBrief.image_dimensions} />}
                {n.visualBrief.layout_guidelines && <InfoRow label="Layout" value={n.visualBrief.layout_guidelines} />}
              </div>

              {n.visualBrief.brand_colors && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.5rem' }}>Brand Colors</div>
                  {Object.entries(n.visualBrief.brand_colors as Record<string, string>).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 5, background: v, border: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.78rem', color: '#555', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                      <span style={{ fontSize: '0.72rem', color: '#aaa', fontFamily: 'monospace' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              {(n.visualBrief.fonts || n.visualBrief.typography) && (
                <div style={{ marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.4rem' }}>Typography</div>
                  {Object.entries((n.visualBrief.fonts || n.visualBrief.typography) as Record<string, string>).map(([k, v]) => (
                    <div key={k} style={{ fontSize: '0.8rem', color: '#444', marginBottom: '0.25rem' }}>
                      <span style={{ color: '#bbb', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}: </span>{String(v)}
                    </div>
                  ))}
                </div>
              )}
              {n.visualBrief.visual_elements && (
                typeof n.visualBrief.visual_elements === 'string' ? (
                  <div style={{ background: '#fafafa', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', border: '1px solid #f0f0f0' }}>
                    {n.visualBrief.visual_elements}
                  </div>
                ) : (
                  <div style={{ background: '#fafafa', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', border: '1px solid #f0f0f0' }}>
                    {n.visualBrief.visual_elements.use   && <div style={{ marginBottom: '0.3rem' }}>✅ {n.visualBrief.visual_elements.use}</div>}
                    {n.visualBrief.visual_elements.avoid && <div style={{ color: '#C62828' }}>🚫 {n.visualBrief.visual_elements.avoid}</div>}
                  </div>
                )
              )}
            </>
          )}

          {/* References */}
          {!!n.refs?.length && (
            <>
              <SectionTitle icon="🔗" title="Reference Content" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {n.refs.map((r, i) => (
                  <a key={i} href={r} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.81rem', color: '#1565C0', wordBreak: 'break-all', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >🔗 {r}</a>
                ))}
              </div>
            </>
          )}

          {/* Brand Safety & Approval - Hiden by User Request */}
        </div>
      </div>
    </>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────
function ContentCard({ item, onSelect }: { item: CMOContent; onSelect: () => void }) {
  const n     = norm(item);
  const avg   = avgScore(n.score);
  const platC = PLAT_COLOR[item.platform?.toLowerCase()] || '#555';
  const ss    = STATUS_STYLE[item.status] || { bg: '#f5f5f5', color: '#555', border: '#ddd' };
  const fmtC  = FMT_COLOR[item.format?.toLowerCase() || ''] || '#555';
  return (
    <div onClick={onSelect} style={{ background: 'white', borderRadius: 14, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f0f2f5', transition: 'transform 0.15s, box-shadow 0.15s', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.11)'; el.style.borderColor = '#e0e0e0'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(0)';    el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)'; el.style.borderColor = '#f0f2f5'; }}
    >
      <div style={{ height: 4, background: `linear-gradient(90deg, ${platC}, ${platC}88)` }} />
      <div style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <Badge label={`${PLAT_ICON[item.platform?.toLowerCase()] || '📱'} ${item.platform}`} color={platC} bg={platC + '18'} border={platC + '30'} />
            {item.format && <Badge label={item.format} color={fmtC} bg={fmtC + '18'} />}
          </div>
          <Badge label={item.status} color={ss.color} bg={ss.bg} border={ss.border} />
        </div>
        {item.pillar && <div style={{ fontSize: '0.68rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>{item.pillar}</div>}
        {item.topic  && <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e', marginBottom: '0.5rem', lineHeight: 1.4, fontFamily: 'var(--font-sans)' }}>{item.topic.length > 70 ? item.topic.slice(0, 70) + '…' : item.topic}</div>}
        {n.hook      && <div style={{ fontSize: '0.81rem', color: '#666', lineHeight: 1.55, marginBottom: '0.75rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.hook}</div>}
        <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: '0.7rem', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            {avg > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: '#f0f0f0', borderRadius: 999, height: 5, width: 72, overflow: 'hidden' }}>
                  <div style={{ background: scoreColor(avg), height: 5, width: `${avg}%`, borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: scoreColor(avg), fontFamily: 'var(--font-sans)' }}>{avg}%</span>
              </div>
            ) : <span />}
            <span style={{ fontSize: '0.72rem', color: '#999' }}><BestTime bpt={n.bestPostTime} /></span>
          </div>
          {n.persona?.segment && (
            <div style={{ fontSize: '0.73rem', color: '#888', background: '#fafafa', padding: '0.3rem 0.55rem', borderRadius: 6, marginBottom: '0.4rem', border: '1px solid #f0f0f0' }}>👤 {n.persona.segment}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#ccc', letterSpacing: '0.06em' }}>{item.id}</span>
            <span style={{ fontSize: '0.68rem', color: '#ccc' }}>{fmtDate(item.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Post Modal ──────────────────────────────────────────────────────
function ConfirmPostModal({ item, onConfirm, onCancel, posting }: {
  item: CMOContent; onConfirm: () => void; onCancel: () => void; posting: boolean;
}) {
  const n = norm(item);
  const platColor = PLAT_COLOR[item.platform?.toLowerCase()] || '#555';
  const allTags = !n.hashtags ? [] : Array.isArray(n.hashtags)
    ? n.hashtags
    : Object.values(n.hashtags as HashtagGroups).flat();
  const [assetFiles, setAssetFiles] = useState<Array<{ name: string; url: string; type: 'image' | 'video' }>>([]);
  const [assetLoading, setAssetLoading] = useState(true);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setAssetLoading(true);
      setAssetError(null);
      try {
        const res = await fetch(`/api/cmo/assets?platform=${encodeURIComponent(item.platform)}&id=${encodeURIComponent(item.id)}`);
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok || data.error) {
          setAssetError(data.error || 'Gagal memuat asset');
          setAssetFiles([]);
        } else {
          setAssetFiles(data.files || []);
          setActiveAssetIndex(0);
        }
      } catch {
        if (!mounted) return;
        setAssetError('Gagal memuat asset');
        setAssetFiles([]);
      }
      if (mounted) setAssetLoading(false);
    };
    run();
    return () => { mounted = false; };
  }, [item.id, item.platform]);

  const activeAsset = assetFiles[activeAssetIndex];
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: 18, width: 520, maxHeight: '85vh', overflowY: 'auto', zIndex: 301, boxShadow: '0 30px 100px rgba(0,0,0,0.3)', animation: 'scaleIn 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: 'white', zIndex: 2, borderRadius: '18px 18px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Preview sebelum upload</div>
              <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.1rem', color: '#1a1a2e', margin: 0 }}>
                {item.status === 'failed' ? '🔄 Konfirmasi Retry' : '🚀 Posting'} ke{' '}
                <span style={{ color: platColor }}>{PLAT_ICON[item.platform?.toLowerCase()] || '📱'} {item.platform}</span>
              </h2>
            </div>
            <button onClick={onCancel} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, fontSize: '1rem', color: '#888' }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.85rem' }}>
            <span style={{ background: platColor + '18', color: platColor, border: `1px solid ${platColor}40`, padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
              {PLAT_ICON[item.platform?.toLowerCase()] || '📱'} {item.platform}
            </span>
            {item.format && <span style={{ background: '#f3e5f5', color: '#6A1B9A', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>{item.format}</span>}
            <span style={{ background: '#fff8e1', color: '#E65100', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>ID: {item.id}</span>
          </div>
        </div>

        {/* Content preview */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Asset preview */}
          <div style={{ marginBottom: '1.1rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>🖼 Asset Preview</div>
            {assetLoading ? (
              <div style={{ background: '#fafafa', border: '1.5px solid #e8eaed', borderRadius: 10, padding: '1rem', fontSize: '0.83rem', color: '#888' }}>⏳ Memuat asset...</div>
            ) : assetError ? (
              <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#c62828' }}>❌ {assetError}</div>
            ) : assetFiles.length === 0 ? (
              <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#5d4037' }}>
                ⚠️ Asset belum ditemukan di folder data/assets/{item.platform}/{item.id}/
              </div>
            ) : (
              <div style={{ background: '#fafafa', border: '1.5px solid #e8eaed', borderRadius: 10, padding: '0.85rem' }}>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e0e0e0', background: 'white', marginBottom: '0.6rem' }}>
                  {activeAsset?.type === 'video' ? (
                    <video src={activeAsset.url} controls style={{ width: '100%', maxHeight: 300, display: 'block', background: '#000' }} />
                  ) : (
                    <img src={activeAsset?.url} alt={activeAsset?.name || 'asset-preview'} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }} />
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>{activeAsset?.name}</span>
                  <span style={{ fontSize: '0.72rem', color: '#999' }}>{activeAssetIndex + 1}/{assetFiles.length}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {assetFiles.map((f, idx) => (
                    <button
                      key={f.name}
                      onClick={() => setActiveAssetIndex(idx)}
                      style={{
                        background: idx === activeAssetIndex ? '#e8f5e9' : 'white',
                        color: idx === activeAssetIndex ? '#2e7d32' : '#555',
                        border: `1px solid ${idx === activeAssetIndex ? '#a5d6a7' : '#e0e0e0'}`,
                        borderRadius: 999,
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                        fontWeight: idx === activeAssetIndex ? 700 : 500,
                      }}
                    >
                      {idx + 1}. {f.type === 'video' ? '🎬' : '🖼'} {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hook */}
          {n.hook && (
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>🎣 Hook</div>
              <div style={{ background: '#fffbf0', borderLeft: '3px solid #FFA726', padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', fontSize: '0.9rem', lineHeight: 1.65, color: '#333', fontStyle: 'italic', fontWeight: 500 }}>{n.hook}</div>
            </div>
          )}
          {/* Caption */}
          {n.caption && (
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>📝 Caption yang akan diposting</div>
              <div style={{ background: '#fafafa', border: '1.5px solid #e8eaed', padding: '0.9rem 1rem', borderRadius: 10, fontSize: '0.85rem', lineHeight: 1.75, color: '#333', whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto' }}>{n.caption}</div>
            </div>
          )}
          {/* CTA */}
          {n.ctaPrimary && (
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>📣 CTA</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ background: '#2E7D32', color: 'white', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.84rem', fontWeight: 600 }}>🚀 {n.ctaPrimary}</div>
                {n.ctaSecondary && <div style={{ background: '#e8f5e9', color: '#2E7D32', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.84rem', fontWeight: 600, border: '1px solid #c8e6c9' }}>🔖 {n.ctaSecondary}</div>}
              </div>
            </div>
          )}
          {/* Hashtags */}
          {allTags.length > 0 && (
            <div style={{ marginBottom: '1.1rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#aaa', marginBottom: '0.35rem' }}>🏷 Hashtags ({allTags.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {allTags.slice(0, 20).map((t, i) => <span key={i} style={{ background: '#e8f5e9', color: '#2E7D32', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 500 }}>{t}</span>)}
              </div>
            </div>
          )}
          {/* Best time */}
          {n.bestPostTime && (
            <div style={{ background: '#f0f7ff', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.1rem', fontSize: '0.85rem', color: '#333', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BestTime bpt={n.bestPostTime} />
            </div>
          )}
          {/* Score summary */}
          {n.score && (() => {
            const avg = avgScore(n.score);
            return avg > 0 ? (
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.1rem', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ background: '#f0f0f0', borderRadius: 999, height: 8, flex: 1, overflow: 'hidden' }}>
                  <div style={{ background: scoreColor(avg), height: 8, width: `${avg}%`, borderRadius: 999 }} />
                </div>
                <span style={{ fontWeight: 800, color: scoreColor(avg), fontFamily: 'var(--font-sans)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Avg Score {avg}%</span>
              </div>
            ) : null;
          })()}

          {/* Warning */}
          <div style={{ background: '#fff8e1', border: '1px solid #FFE082', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#5D4037' }}>
            ⚠️ Pastikan gambar/video sudah tersedia di <strong>data/assets/{item.platform}/{item.id}/</strong> sebelum posting.
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onCancel} disabled={posting} style={{ flex: 1, background: 'white', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: 10, padding: '0.85rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Batal</button>
            <button onClick={onConfirm} disabled={posting} style={{ flex: 2, background: posting ? '#a5d6a7' : item.status === 'failed' ? 'linear-gradient(135deg, #1565C0, #1976D2)' : 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: 'white', border: 'none', borderRadius: 10, padding: '0.85rem', fontWeight: 700, fontSize: '0.9rem', cursor: posting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', boxShadow: posting ? 'none' : '0 4px 14px rgba(46,125,50,0.35)' }}>
              {posting ? '⏳ Sedang posting...' : item.status === 'failed' ? `🔄 Retry ke ${PLAT_ICON[item.platform?.toLowerCase()] || ''} ${item.platform}` : `🚀 Post ke ${PLAT_ICON[item.platform?.toLowerCase()] || ''} ${item.platform}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────
interface LiveIG {
  _source: string; _period: string; fetched_at: string;
  name?: string; username: string; biography?: string; website?: string; profile_picture_url?: string;
  followers: number; follows_count?: number; media_count?: number; followers_gained: number;
  posts_count: number; total_reach: number; impressions: number;
  profile_visits: number; link_clicks: number;
  likes: number; comments: number; saves: number; shares: number;
  engagement_rate: number;
  _warning?: string;
}
function AnalyticsPage() {
  const [data,    setData]    = useState<LiveIG | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [period,  setPeriod]  = useState('weekly');

  const fetchAnalytics = useCallback(async (p = period) => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/cmo/analytics?period=${p}`);
      const d   = await res.json();
      if (d.error) setError(d.error);
      else setData(d);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handlePeriod = (p: string) => { setPeriod(p); fetchAnalytics(p); };

  const M = (v: number, unit = '') => (
    <span style={{ fontWeight: 800, fontSize: '1.6rem', color: '#1a1a2e', fontFamily: 'var(--font-sans)', lineHeight: 1 }}>
      {v?.toLocaleString('id-ID')}{unit}
    </span>
  );

  const MetricRow = ({ label, value, unit = '', color = '#1a1a2e', icon = '' }: { label: string; value: number; unit?: string; color?: string; icon?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid #f5f5f5' }}>
      <span style={{ fontSize: '0.83rem', color: '#555' }}>{icon} {label}</span>
      <span style={{ fontWeight: 700, fontFamily: 'var(--font-sans)', color }}>{value?.toLocaleString('id-ID')}{unit}</span>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', color: '#1a1a2e', marginBottom: '0.2rem' }}>📊 Analytics Real-time</h2>
          {data?.fetched_at && (
            <div style={{ fontSize: '0.75rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#e8f5e9', color: '#2E7D32', padding: '0.1rem 0.45rem', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700 }}>LIVE</span>
              {fmtDate(data.fetched_at)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <select value={period} onChange={e => handlePeriod(e.target.value)} style={{ width: 'auto' }}>
            <option value="daily">📅 Hari ini</option>
            <option value="weekly">📅 7 hari</option>
            <option value="monthly">📅 28 hari</option>
          </select>
          <button onClick={() => fetchAnalytics()} disabled={loading} style={{ background: '#1565C0', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', opacity: loading ? 0.65 : 1 }}>
            {loading ? '⏳ Loading...' : '↺ Refresh Data'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#ffebee', border: '1px solid #EF9A9A', borderRadius: 12, padding: '1.25rem 1.5rem', color: '#C62828', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          ❌ <strong>Error:</strong> {error}
          {error.includes('.env') && <div style={{ marginTop: '0.5rem', color: '#555' }}>Pastikan <code>META_ACCESS_TOKEN</code> dan <code>INSTAGRAM_BUSINESS_ACCOUNT_ID</code> sudah diisi di <strong>.env</strong>.</div>}
        </div>
      )}

      {loading && !data && <div style={{ textAlign: 'center', padding: '5rem', color: '#bbb' }}>⏳ Mengambil data dari Meta Graph API...</div>}

      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Account profile ── */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                {data.profile_picture_url ? (
                  <img src={data.profile_picture_url} alt="IG Profile" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f0f0f0' }} />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '1.1rem' }}>📸</div>
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a2e', fontFamily: 'var(--font-sans)' }}>{data.name || 'Instagram Account'}</div>
                  <div style={{ fontSize: '0.82rem', color: '#666' }}>@{data.username || '-'}</div>
                  {!!data.website && (
                    <a href={data.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.76rem', color: '#1565C0', textDecoration: 'none' }}>
                      🔗 {data.website}
                    </a>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#fce4ec', color: '#E1306C', padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700 }}>Followers: {data.followers.toLocaleString('id-ID')}</span>
                <span style={{ background: '#e3f2fd', color: '#1565C0', padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700 }}>Following: {(data.follows_count || 0).toLocaleString('id-ID')}</span>
                <span style={{ background: '#f3e5f5', color: '#7B1FA2', padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700 }}>Media: {(data.media_count || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
            {!!data.biography && (
              <div style={{ marginTop: '0.8rem', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '0.75rem 0.9rem', fontSize: '0.82rem', color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {data.biography}
              </div>
            )}
            {!!data._warning && (
              <div style={{ marginTop: '0.75rem', background: '#fff8e1', border: '1px solid #FFE082', borderRadius: 8, padding: '0.55rem 0.8rem', fontSize: '0.76rem', color: '#8D6E63' }}>
                ⚠️ {data._warning}
              </div>
            )}
          </div>

          {/* ── Hero cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[{ label: 'Followers', value: data.followers, color: '#E1306C', icon: '📸' },
              { label: 'Engagement Rate', value: data.engagement_rate, color: '#2E7D32', icon: '📈', unit: '%' },
              { label: 'Total Reach', value: data.total_reach, color: '#1565C0', icon: '👁' },
              { label: 'Impressions', value: data.impressions, color: '#6A1B9A', icon: '✨' },
            ].map(c => (
              <div key={c.label} style={{ background: 'white', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: c.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {M(c.value, c.unit)}
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.3rem' }}>{c.label}</div>
                  </div>
                  <span style={{ fontSize: '1.6rem', opacity: 0.7 }}>{c.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Instagram detail ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Engagement breakdown */}
            <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#E1306C', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>📸 Instagram Engagement</span>
                <span style={{ background: '#fce4ec', color: '#E1306C', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 700 }}>@{data.username}</span>
              </div>
              <MetricRow icon="❤️" label="Likes"     value={data.likes}         color="#E91E63" />
              <MetricRow icon="💬" label="Comments" value={data.comments}      color="#1565C0" />
              <MetricRow icon="🔖" label="Saves"     value={data.saves}         color="#9C27B0" />
              <MetricRow icon="🔄" label="Shares"    value={data.shares}        color="#2E7D32" />
              <MetricRow icon="📊" label="Posts"     value={data.posts_count}   color="#555"   />
            </div>

            {/* Reach & discovery */}
            <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1565C0', marginBottom: '1rem' }}>👁 Reach & Discovery</div>
              <MetricRow icon="🌏" label="Total Reach"     value={data.total_reach}    color="#1565C0" />
              <MetricRow icon="✨" label="Impressions"       value={data.impressions}    color="#6A1B9A" />
              <MetricRow icon="🔍" label="Profile Visits"  value={data.profile_visits} color="#E65100" />
              <MetricRow icon="🔗" label="Link Clicks"     value={data.link_clicks}    color="#2E7D32" />
              <MetricRow icon="📈" label="New Followers"   value={data.followers_gained} color="#2E7D32" />
            </div>
          </div>

          {/* ── Engagement rate bar ── */}
          {(() => {
            const er = data.engagement_rate;
            const target = 3.5;
            const pct = Math.min((er / 10) * 100, 100);
            const color = er >= 5 ? '#2E7D32' : er >= 3 ? '#F57C00' : '#C62828';
            return (
              <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color }}>🎯 Engagement Rate</div>
                  <span style={{ fontSize: '0.78rem', color: '#aaa' }}>Target: {target}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 999, height: 12, overflow: 'hidden' }}>
                    <div style={{ background: color, borderRadius: 999, height: 12, width: `${pct}%`, transition: 'width 0.8s ease' }} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '1.4rem', color, fontFamily: 'var(--font-sans)', minWidth: 60 }}>{er}%</span>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: er >= target ? '#2E7D32' : '#E65100' }}>
                  {er >= target
                    ? `✅ Di atas target (${target}%) — pertahankan kualitas konten!`
                    : `⚠️ Di bawah target (${target}%) — tingkatkan konten carousel & Stories.`}
                </div>
              </div>
            );
          })()}

          {/* ── Data source badge ── */}
          <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#bbb' }}>
            Data: <strong style={{ color: '#2E7D32' }}>Meta Graph API v19.0</strong> · Period: {data._period} · {fmtDate(data.fetched_at)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Strategy Page ────────────────────────────────────────────────────────────
function StrategyPage() {
  const [data,        setData]        = useState<{ strategy: Strategy | null; analytics: Analytics | null } | null>(null);
  const [liveIG,      setLiveIG]      = useState<LiveIG | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [cmdOut,      setCmdOut]      = useState('');
  const [period,      setPeriod]      = useState('weekly');
  const [focus,       setFocus]       = useState('');
  const [showGenForm, setShowGenForm] = useState(false);

  const fetchStrategy = useCallback(async () => {
    setLoading(true);
    try {
      const [stratRes, analyticsRes] = await Promise.all([
        fetch('/api/cmo/strategy'),
        fetch('/api/cmo/analytics?period=weekly'),
      ]);
      const d = await stratRes.json();
      setData(d);
      if (analyticsRes.ok) {
        const live = await analyticsRes.json();
        if (!live.error) setLiveIG(live as LiveIG);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStrategy(); }, [fetchStrategy]);

  const handleGenerate = async () => {
    setGenerating(true);
    setCmdOut('');
    try {
      const res = await fetch('/api/cmo/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', period, focus }),
      });
      const d = await res.json();
      setCmdOut(d.stdout || d.error || '');
      await fetchStrategy();
    } catch (e: any) { setCmdOut(e.message); }
    setGenerating(false);
    setShowGenForm(false);
  };

  const s  = data?.strategy;
  const an = data?.analytics;
  // Use live Instagram data for analytics panel; fall back to stale snapshot
  const igLive = liveIG;
  const igMetrics = igLive
    ? {
        followers:       igLive.followers,
        followers_gained: igLive.followers_gained,
        likes:           igLive.likes,
        comments:        igLive.comments,
        saves:           igLive.saves ?? 0,
        total_reach:     igLive.total_reach,
        impressions:     igLive.impressions,
        posts_count:     igLive.posts_count,
        profile_visits:  igLive.profile_visits,
        link_clicks:     igLive.link_clicks,
        engagement_rate: igLive.engagement_rate,
        _source:         (igLive as any)._source,
      }
    : an?.metrics?.instagram ?? null;
  // TikTok: hanya tampilkan kalau sumbernya bukan simulasi
  const ttRaw = an?.metrics?.tiktok ?? null;
  const ttMetrics = (ttRaw && (ttRaw as any)._source && (ttRaw as any)._source !== 'simulated') ? ttRaw : null;

  const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
    HIGH:   { bg: '#ffebee', color: '#C62828' },
    MEDIUM: { bg: '#fff8e1', color: '#E65100' },
    LOW:    { bg: '#e8f5e9', color: '#2E7D32' },
  };

  return (
    <div>
      {/* ── Strategy header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', color: '#1a1a2e', marginBottom: '0.2rem' }}>📋 Marketing Strategy</h2>
          {s?.generated_at && <div style={{ fontSize: '0.78rem', color: '#aaa' }}>Generated: {fmtDate(s.generated_at)}</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {showGenForm ? (
            <>
              <select value={period} onChange={e => setPeriod(e.target.value)} style={{ width: 'auto' }}>
                <option value="weekly">📅 Weekly</option>
                <option value="monthly">📅 Monthly</option>
                <option value="quarterly">📅 Quarterly</option>
              </select>
              <input type="text" placeholder="Focus (opsional)" value={focus} onChange={e => setFocus(e.target.value)} style={{ width: 200 }} />
              <button onClick={handleGenerate} disabled={generating} style={{ background: generating ? '#a5d6a7' : '#2E7D32', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
                {generating ? '⏳ Generating...' : '✨ Generate'}
              </button>
              <button onClick={() => setShowGenForm(false)} style={{ background: '#f5f5f5', color: '#555', border: 'none', borderRadius: 8, padding: '0.5rem 0.85rem', cursor: 'pointer', fontSize: '0.85rem' }}>Batal</button>
            </>
          ) : (
            <>
              <button onClick={fetchStrategy} disabled={loading} style={{ background: 'white', color: '#555', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>{loading ? '⟳' : '↺'} Refresh</button>
              <button onClick={() => setShowGenForm(true)} style={{ background: '#2E7D32', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>✨ Generate Baru</button>
            </>
          )}
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '5rem', color: '#bbb' }}>⏳ Memuat strategi...</div>}

      {!loading && !s && (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#ccc' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.4 }}>📋</div>
          <div>Belum ada strategi. Klik "Generate Baru" untuk membuat.</div>
        </div>
      )}

      {s && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* ── Executive summary ── */}
          <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '4px solid #2E7D32' }}>
            <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#2E7D32', marginBottom: '0.75rem' }}>📌 Executive Summary</div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#444', lineHeight: 1.7 }}>{s.executive_summary}</p>
            {s.main_objective && (
              <div style={{ marginTop: '0.85rem', background: '#f0f7ff', borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.85rem', color: '#1565C0', fontWeight: 500 }}>
                🎯 <strong>Objective:</strong> {s.main_objective}
              </div>
            )}
            {s.key_themes?.length && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                {s.key_themes.map((t, i) => <span key={i} style={{ background: '#e8f5e9', color: '#2E7D32', padding: '0.25rem 0.7rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>{t}</span>)}
              </div>
            )}
          </div>

          {/* ── Analytics + KPI targets ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Analytics */}
            {(igMetrics || ttMetrics) && (
              <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1565C0' }}>📊 Analytics (weekly)</div>
                  {(igMetrics as any)?._source === 'graph_api'
                    ? <span style={{ background: '#e8f5e9', color: '#2E7D32', fontSize: '0.67rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 999, letterSpacing: '0.06em' }}>● LIVE</span>
                    : <span style={{ background: '#fff8e1', color: '#E65100', fontSize: '0.67rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 999, letterSpacing: '0.06em' }}>SNAPSHOT</span>
                  }
                </div>
                {igMetrics && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: PLAT_COLOR['instagram'], fontSize: '1rem' }}>📸</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>instagram</div>
                        <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{igMetrics.followers?.toLocaleString('id-ID')} followers</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e', fontFamily: 'var(--font-sans)' }}>{igMetrics.likes?.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Likes</div>
                    </div>
                  </div>
                )}
                {ttMetrics && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid #f5f5f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ color: PLAT_COLOR['tiktok'], fontSize: '1rem' }}>🎵</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>tiktok</div>
                        <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{ttMetrics.followers?.toLocaleString('id-ID')} followers</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e', fontFamily: 'var(--font-sans)' }}>{ttMetrics.total_views?.toLocaleString('id-ID')}</div>
                      <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Views</div>
                    </div>
                  </div>
                )}
                {igMetrics && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#e8f5e9', color: '#2E7D32', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 999 }}>ER {igMetrics.engagement_rate}%</span>
                    <span style={{ background: '#e1f5fe', color: '#0277BD', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 999 }}>+{igMetrics.followers_gained} followers</span>
                    <span style={{ background: '#f3e5f5', color: '#6A1B9A', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 999 }}>{igMetrics.total_reach?.toLocaleString('id-ID')} reach</span>
                  </div>
                )}
              </div>
            )}

            {/* KPI Targets */}
            {s.kpi_targets && (
              <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#6A1B9A', marginBottom: '1rem' }}>🎯 KPI Targets</div>
                {Object.entries(s.kpi_targets).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid #f5f5f5' }}>
                    <span style={{ fontSize: '0.82rem', color: '#555', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#6A1B9A', fontFamily: 'var(--font-sans)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Content plan ── */}
          {s.weekly_content_plan?.length && (
            <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#E65100', marginBottom: '1rem' }}>📅 Content Plan</div>
              {s.weekly_content_plan.map((w, i) => (
                <div key={i} style={{ background: '#fafafa', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '0.75rem', border: '1px solid #f0f0f0' }}>
                  {w.week_label && <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#1a1a2e' }}>{w.week_label}</div>}
                  {w.focus      && <div style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.65rem', lineHeight: 1.5 }}>{w.focus}</div>}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {w.instagram_posts && <span style={{ background: '#E1306C18', color: '#E1306C', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>📸 {w.instagram_posts} posts</span>}
                    {w.tiktok_videos   && <span style={{ background: '#EE1D5218', color: '#EE1D52', padding: '0.2rem 0.65rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>🎵 {w.tiktok_videos} videos</span>}
                  </div>
                  {w.campaign_idea && <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#1565C0', fontWeight: 500 }}>💡 {w.campaign_idea}</div>}
                  {w.key_message   && <div style={{ fontSize: '0.79rem', color: '#777', marginTop: '0.45rem', fontStyle: 'italic' }}>💬 {w.key_message}</div>}
                </div>
              ))}
            </div>
          )}

          {/* ── Content ideas ── */}
          {!!s.content_ideas?.length && (
            <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9C27B0', marginBottom: '1rem' }}>💡 Content Ideas ({s.content_ideas.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
                {s.content_ideas.map((idea, i) => {
                  const pC = PLAT_COLOR[idea.platform?.toLowerCase()] || '#555';
                  const fC = FMT_COLOR[idea.format?.toLowerCase()] || '#555';
                  return (
                    <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '0.85rem 1rem', background: '#fafafa', borderTop: `3px solid ${pC}` }}>
                      <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                        <span style={{ background: pC + '18', color: pC, padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>{PLAT_ICON[idea.platform?.toLowerCase()] || '📱'} {idea.platform}</span>
                        <span style={{ background: fC + '18', color: fC, padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>{idea.format}</span>
                      </div>
                      {idea.pillar && <div style={{ fontSize: '0.67rem', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{idea.pillar}</div>}
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: '0.4rem', lineHeight: 1.4 }}>{idea.title}</div>
                      {idea.hook && <div style={{ fontSize: '0.78rem', color: '#666', fontStyle: 'italic', lineHeight: 1.5 }}>🎣 {idea.hook}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Hashtag strategy ── */}
          {s.hashtag_strategy && (
            <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#2E7D32', marginBottom: '1rem' }}>🏷 Hashtag Strategy</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[{ k: 'primary' as const, label: 'Primary', color: '#2E7D32', bg: '#e8f5e9' }, { k: 'secondary' as const, label: 'Secondary', color: '#0277BD', bg: '#e1f5fe' }, { k: 'trending_suggestions' as const, label: 'Trending', color: '#E65100', bg: '#fff3e0' }].map(g => (
                  s.hashtag_strategy?.[g.k]?.length ? (
                    <div key={g.k}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: g.color, marginBottom: '0.5rem' }}>{g.label}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {s.hashtag_strategy[g.k]!.map((t, i) => <span key={i} style={{ background: g.bg, color: g.color, padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>)}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            </div>
          )}

          {/* ── Action items ── */}
          {!!s.action_items?.length && (
            <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#C62828', marginBottom: '1rem' }}>✅ Action Items</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {s.action_items.map((a, i) => {
                  const ps = PRIORITY_STYLE[a.priority] || { bg: '#f5f5f5', color: '#555' };
                  return (
                    <div key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '0.75rem 1rem', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
                      <span style={{ background: ps.bg, color: ps.color, padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{a.priority}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#333', marginBottom: '0.2rem' }}>{a.task}</div>
                        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>📅 {a.deadline}{a.owner ? ` · 👤 ${a.owner}` : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Growth Roadmap ── */}
          {(s as any).growth_roadmap && (() => {
            const r = (s as any).growth_roadmap;
            return (
              <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '4px solid #00897B' }}>
                <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#00897B', marginBottom: '1rem' }}>🚀 Growth Roadmap</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  {r.current_state && (
                    <div style={{ background: '#e0f2f1', borderRadius: 8, padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#00897B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Kondisi Saat Ini</div>
                      <div style={{ fontSize: '0.82rem', color: '#333' }}>{r.current_state}</div>
                    </div>
                  )}
                  {r.bottleneck && (
                    <div style={{ background: '#ffebee', borderRadius: 8, padding: '0.75rem 1rem' }}>
                      <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#C62828', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Bottleneck</div>
                      <div style={{ fontSize: '0.82rem', color: '#333' }}>{r.bottleneck}</div>
                    </div>
                  )}
                  {r.primary_lever && (
                    <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '0.75rem 1rem', gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '0.67rem', fontWeight: 700, color: '#2E7D32', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Primary Lever</div>
                      <div style={{ fontSize: '0.85rem', color: '#1a1a2e', fontWeight: 600 }}>{r.primary_lever}</div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[['Minggu 1', r.milestone_week_1, '#1565C0'], ['Minggu 2', r.milestone_week_2, '#6A1B9A'], ['Akhir Bulan', r.milestone_week_4, '#00897B']].filter(([,v]) => v).map(([label, val, color]) => (
                    <div key={label as string} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.85rem', background: '#fafafa', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                      <span style={{ background: (color as string) + '18', color: color as string, fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: 4, whiteSpace: 'nowrap' }}>{label as string}</span>
                      <span style={{ fontSize: '0.82rem', color: '#444' }}>{val as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ── Competitor + CMO notes ── */}
          {(s.competitor_insights || s.cmo_notes) && (
            <div style={{ display: 'grid', gridTemplateColumns: s.competitor_insights && s.cmo_notes ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
              {s.competitor_insights && (
                <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '4px solid #F57C00' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#F57C00', marginBottom: '0.65rem' }}>🔍 Competitor Insights</div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: 1.65 }}>{s.competitor_insights}</p>
                </div>
              )}
              {s.cmo_notes && (
                <div style={{ background: 'white', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', borderLeft: '4px solid #1565C0' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#1565C0', marginBottom: '0.65rem' }}>📝 CMO Notes</div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: 1.65 }}>{s.cmo_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Terminal output */}
      {cmdOut && (
        <div style={{ marginTop: '1.5rem', background: '#0d1117', borderRadius: 12, padding: '1.25rem 1.5rem', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto' }}>
          <div style={{ color: '#3fb950', fontWeight: 700, marginBottom: '0.6rem' }}>▶ Output</div>
          {cmdOut}
        </div>
      )}
    </div>
  );
}

// ─── Generate Modal ───────────────────────────────────────────────────────────
function GenerateModal({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (p: string, f: string, t: string, c: string, noShooting: boolean) => void; loading: boolean }) {
  const [platform, setPlatform] = useState('instagram');
  const [format,   setFormat]   = useState('auto');
  const [topic,    setTopic]    = useState('');
  const [count,    setCount]    = useState('1');
  const [noShooting, setNoShooting] = useState(true);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, animation: 'fadeIn 0.2s ease', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', borderRadius: 16, width: 460, padding: '2rem', zIndex: 201, boxShadow: '0 25px 80px rgba(0,0,0,0.25)', animation: 'scaleIn 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.15rem', color: '#1b5e20' }}>✨ Generate Konten Baru</h2>
          <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, fontSize: '1rem', color: '#888' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.83rem', fontWeight: 600, color: '#555' }}>
            Platform
            <select value={platform} onChange={e => setPlatform(e.target.value)}>
              <option value="instagram">📸 Instagram</option>
              <option value="tiktok">🎵 TikTok</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.83rem', fontWeight: 600, color: '#555' }}>
            Format
            <select value={format} onChange={e => setFormat(e.target.value)}>
              <option value="auto">🤖 Auto (AI memilih)</option>
              <option value="video">🎬 Reels / Video</option>
              <option value="image">🖼 Carousel / Image</option>
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.83rem', fontWeight: 600, color: '#555' }}>
            Topik <span style={{ fontWeight: 400, color: '#bbb' }}>(opsional)</span>
            <input type="text" placeholder="cth: Reels tips menabung Gen Z" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === 'Enter' && !loading && onSubmit(platform, format, topic, count, noShooting)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.83rem', fontWeight: 600, color: '#555' }}>
            Jumlah Konten
            <input type="number" min="1" max="5" value={count} onChange={e => setCount(e.target.value)} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.83rem', fontWeight: 600, color: '#555' }}>
            Video Mode
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => setNoShooting(true)} style={{ flex: 1, background: noShooting ? '#e8f5e9' : 'white', color: noShooting ? '#1b5e20' : '#555', border: `1.5px solid ${noShooting ? '#a5d6a7' : '#e0e0e0'}`, borderRadius: 8, padding: '0.55rem 0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                ✅ No Shooting
              </button>
              <button type="button" onClick={() => setNoShooting(false)} style={{ flex: 1, background: !noShooting ? '#fff3e0' : 'white', color: !noShooting ? '#e65100' : '#555', border: `1.5px solid ${!noShooting ? '#ffcc80' : '#e0e0e0'}`, borderRadius: 8, padding: '0.55rem 0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>
                🎥 Allow Shooting
              </button>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#999', fontWeight: 500 }}>
              Berlaku khusus konten video/Reels.
            </span>
          </label>

          <button onClick={() => onSubmit(platform, format, topic, count, noShooting)} disabled={loading} style={{ background: loading ? '#a5d6a7' : 'linear-gradient(135deg, #2E7D32, #4CAF50)', color: 'white', border: 'none', borderRadius: 10, padding: '0.9rem', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', fontFamily: 'var(--font-sans)', boxShadow: loading ? 'none' : '0 4px 14px rgba(46,125,50,0.35)' }}>
            {loading ? '⏳ Generating...' : '✨ Generate Konten'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, icon, color, sub }: { value: number; label: string; icon: string; color: string; sub?: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', position: 'relative', overflow: 'hidden', border: '1px solid #f0f2f5' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.05, fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>{value}</div>
          <div style={{ fontSize: '0.8rem', color: '#777', marginTop: '0.35rem', fontWeight: 500 }}>{label}</div>
          {sub && <div style={{ fontSize: '0.68rem', color: color, marginTop: '0.15rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{sub}</div>}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{icon}</div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [queue,        setQueue]        = useState<CMOContent[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [selected,     setSelected]     = useState<CMOContent | null>(null);
  const [activeTab,    setActiveTab]    = useState<'pending' | 'posted' | 'failed'>('pending');
  const [posting,      setPosting]      = useState(false);
  const [cmdOutput,    setCmdOutput]    = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [filterPlat,   setFilterPlat]   = useState('all');
  const [search,       setSearch]       = useState('');
  // Nav
  const [navPage,      setNavPage]      = useState<'content' | 'strategy' | 'analytics'>('content');
  // Confirm post
  const [confirmItem,  setConfirmItem]  = useState<CMOContent | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/cmo/queue');
      const data = await res.json();
      setQueue(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  const api = async (action: string, params: Record<string, string> = {}) => {
    const res = await fetch('/api/cmo/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params }),
    });
    return res.json();
  };

  const handlePost = (id: string) => {
    const item = queue.find(q => q.id === id);
    if (item) setConfirmItem(item);
  };

  const handleConfirmPost = async () => {
    if (!confirmItem) return;
    setPosting(true);
    const action = confirmItem.status === 'failed' ? 'retry_id' : 'post_id';
    // Kirim platform item agar hanya platform itu yang diposting (bukan semua)
    const res = await api(action, { id: confirmItem.id, platform: confirmItem.platform?.toLowerCase() || '' });
    setCmdOutput(res.stdout || res.error || '');
    setPosting(false);
    setConfirmItem(null);
    setSelected(null);
    await fetchQueue();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Hapus konten ${id}?`)) return;
    const res = await api('delete', { id });
    if (res.success) { setSelected(null); await fetchQueue(); }
    else alert(`Error: ${res.error}`);
  };

  const handleBlast = async (id: string, platforms: string) => {
    const res = await api('blast_id', { id, platforms });
    setCmdOutput(res.stdout || res.error || '');
    await fetchQueue();
  };

  const handleRequeue = async (id: string) => {
    const res = await api('requeue_id', { id });
    setCmdOutput(res.stdout || res.error || '');
    setSelected(null);
    await fetchQueue();
    setActiveTab('pending');
  };

  const handleGenerate = async (platform: string, format: string, topic: string, count: string, noShooting: boolean) => {
    setGenerating(true);
    setCmdOutput('');
    const res = await api('generate', { platform, format, topic, count, no_shooting: String(noShooting) });
    setCmdOutput(res.stdout || res.error || '');
    setGenerating(false);
    setShowGenerate(false);
    await fetchQueue();
    setActiveTab('pending');
  };

  const focusQueue = queue.filter(q => ['instagram', 'tiktok'].includes((q.platform || '').toLowerCase()));
  const pending = focusQueue.filter(q => q.status === 'pending');
  const posted  = focusQueue.filter(q => q.status === 'posted');
  const failed  = focusQueue.filter(q => q.status === 'failed');

  const filtered = focusQueue
    .filter(q => q.status === activeTab)
    .filter(q => filterPlat === 'all' || q.platform?.toLowerCase() === filterPlat)
    .filter(q => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (q.topic   || '').toLowerCase().includes(s)
          || (q.pillar  || '').toLowerCase().includes(s)
          || (q.id      || '').toLowerCase().includes(s)
          || (norm(q).hook || '').toLowerCase().includes(s);
    });

  const tabs = [
    { key: 'pending' as const, label: '⏳ Queue',   count: pending.length, color: '#E65100' },
    { key: 'posted'  as const, label: '✅ Posted',  count: posted.length,  color: '#2E7D32' },
    { key: 'failed'  as const, label: '❌ Failed',  count: failed.length,  color: '#C62828' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header style={{ background: 'linear-gradient(135deg, #1b5e20, #2E7D32)', color: 'white', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>🤖</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>Casha AI CMO</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>Content Management Dashboard</div>
          </div>
        </div>
        {/* Nav tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.25rem', gap: '0.15rem' }}>
          {([{ k: 'content', label: '📦 Konten' }, { k: 'strategy', label: '📋 Strategi' }, { k: 'analytics', label: '📊 Analytics' }] as const).map(n => (
            <button key={n.k} onClick={() => setNavPage(n.k)} style={{ background: navPage === n.k ? 'rgba(255,255,255,0.92)' : 'transparent', color: navPage === n.k ? '#1b5e20' : 'rgba(255,255,255,0.8)', border: 'none', borderRadius: 7, padding: '0.4rem 1rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', transition: 'all 0.15s' }}>{n.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {navPage === 'content' && (
            <button onClick={() => setShowGenerate(true)} style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>✨ Generate</button>
          )}
          <button onClick={fetchQueue} disabled={loading} style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer' }}>
            {loading ? '⟳' : '↺'} Refresh
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.75rem 2rem' }}>

        {/* ── Strategy page ── */}
        {navPage === 'strategy'  && <StrategyPage />}

        {/* ── Analytics page ── */}
        {navPage === 'analytics' && <AnalyticsPage />}

        {navPage === 'content' && (<>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard value={focusQueue.length} label="Total Konten" icon="📦" color="#1565C0" />
          <StatCard value={pending.length} label="Menunggu Posting" icon="⏳" color="#E65100" sub="queue" />
          <StatCard value={posted.length}  label="Sudah Diposting"  icon="✅" color="#2E7D32" sub="posted" />
          <StatCard value={failed.length}  label="Gagal"            icon="❌" color="#C62828" sub="perlu retry" />
        </div>

        {/* ── Platform breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {(['instagram', 'tiktok'] as const).map(p => {
            const total  = focusQueue.filter(q => q.platform?.toLowerCase() === p).length;
            const pend   = focusQueue.filter(q => q.platform?.toLowerCase() === p && q.status === 'pending').length;
            const postedC = focusQueue.filter(q => q.platform?.toLowerCase() === p && q.status === 'posted').length;
            const fail   = focusQueue.filter(q => q.platform?.toLowerCase() === p && q.status === 'failed').length;
            const pC = PLAT_COLOR[p];
            return (
              <div key={p} style={{ background: 'white', borderRadius: 14, padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f0f2f5', borderLeft: `4px solid ${pC}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: pC, fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{PLAT_ICON[p]} {p}</div>
                  <div style={{ fontWeight: 800, fontSize: '1.8rem', color: '#1a1a2e', fontFamily: 'var(--font-sans)', lineHeight: 1, letterSpacing: '-0.02em' }}>{total}</div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#E65100', fontWeight: 600 }}>⏳ {pend} pending</span>
                    <span style={{ fontSize: '0.7rem', color: '#2E7D32', fontWeight: 600 }}>✅ {postedC} posted</span>
                    {fail > 0 && <span style={{ fontSize: '0.7rem', color: '#C62828', fontWeight: 700 }}>❌ {fail} failed</span>}
                  </div>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: pC + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{PLAT_ICON[p]}</div>
              </div>
            );
          })}
        </div>

        {/* ── Tabs + filters ── */}
        <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: '0.95rem 1rem', background: activeTab === tab.key ? '#fafff9' : 'transparent', border: 'none', borderBottom: `2.5px solid ${activeTab === tab.key ? tab.color : 'transparent'}`, cursor: 'pointer', fontWeight: activeTab === tab.key ? 700 : 400, color: activeTab === tab.key ? tab.color : '#888', fontSize: '0.9rem', transition: 'all 0.15s', fontFamily: 'var(--font-sans)' }}>
                {tab.label}
                <span style={{ background: tab.color + '20', color: tab.color, borderRadius: 999, padding: '0.1rem 0.55rem', fontSize: '0.75rem', fontWeight: 800, marginLeft: '0.4rem' }}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div style={{ padding: '0.75rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', background: '#fcfcfc', borderBottom: '1px solid #f5f5f5' }}>
            <select value={filterPlat} onChange={e => setFilterPlat(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
              <option value="all">Semua Platform</option>
              <option value="instagram">📸 Instagram</option>
              <option value="tiktok">🎵 TikTok</option>
            </select>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#ccc', fontSize: '0.85rem' }}>🔍</span>
              <input type="text" placeholder="Cari topik, ID, pillar, hook..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2rem' }} />
            </div>
            <span style={{ fontSize: '0.78rem', color: '#bbb', whiteSpace: 'nowrap' }}>{filtered.length} konten</span>
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#bbb' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }}>⏳</div>
            <div>Memuat konten...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#ccc' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.4 }}>📭</div>
            <div style={{ fontSize: '1rem', color: '#aaa' }}>Tidak ada konten di tab ini</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
            {filtered
              .slice()
              .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
              .map((item, i) => (
                <ContentCard key={item.id + i} item={item} onSelect={() => setSelected(item)} />
              ))}
          </div>
        )}

        {/* ── Terminal output ── */}
        {cmdOutput && (
          <div style={{ marginTop: '2rem', background: '#0d1117', borderRadius: 12, padding: '1.25rem 1.5rem', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ color: '#3fb950', fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.82rem' }}>▶ Output Terminal</div>
            {cmdOutput}
          </div>
        )}

        </>
        )}
      </div>

      {/* ── Modals / panels ── */}
      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} onSubmit={handleGenerate} loading={generating} />}
      {selected     && <DetailPanel item={selected} onClose={() => setSelected(null)} onPost={handlePost} onDelete={handleDelete} posting={posting} onBlast={handleBlast} onRequeue={handleRequeue} onCaptionSaved={(id, newCaption) => {
        setQueue(prev => prev.map(q => q.id === id ? { ...q, caption: newCaption, caption_reels: newCaption } : q));
        setSelected(prev => prev && prev.id === id ? { ...prev, caption: newCaption, caption_reels: newCaption } : prev);
      }} />}
      {confirmItem  && <ConfirmPostModal item={confirmItem} onConfirm={handleConfirmPost} onCancel={() => setConfirmItem(null)} posting={posting} />}
    </div>
  );
}

