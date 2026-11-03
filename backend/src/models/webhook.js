const { connect, mongoose } = require('../db');
const { Schema } = mongoose;

const WebhookSchema = new Schema({
  url: { type: String, required: true },
  events: [{ type: String, required: true }],
  secret: { type: String, required: true },
  active: { type: Boolean, default: true },
  created_by: { type: String, ref: 'User' },
  last_delivery: Date,
  last_status: Number,
  last_error: String,
  success_count: { type: Number, default: 0 },
  failure_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

WebhookSchema.index({ active: 1, events: 1 });

const Webhook = mongoose.model('Webhook', WebhookSchema);

module.exports = { Webhook };