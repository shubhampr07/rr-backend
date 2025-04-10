const nodemailer = require('nodemailer');
const axios = require('axios');
const Customer = require('../model/Customer');
const NudgeLog = require('../model/NudgeLog');

const triggerAutomaticNudges = async () => {
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    details: []
  };
  
  const customers = await Customer.find({});
  const now = new Date();
  
  for (const customer of customers) {
    // Check each touchpoint and send nudge if not enabled
    const touchpoints = [
      {
        name: 'referralWelcomePopup',
        enabled: customer.touchpoints.referralWelcomePopup,
        lastNudged: customer.lastNudged.referralWelcomePopup,
        message: `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Referral Welcome Pop-Up yet. Here's a link on how to do it: [SETUP_LINK]`,
        subject: "Activate Your Referral Welcome Pop-Up",
        useCadence: false
      },
      {
        name: 'extension',
        enabled: customer.touchpoints.extension,
        lastNudged: customer.lastNudged.extension,
        message: `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Extension yet. Here's a link on how to do it: [SETUP_LINK]`,
        subject: "Activate Your ReferRush Extension",
        useCadence: false
      },
      {
        name: 'referralForm',
        enabled: customer.touchpoints.referralForm,
        lastNudged: customer.lastNudged.referralForm,
        message: `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Referral Form yet. Here's a link on how to do it: [SETUP_LINK]`,
        subject: "Activate Your Referral Form",
        useCadence: false
      },
      {
        name: 'whatsappWhitelabeling',
        enabled: customer.touchpoints.whatsapp.whitelabeled,
        lastNudged: customer.lastNudged.whatsappWhitelabeling,
        message: `Hey ${customer.pointOfContact.name}, we noticed you haven't set up WhatsApp White Labeling yet. Here's a link on how to do it: [SETUP_LINK]`,
        subject: "Set Up WhatsApp White Labeling",
        useCadence: false
      },
      {
        name: 'whatsappFollowUps',
        enabled: customer.touchpoints.whatsapp.followUps.enabled,
        lastNudged: customer.lastNudged.whatsappFollowUps,
        message: `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your WhatsApp Follow-Ups yet. Here's a link on how to do it: [SETUP_LINK]`,
        subject: "Activate Your WhatsApp Follow-Ups",
        useCadence: true,
        cadence: customer.touchpoints.whatsapp.followUps.followUpDays,
        nudgeCount: customer.touchpoints.whatsapp.followUps.nudgeCount,
        lastNudgeDate: customer.touchpoints.whatsapp.followUps.lastNudgeDate
      },
      {
        name: 'emailWhitelabeling',
        enabled: customer.touchpoints.email.whitelabeled,
        lastNudged: customer.lastNudged.emailWhitelabeling,
        message: `Hey ${customer.pointOfContact.name}, we noticed you haven't set up Email White Labeling yet. Here's a link on how to do it: [SETUP_LINK]`,
        subject: "Set Up Email White Labeling",
        useCadence: false
      },
      {
        name: 'emailFollowUps',
        enabled: customer.touchpoints.email.followUps.enabled,
        lastNudged: customer.lastNudged.emailFollowUps,
        message: `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Email Follow-Ups yet. Here's a link on how to do it: [SETUP_LINK]`,
        subject: "Activate Your Email Follow-Ups",
        useCadence: true,
        cadence: customer.touchpoints.email.followUps.followUpDays ,
        nudgeCount: customer.touchpoints.email.followUps.nudgeCount,
        lastNudgeDate: customer.touchpoints.email.followUps.lastNudgeDate
      },
      {
        name: 'abandonedCart', // For abandoned cart email
        enabled: customer.touchpoints.abandonedCart.email,
        lastNudged: customer.lastNudged.abandonedCart,
        message: `Hey ${customer.pointOfContact.name}, it looks like you left some items in your cart. Complete your purchase here: [CART_LINK]`,
        subject: "Complete Your Purchase",
        useCadence: false
      },
      {
        name: 'abandonedCart', // For abandoned cart WhatsApp
        enabled: customer.touchpoints.abandonedCart.whatsapp,
        lastNudged: customer.lastNudged.abandonedCart,
        message: `Hey ${customer.pointOfContact.name}, you have items waiting in your cart! Click here to finish your purchase: [CART_LINK]`,
        useCadence: false
        // No subject needed for WhatsApp
      }
    ];
  

    for (const tp of touchpoints) {
      if (tp.enabled) continue;

      let shouldNudge = false;

      if (tp.useCadence) {
        // For follow-ups with cadence (WhatsApp Follow-Ups and Email Follow-Ups)
        
        // If we've already sent the maximum number of nudges (5), don't nudge again
        if (tp.nudgeCount >= 5) continue;
        
        // If we haven't sent any nudges yet, send the first one
        if (tp.nudgeCount === 0) {
          shouldNudge = true;
        } else {
          // Check if enough time has passed since the last nudge based on the cadence
          if (tp.lastNudgeDate) {
            const daysSinceLastNudge = (now - new Date(tp.lastNudgeDate)) / (1000 * 60 * 60 * 24);
            // Use the current nudgeCount as index to get the next waiting period
            const nextCadenceDay = tp.cadence[tp.nudgeCount];
            
            // If we've waited long enough, nudge again
            if (daysSinceLastNudge >= nextCadenceDay) {
              shouldNudge = true;
            }
          }
        }
      } else {
        // For non-cadence touchpoints, use a simple 7-day check
        if (!tp.lastNudged || ((now - new Date(tp.lastNudged)) / (1000 * 60 * 60 * 24) >= 7)) {
          shouldNudge = true;
        }
      }

      if (shouldNudge) {
        results.total++;
        try {
          let channel;
          if (tp.name === 'whatsappFollowUps') {
            channel = 'whatsapp';
          } else if (tp.name === 'emailFollowUps') {
            channel = 'email';
          } else {
            // For other touchpoints, randomly choose a channel for variety
            channel = Math.random() > 0.5 ? 'email' : 'whatsapp';
          }
          let nudgeResult;
          if (channel === 'email') {
            nudgeResult = await sendEmailNudge(customer, tp.name, tp.subject, tp.message);
          } else {
            nudgeResult = await sendWhatsAppNudge(customer, tp.name, tp.message);
          }
          if (nudgeResult.success) {
            results.successful++;
            results.details.push({
              customerId: customer._id,
              customerName: customer.name,
              touchpoint: tp.name,
              channel: channel,
              success: true,
              nudgeCount: tp.name.includes('FollowUps') ? tp.nudgeCount + 1 : undefined
            });
          } else {
            results.failed++;
            results.details.push({
              customerId: customer._id,
              customerName: customer.name,
              touchpoint: tp.name,
              channel: channel,
              success: false,
              error: nudgeResult.error
            });
          }
        } catch (error) {
          results.failed++;
          results.details.push({
            customerId: customer._id,
            customerName: customer.name,
            touchpoint: tp.name,
            success: false,
            error: error.message
          });
        }
      }
    }
  }
  
  return results;
};