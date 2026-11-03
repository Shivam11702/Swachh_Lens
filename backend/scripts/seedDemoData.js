const path = require('path');
const { connect, mongoose } = require('../src/db');
const { Report, Counter } = require('../src/models');

const LOCATIONS = [
  { landmark: 'Campus Gate', lat: 12.9716, lon: 77.5946 },
  { landmark: 'Food Court', lat: 12.9731, lon: 77.5962 },
  { landmark: 'Hostel Block A', lat: 12.9701, lon: 77.5928 },
  { landmark: 'Hostel Block B', lat: 12.9694, lon: 77.5941 },
  { landmark: 'Parking Area', lat: 12.9742, lon: 77.5993 },
  { landmark: 'Central Garden', lat: 12.9722, lon: 77.5955 },
  { landmark: 'Academic Block 1', lat: 12.9708, lon: 77.5975 },
  { landmark: 'Academic Block 2', lat: 12.9689, lon: 77.5968 },
  { landmark: 'Sports Complex', lat: 12.9751, lon: 77.5949 },
  { landmark: 'Library', lat: 12.9719, lon: 77.5987 },
];

const CATEGORIES = [
  'Overflowing bin', 'Litter scattered', 'Improper disposal', 'Dirty surface',
  'Illegal dumping', 'Blocked drainage', 'Plastic waste', 'Organic waste',
];

const COMMENTS = [
  'Bin overflowing near the entrance.',
  'Litter scattered across the walkway.',
  'Waste dumped in the corner overnight.',
  'Surface stained and needs cleaning.',
  'Plastic waste piled near the curb.',
  'Drainage blocked with debris.',
  'Overflowing container attracts pests.',
  'General litter accumulation in the area.',
];

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const STATUSES = ['pending', 'ready', 'assigned', 'in_progress', 'completed', 'closed', 'cancelled'];
const TEAM_IDS = ['team-1', 'team-2', 'team-3'];
const VEHICLE_IDS = ['vehicle-1', 'vehicle-2', 'vehicle-3'];

const VOLUME_BINS = ['small', 'medium', 'large'];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function weighted(arr, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function randomTimestamp(daysAgoMin, daysAgoMax) {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() - randInt(daysAgoMin, daysAgoMax));
  // bias toward peak hours (8-20), with cluster 12-15
  const hour = randInt(7, 21);
  d.setHours(hour, randInt(0, 59), randInt(0, 59), 0);
  return d;
}

function reportIdFor(date, seq) {
  const key = date.toISOString().slice(0, 10).replace(/-/g, '');
  return `REP-${key}-${String(seq).padStart(3, '0')}`;
}

function makeReport(index, total) {
  const loc = pick(LOCATIONS);
  const date = randomTimestamp(0, 89);
  const priority = weighted(PRIORITIES, [0.08, 0.22, 0.4, 0.3]);
  // resolution bias: older reports more likely resolved
  const ageDays = Math.max(0, Math.round((Date.now() - date.getTime()) / 86400000));
  const resolveChance = Math.min(0.92, 0.3 + ageDays * 0.06);
  let status;
  if (Math.random() < resolveChance) {
    status = pick(['completed', 'completed', 'closed']);
  } else if (index % 7 === 0) {
    status = 'cancelled';
  } else {
    status = weighted(STATUSES.slice(0, 4), [0.3, 0.35, 0.2, 0.15]);
  }

  const classificationLabel = pick(CATEGORIES);
  const ml = {
    classification: [{ label: classificationLabel, confidence: Math.round((0.82 + Math.random() * 0.17) * 100) / 100 }],
    volume_bin: weighted(VOLUME_BINS, [0.5, 0.35, 0.15]),
    priority,
    triage_score: randInt(20, 96),
    suggested_team_id: pick(TEAM_IDS),
    suggested_vehicle_type: pick(['small_van', 'medium_truck']),
  };

  const assignment = ['assigned', 'in_progress'].includes(status)
    ? { team_id: pick(TEAM_IDS), vehicle_id: pick(VEHICLE_IDS), scheduled_time: new Date(date.getTime() + 3600000), note: 'Assigned during seed run' }
    : undefined;

  const history = [
    { type: 'created', payload: { source: 'seed' }, created_at: date },
  ];
  if (ml) history.push({ type: 'ml', payload: ml, created_at: new Date(date.getTime() + 60000) });
  if (assignment) history.push({ type: 'assignment', payload: assignment, created_at: new Date(date.getTime() + 7200000) });
  if (['completed', 'closed'].includes(status)) {
    history.push({ type: 'status', from: 'assigned', to: 'completed', created_at: new Date(date.getTime() + 10800000) });
  }

  return {
    report_id: reportIdFor(date, index + 1),
    user_id: null,
    photos: [{ url: '', thumbnail_url: '' }],
    videos: [],
    gps: { lat: Number(loc.lat.toFixed(6)), lon: Number(loc.lon.toFixed(6)) },
    timestamp: date,
    comment: pick(COMMENTS),
    category: classificationLabel,
    estimated_volume: ml.volume_bin,
    landmark: loc.landmark,
    status,
    ml_results: ml,
    assignment,
    comments: status === 'completed'
      ? [{ author: 'Cleanup Crew', text: 'Area cleaned and verified.', created_at: new Date(date.getTime() + 14400000) }]
      : [],
    history,
    created_at: date,
    updated_at: new Date(date.getTime() + 21600000),
  };
}

async function seedReports() {
  await connect();
  const count = Number(process.env.SEED_COUNT || 120);
  const existing = await Report.countDocuments({ report_id: { $regex: /^REP-/ } });
  if (existing > 0) {
    console.log(`${existing} seeded reports already present. Run with SEED_FORCE=1 to clear and reseed.`);
    process.exit(0);
  }

  const reports = Array.from({ length: count }, (_, i) => makeReport(i, count));

  // preserve sequence counters for future auto-increment
  const dateKeys = [...new Set(reports.map((r) => r.report_id.split('-')[1]))];
  const counters = {};
  dateKeys.forEach((k) => {
    counters[k] = Math.max(...reports.filter((r) => r.report_id.includes(k)).map((r) => Number(r.report_id.split('-')[2])));
  });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Report.insertMany(reports, { session });
      for (const [k, seq] of Object.entries(counters)) {
        await Counter.updateOne(
          { _id: `report:${k}` },
          { $max: { seq } },
          { upsert: true, session }
        );
      }
    });
  } finally {
    session.endSession();
  }

  const byStatus = {};
  reports.forEach((r) => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
  const byLoc = {};
  reports.forEach((r) => { byLoc[r.landmark] = (byLoc[r.landmark] || 0) + 1; });

  console.log(`\nSeeded ${reports.length} reports across ${Object.keys(byLoc).length} locations.`);
  console.log('Status distribution:', byStatus);
  console.log('Location distribution:');
  Object.entries(byLoc).sort((a, b) => b[1] - a[1]).forEach(([l, c]) => console.log(`  ${l}: ${c}`));
  console.log('\nDone.');
}

async function main() {
  if (process.env.SEED_FORCE === '1') {
    await connect();
    const res = await Report.deleteMany({ report_id: { $regex: /^REP-/ } });
    console.log(`Cleared ${res.deletedCount} seeded reports (SEED_FORCE=1).`);
  }

  await seedReports();
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
