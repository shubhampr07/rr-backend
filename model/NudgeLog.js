// Nudge Log schema to track all communications

const mongoose = require('mongoose');

const nudgeLogSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  touchpoint: { type: String, required: true },
  channel: { type: String, enum: ['email', 'whatsapp'], required: true },
  sentAt: { type: Date, default: Date.now },
  success: { type: Boolean, default: true },
  errorMessage: { type: String }
});

const NudgeLog = mongoose.model('NudgeLog', nudgeLogSchema);

module.exports = NudgeLog;