const { mongoose } = require('../db');
const { Schema } = mongoose;

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const PhotoSchema = new Schema({ url: String, thumbnail_url: String }, { _id: false });
const GPSSchema = new Schema({ lat: Number, lon: Number }, { _id: false });

const MLResultSchema = new Schema({
  classification: [{ label: String, confidence: Number }],
  volume_bin: String,
  priority: String,
  triage_score: Number,
  suggested_team_id: String,
  suggested_vehicle_type: String,
  duplicate_of: String,
}, { _id: false });

const AssignmentSchema = new Schema({ team_id: String, vehicle_id: String, scheduled_time: Date, note: String }, { _id: false });

const CommentSchema = new Schema({ author: String, text: String, created_at: { type: Date, default: Date.now } }, { _id: false });
const HistorySchema = new Schema({ type: String, payload: Schema.Types.Mixed, created_at: { type: Date, default: Date.now } }, { _id: false });

const ReportSchema = new Schema({
  report_id: { type: String, index: true, unique: true },
  user_id: String,
  photos: [PhotoSchema],
  videos: [String],
  gps: GPSSchema,
  timestamp: Date,
  comment: String,
  category: { type: String, default: null },
  estimated_volume: { type: String, default: null },
  landmark: { type: String, default: null },
  display_id: { type: String, default: null },
  status: { type: String, default: 'pending', index: true },
  ml_results: MLResultSchema,
  assignment: AssignmentSchema,
  comments: [CommentSchema],
  history: [HistorySchema],
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now },
});

const TeamSchema = new Schema({ 
  team_id: { type: String, index: true, unique: true },
  name: String, 
  capabilities: [String], 
  vehicle_types: [String], 
  available: Boolean,
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lead_id: { type: Schema.Types.ObjectId, ref: 'User' },
  coverage_area: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], default: [] }
  },
  created_at: { type: Date, default: Date.now },
});

const VehicleSchema = new Schema({ 
  vehicle_id: { type: String, index: true, unique: true },
  type: String, 
  capacity_m3: Number, 
  available: Boolean,
  team_id: { type: String, ref: 'Team' },
  current_location: GPSSchema,
  last_maintenance: Date,
  created_at: { type: Date, default: Date.now },
});

const UserSchema = new Schema({
  user_id: { type: String, index: true, unique: true },
  email: { type: String, index: true, unique: true, required: true },
  password_hash: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['citizen', 'team_member', 'team_lead', 'admin', 'super_admin'], default: 'citizen' },
  team_id: { type: String, ref: 'Team' },
  phone: String,
  avatar_url: String,
  preferences: {
    notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true }, sms: { type: Boolean, default: false } },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
  },
  is_active: { type: Boolean, default: true },
  last_login: Date,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Indexes
ReportSchema.index({ 'gps': '2dsphere' });
ReportSchema.index({ status: 1, created_at: -1 });
ReportSchema.index({ 'ml_results.priority': 1 });
UserSchema.index({ email: 1 });
TeamSchema.index({ 'coverage_area': '2dsphere' });
VehicleSchema.index({ 'current_location': '2dsphere' });

const Counter = mongoose.model('Counter', CounterSchema);
const Report = mongoose.model('Report', ReportSchema);
const Team = mongoose.model('Team', TeamSchema);
const Vehicle = mongoose.model('Vehicle', VehicleSchema);
const User = mongoose.model('User', UserSchema);

module.exports = { Counter, Report, Team, Vehicle, User };
