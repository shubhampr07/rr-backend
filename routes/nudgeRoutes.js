const express = require('express');
const router = express.Router();
const { sendEmailNudge, sendWhatsAppNudge } = require('../services/nudgeService');
// const { triggerAutomaticNudges } = require('../services/automationService');
const Customer = require('../model/Customer');
const NudgeLog = require('../model/NudgeLog');

router.post('/:customerId/:touchpoint/:channel', async (req, res) => {
  try {
    const { customerId, touchpoint, channel } = req.params;
    const { recipients, message, subject } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide at least one recipient' });
    }

    const touchpoints = {
      referralWelcomePopup: ["Referral Welcome Pop-Up", "Activate Your Referral Welcome Pop-Up"],
      extension: ["Extension", "Activate Your ReferRush Extension"],
      referralForm: ["Referral Form", "Activate Your Referral Form"],
      whatsappWhitelabeling: ["WhatsApp White Labeling", "Set Up WhatsApp White Labeling"],
      whatsappFollowUps: ["WhatsApp Follow-Ups", "Activate Your WhatsApp Follow-Ups"],
      emailWhitelabeling: ["Email White Labeling", "Set Up Email White Labeling"],
      emailFollowUps: ["Email Follow-Ups", "Activate Your Email Follow-Ups"],
      abandonedCart: ["Abandoned Cart", "Complete Your Purchase"]
    };

    if (!touchpoints[touchpoint]) {
      return res.status(400).json({ success: false, error: 'Invalid touchpoint specified' });
    }

    let nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your ${touchpoints[touchpoint][0]} yet. Here's a link on how to do it: [SETUP_LINK]`;
    let emailSubject = touchpoints[touchpoint][1];

    if (message) nudgeMessage = message;
    if (subject) emailSubject = subject;

    const results = { success: 0, failed: 0, errors: [] };

    for (const recipient of recipients) {
      try {
        let result;
        if (channel === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
            results.failed++;
            results.errors.push(`Invalid email format: ${recipient}`);
            continue;
          }
          result = await sendEmailNudge(customer, touchpoint, emailSubject, nudgeMessage, recipient);
        } else if (channel === 'whatsapp') {
          if (!/^\+?[0-9]{10,15}$/.test(recipient)) {
            results.failed++;
            results.errors.push(`Invalid phone format: ${recipient}`);
            continue;
          }
          result = await sendWhatsAppNudge(customer, touchpoint, nudgeMessage, recipient);
        } else {
          results.failed++;
          results.errors.push(`Invalid channel specified for recipient: ${recipient}`);
          continue;
        }

        result.success ? results.success++ : results.failed++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${recipient}: ${error.message}`);
      }
    }

    res.status(results.success > 0 ? 200 : 500).json({
      success: results.success > 0,
      message: `${channel} nudge sent successfully to ${results.success} recipient(s)`,
      details: results
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all nudge logs for a customer
router.get('/logs/:customerId', async (req, res) => {
  try {
    const logs = await NudgeLog.find({ customerId: req.params.customerId }).sort({ sentAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Zapier - Fetch customers with missing touchpoints
router.get('/zapier/customers-with-missing-touchpoints', async (req, res) => {
  try {
    const missingTouchpoints = [];
    const customers = await Customer.find({});

    for (const customer of customers) {
      const customerIssues = {
        customerId: customer._id,
        customerName: customer.name,
        email: customer.pointOfContact.email,
        phone: customer.pointOfContact.phone,
        issues: []
      };

      if (!customer.touchpoints.referralWelcomePopup) customerIssues.issues.push('referralWelcomePopup');
      if (!customer.touchpoints.extension) customerIssues.issues.push('extension');
      if (!customer.touchpoints.referralForm) customerIssues.issues.push('referralForm');
      if (!customer.touchpoints.whatsapp.whitelabeled) customerIssues.issues.push('whatsappWhitelabeling');
      if (!customer.touchpoints.whatsapp.followUps.enabled) customerIssues.issues.push('whatsappFollowUps');
      if (!customer.touchpoints.email.whitelabeled) customerIssues.issues.push('emailWhitelabeling');
      if (!customer.touchpoints.email.followUps.enabled) customerIssues.issues.push('emailFollowUps');
      if (!customer.offer.allCustomersCanUseCode) customerIssues.issues.push('offerAvailabilityLimited');

      if (parseFloat(customer.offer.discount.replace('%', '')) < 10 || customer.offer.cashback < 200) {
        customerIssues.issues.push('offerQualityLow');
      }

      if (customerIssues.issues.length > 0) {
        missingTouchpoints.push(customerIssues);
      }
    }

    res.json({ success: true, data: missingTouchpoints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Zapier - Trigger automatic nudges
router.post('/zapier/trigger-auto-nudges', async (req, res) => {
  try {
    const results = await triggerAutomaticNudges();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
