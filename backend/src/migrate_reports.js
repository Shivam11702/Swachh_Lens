// One-shot migration script: import backend/data/reports.json into MongoDB
// Usage: from backend/ run: node src/migrate_reports.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connect, mongoose } = require('./db');
const { Report, Counter } = require('./schemas_mongo');

async function normalizePhotos(photos) {
  if (!Array.isArray(photos)) return [];
  return photos.map(p => {
    if (!p) return null;
    if (typeof p === 'string') return { url: p, thumbnail_url: null };
    if (typeof p === 'object') return { url: p.url || p.path || null, thumbnail_url: p.thumbnail_url || p.thumbnail || null };
    return null;
  }).filter(Boolean);
}

function normalizeGps(gps) {
  if (!gps) return null;
  if (typeof gps === 'object' && gps.lat !== undefined && gps.lon !== undefined) return { lat: Number(gps.lat), lon: Number(gps.lon) };
  const s = String(gps || '').trim();
  const m = s.match(/(-?\d+\.?\d*)/g);
  if (m && m.length >= 2) return { lat: Number(m[0]), lon: Number(m[1]) };
  try { const parsed = JSON.parse(s); if (parsed && parsed.lat !== undefined && parsed.lon !== undefined) return { lat: Number(parsed.lat), lon: Number(parsed.lon) }; } catch(e){}
  return null;
}

async function run() {
  await connect();
  // Try multiple known locations for reports.json (backend/data or project-root/data)
  let DATA_FILE = path.join(__dirname, '..', 'data', 'reports.json');
  if (!fs.existsSync(DATA_FILE)) {
    const alt = path.join(__dirname, '..', '..', 'data', 'reports.json');
    if (fs.existsSync(alt)) DATA_FILE = alt;
  }
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No reports.json file found at expected locations (backend/data or project-root/data)');
    console.error('Tried:', path.join(__dirname, '..', 'data', 'reports.json'));
    console.error('And:', path.join(__dirname, '..', '..', 'data', 'reports.json'));
    process.exit(1);
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  let data = {};
  try { data = JSON.parse(raw || '{}'); } catch (e) { console.error('Failed to parse JSON:', e.message); process.exit(1); }

  const keys = Object.keys(data);
  console.log(`Found ${keys.length} reports in ${DATA_FILE}`);

  let inserted = 0, skipped = 0, failed = 0;
  let maxSeq = 0;

  for (const key of keys) {
    const doc = data[key];
    try {
      const report_id = doc.report_id || doc.reportId || key;
      // compute numeric seq
      const m = String(report_id).match(/R0*(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maxSeq) maxSeq = n;
      }

      const normalized = {
        report_id: report_id,
        user_id: doc.user_id || doc.userId || null,
        photos: await normalizePhotos(doc.photos || doc.images || []),
        videos: Array.isArray(doc.videos) ? doc.videos : (doc.videos ? [doc.videos] : []),
        gps: normalizeGps(doc.gps || doc.location || doc.gps_raw || doc.gps_json || null),
        timestamp: doc.timestamp ? new Date(doc.timestamp) : (doc.created_at ? new Date(doc.created_at) : new Date()),
        comment: doc.comment || doc.notes || null,
        status: doc.status || 'pending',
        ml_results: doc.ml_results || null,
        assignment: doc.assignment || null,
        created_at: doc.created_at ? new Date(doc.created_at) : new Date(),
      };

      // Upsert only if not exists; use $setOnInsert to preserve existing if already present
      const res = await Report.updateOne({ report_id: normalized.report_id }, { $setOnInsert: normalized }, { upsert: true });
      // Mongo returns nUpserted info in res.upsertedCount for newer drivers
      if (res.upsertedCount && res.upsertedCount > 0) {
        inserted += 1;
      } else {
        // if matchedCount > 0 but not upserted, it's existing
        skipped += 1;
      }
    } catch (e) {
      failed += 1;
      console.error('Failed to migrate', key, e && e.message ? e.message : e);
    }
  }

  console.log(`Migration finished. inserted=${inserted}, skipped=${skipped}, failed=${failed}`);

  // Ensure counter seq >= maxSeq
  try {
    const counter = await Counter.findById('report');
    const current = counter ? counter.seq : 0;
    if (maxSeq > current) {
      await Counter.findByIdAndUpdate('report', { seq: maxSeq }, { upsert: true });
      console.log(`Counter updated to ${maxSeq}`);
    } else {
      console.log(`Counter left as ${current} (maxSeq=${maxSeq})`);
    }
  } catch (e) {
    console.error('Failed to update counter:', e.message || e);
  }

  // close mongoose
  await mongoose.connection.close();
  console.log('Done.');
  process.exit(0);
}

run().catch(e => { console.error('Migration error', e); process.exit(1); });
