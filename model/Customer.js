
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  note: { type: String },
  offer: {
    discount: { type: String, required: true },
    cashback: { type: Number, required: true },
    allCustomersCanUseCode: { type: Boolean, default: false }
  },
  pointOfContact: {
    name: { type: String },
    email: [{ type: String }],
    phone: [{ type: String, required: true }]
  },
  touchpoints: {
    referralWelcomePopup: { type: Boolean, default: false },
    extension: { type: Boolean, default: false },
    referralForm: { type: Boolean, default: false },
    whatsapp: {
      whitelabeled: { type: Boolean, default: false },
      followUps: {
        enabled: { type: Boolean, default: false },
        followUpDays: { type: Array, default: [7, 21, 51, 81, 111] },
        nudgeCount: { type: Number, default: 0 },
        lastNudgeDate: { type: Date } 
      }
    },
    email: {
      whitelabeled: { type: Boolean, default: false },
      followUps: {
        enabled: { type: Boolean, default: false },
        followUpDays: { type: Array, default: [7, 21, 51, 81, 111] },
        nudgeCount: { type: Number, default: 0 }, // Add nudge count
        lastNudgeDate: { type: Date }             
      }
    },
    sms: { type: Boolean, default: false },
    abandonedCart: {
      email: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false }
    }
  },
  lastUpdated: { type: Date, default: Date.now },
  lastNudged: {
    referralWelcomePopup: { type: Date },
    extension: { type: Date },
    referralForm: { type: Date },
    whatsappWhitelabeling: { type: Date },
    whatsappFollowUps: { type: Date },
    emailWhitelabeling: { type: Date },
    emailFollowUps: { type: Date },
    sms: { type: Date },
    abandonedCart: { type: Date },
    offerQuality: { type: Date },
    allCustomersCanUseCode: { type: Date }
  }
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
