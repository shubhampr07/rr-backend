// app.js - Main Express Application
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
const {getEmailTemplate} = require("./utils/emailTemplates");
const {getWhatsAppTemplate} = require("./utils/whatsappTemplates");
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/referrush', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Customer schema
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  offer: {
    discount: { type: String, required: true },
    cashback: { type: Number, required: true },
    allCustomersCanUseCode: { type: Boolean, default: false }
  },
  pointOfContact: {
    name: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true }
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

// Nudge Log schema to track all communications
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

// Utility function to send email nudges
const sendEmailNudge = async (customer, touchpoint, subject, customMessage = null) => {
  try {


    const htmlMessage = getEmailTemplate(touchpoint, customer, customMessage);

    // Configure transporter with environment variables in production
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@referrush.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'success@referrush.com',
      to: customer.pointOfContact.email,
      subject: subject,
      html: htmlMessage
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Log successful nudge
    await new NudgeLog({
      customerId: customer._id,
      touchpoint: touchpoint,
      channel: 'email',
      success: true
    }).save();
    
    // Update last nudged timestamp
    const updateObj = {};
    updateObj[`lastNudged.${touchpoint}`] = new Date();

    if (touchpoint === 'emailFollowUps') {
      // Increment the counter and update the last nudge date
      updateObj['touchpoints.email.followUps.nudgeCount'] = Math.min(customer.touchpoints.email.followUps.nudgeCount + 1, 5);
      updateObj['touchpoints.email.followUps.lastNudgeDate'] = new Date();
    }

    await Customer.findByIdAndUpdate(customer._id, updateObj);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    
    // Log failed nudge
    await new NudgeLog({
      customerId: customer._id,
      touchpoint: touchpoint,
      channel: 'email',
      success: false,
      errorMessage: error.message
    }).save();
    
    return { success: false, error: error.message };
  }
};

// Utility function to send WhatsApp nudges
const sendWhatsAppNudge = async (customer, touchpoint, customMessage = null) => {
  try {
    const message = getWhatsAppTemplate(touchpoint, customer, customMessage);
    // This would be integrated with a WhatsApp API service (e.g. Twilio, MessageBird)
    // For now, we'll simulate with an axios call
    
    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp-provider.com/send';
    const whatsappApiKey = process.env.WHATSAPP_API_KEY || 'your-whatsapp-api-key';
    
    const response = await axios.post(whatsappApiUrl, {
      phone: customer.pointOfContact.phone,
      message: message,
      apiKey: whatsappApiKey
    });
    
    if (response.data.success) {
      // Log successful nudge
      await new NudgeLog({
        customerId: customer._id,
        touchpoint: touchpoint,
        channel: 'whatsapp',
        success: true
      }).save();
      
      // Update last nudged timestamp
      const updateObj = {};
      updateObj[`lastNudged.${touchpoint}`] = new Date();
      if (touchpoint === 'whatsappFollowUps') {
        // Increment the counter and update the last nudge date
        updateObj['touchpoints.whatsapp.followUps.nudgeCount'] = Math.min(customer.touchpoints.whatsapp.followUps.nudgeCount + 1, 5);
        updateObj['touchpoints.whatsapp.followUps.lastNudgeDate'] = new Date();
      }

      await Customer.findByIdAndUpdate(customer._id, updateObj);
      
      return { success: true, messageId: response.data.messageId };
    } else {
      throw new Error(response.data.message || 'WhatsApp API error');
    }
  } catch (error) {
    console.error('WhatsApp error:', error);
    
    // Log failed nudge
    await new NudgeLog({
      customerId: customer._id,
      touchpoint: touchpoint,
      channel: 'whatsapp',
      success: false,
      errorMessage: error.message
    }).save();
    
    return { success: false, error: error.message };
  }
};

// ROUTES

// Get all customers with their touchpoint status
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific customer
app.get('/api/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add a new customer
app.post('/api/customers', async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update a customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCustomer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: updatedCustomer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete a customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NUDGE ENDPOINTS

// Manually trigger a specific nudge to a customer
app.post('/api/nudge/:customerId/:touchpoint/:channel', async (req, res) => {
  try {
    const { customerId, touchpoint, channel } = req.params;
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    
    // Convert touchpoint parameter to the correct schema path
    let touchpointPath;
    let nudgeMessage;
    let emailSubject;
    
    switch (touchpoint) {
      case 'referralWelcomePopup':
        touchpointPath = 'referralWelcomePopup';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Referral Welcome Pop-Up yet. Here's a link on how to do it: [SETUP_LINK]`;
        emailSubject = "Activate Your Referral Welcome Pop-Up";
        break;
      case 'extension':
        touchpointPath = 'extension';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Extension yet. Here's a link on how to do it: [SETUP_LINK]`;
        emailSubject = "Activate Your ReferRush Extension";
        break;
      case 'referralForm':
        touchpointPath = 'referralForm';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Referral Form yet. Here's a link on how to do it: [SETUP_LINK]`;
        emailSubject = "Activate Your Referral Form";
        break;
      case 'whatsappWhitelabeling':
        touchpointPath = 'whatsappWhitelabeling';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't set up WhatsApp White Labeling yet. Here's a link on how to do it: [SETUP_LINK]`;
        emailSubject = "Set Up WhatsApp White Labeling";
        break;
      case 'whatsappFollowUps':
        touchpointPath = 'whatsappFollowUps';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your WhatsApp Follow-Ups yet. Here's a link on how to do it: [SETUP_LINK]`;
        emailSubject = "Activate Your WhatsApp Follow-Ups";
        break;
      case 'emailWhitelabeling':
        touchpointPath = 'emailWhitelabeling';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't set up Email White Labeling yet. Here's a link on how to do it: [SETUP_LINK]`;
        emailSubject = "Set Up Email White Labeling";
        break;
      case 'emailFollowUps':
        touchpointPath = 'emailFollowUps';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, we noticed you haven't turned on your Email Follow-Ups yet. Here's a link on how to do it: [SETUP_LINK]`;
        emailSubject = "Activate Your Email Follow-Ups";
        break;
      case 'abandonedCart': 
        touchpointPath = 'abandonedCart';
        nudgeMessage = `Hey ${customer.pointOfContact.name}, it looks like you have items waiting in your cart. Don't miss out—complete your purchase here: [CART_LINK]`;
        emailSubject = "Complete Your Purchase";
        break;
      default:
        return res.status(400).json({ success: false, error: 'Invalid touchpoint specified' });
    }
    
    // Customize message if provided in request body
    if (req.body && req.body.message) {
      nudgeMessage = req.body.message;
    }
    
    // Customize email subject if provided in request body
    if (req.body && req.body.subject) {
      emailSubject = req.body.subject;
    }
    
    let result;
    
    if (channel === 'email') {
      result = await sendEmailNudge(customer, touchpointPath, emailSubject, nudgeMessage);
    } else if (channel === 'whatsapp') {
      result = await sendWhatsAppNudge(customer, touchpointPath, nudgeMessage);
    } else {
      return res.status(400).json({ success: false, error: 'Invalid channel specified (use email or whatsapp)' });
    }
    
    if (result.success) {
      res.json({ success: true, message: `${channel} nudge sent successfully` });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all nudge logs for a customer
app.get('/api/nudge/logs/:customerId', async (req, res) => {
  try {
    const logs = await NudgeLog.find({ customerId: req.params.customerId }).sort({ sentAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ZAPIER WEBHOOK ENDPOINTS

// Endpoint for Zapier to fetch customers with missing touchpoints
app.get('/api/zapier/customers-with-missing-touchpoints', async (req, res) => {
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
      
      // Check each touchpoint
      if (!customer.touchpoints.referralWelcomePopup) {
        customerIssues.issues.push('referralWelcomePopup');
      }
      
      if (!customer.touchpoints.extension) {
        customerIssues.issues.push('extension');
      }
      
      if (!customer.touchpoints.referralForm) {
        customerIssues.issues.push('referralForm');
      }
      
      if (!customer.touchpoints.whatsapp.whitelabeled) {
        customerIssues.issues.push('whatsappWhitelabeling');
      }
      
      if (!customer.touchpoints.whatsapp.followUps.enabled) {
        customerIssues.issues.push('whatsappFollowUps');
      }
      
      if (!customer.touchpoints.email.whitelabeled) {
        customerIssues.issues.push('emailWhitelabeling');
      }
      
      if (!customer.touchpoints.email.followUps.enabled) {
        customerIssues.issues.push('emailFollowUps');
      }
      
      if (!customer.offer.allCustomersCanUseCode) {
        customerIssues.issues.push('offerAvailabilityLimited');
      }
      
      // Check offer quality
      if (parseFloat(customer.offer.discount.replace('%', '')) < 10 || 
          customer.offer.cashback < 200) {
        customerIssues.issues.push('offerQualityLow');
      }
      
      // Only add customers with issues
      if (customerIssues.issues.length > 0) {
        missingTouchpoints.push(customerIssues);
      }
    }
    
    res.json({ success: true, data: missingTouchpoints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for Zapier to trigger automatic nudges
app.post('/api/zapier/trigger-auto-nudges', async (req, res) => {
  try {
    const results = await triggerAutomaticNudges();
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Function to handle automatic nudges
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
    
    // for (const touchpoint of touchpoints) {
    //   // Only nudge if feature is not enabled
    //   if (!touchpoint.enabled) {
    //     // Check if we haven't nudged in the last 7 days or never nudged
    //     const shouldNudge = !touchpoint.lastNudged || 
    //                        ((new Date() - new Date(touchpoint.lastNudged)) / (1000 * 60 * 60 * 24) >= 7);
        
    //     if (shouldNudge) {
    //       results.total++;
          
    //       try {
    //         // let channel;
    //         // if (touchpoint.subject) {
    //         //   channel = Math.random() > 0.5 ? 'email' : 'whatsapp';
    //         // } else {
    //         //   channel = 'whatsapp';
    //         // }
    //         // Randomly choose between email and WhatsApp for variety
    //         const channel = Math.random() > 0.5 ? 'email' : 'whatsapp';
            
    //         let nudgeResult;
    //         if (channel === 'email') {
    //           nudgeResult = await sendEmailNudge(customer, touchpoint.name, touchpoint.subject, touchpoint.message);
    //         } else {
    //           nudgeResult = await sendWhatsAppNudge(customer, touchpoint.name, touchpoint.message);
    //         }
            
    //         if (nudgeResult.success) {
    //           results.successful++;
    //           results.details.push({
    //             customerId: customer._id,
    //             customerName: customer.name,
    //             touchpoint: touchpoint.name,
    //             channel: channel,
    //             success: true
    //           });
    //         } else {
    //           results.failed++;
    //           results.details.push({
    //             customerId: customer._id,
    //             customerName: customer.name,
    //             touchpoint: touchpoint.name,
    //             channel: channel,
    //             success: false,
    //             error: nudgeResult.error
    //           });
    //         }
    //       } catch (error) {
    //         results.failed++;
    //         results.details.push({
    //           customerId: customer._id,
    //           customerName: customer.name,
    //           touchpoint: touchpoint.name,
    //           success: false,
    //           error: error.message
    //         });
    //       }
    //     }
    //   }
    // }

    for (const tp of touchpoints) {
      // Skip if feature is enabled
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

// Schedule automated nudges to run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('Running automated nudges...');
  try {
    const results = await triggerAutomaticNudges();
    console.log(`Automated nudges complete. Success: ${results.successful}, Failed: ${results.failed}`);
  } catch (error) {
    console.error('Error in automated nudges:', error);
  }
});

// API endpoint for success metrics
app.get('/api/metrics/success', async (req, res) => {
  try {
    const customers = await Customer.find({});
    const metrics = {
      totalCustomers: customers.length,
      customerSuccessRate: {
        referralWelcomePopup: 0,
        extension: 0,
        referralForm: 0,
        whatsappWhitelabeled: 0,
        whatsappFollowUps: 0,
        emailWhitelabeled: 0,
        emailFollowUps: 0,
        qualityOffer: 0,
        allCustomersCanUseCode: 0,
        overall: 0
      },
      successBreakdown: []
    };
    
    let totalSuccessPoints = 0;
    const maxSuccessPoints = customers.length * 9; // 9 success criteria
    
    for (const customer of customers) {
      let customerSuccessPoints = 0;
      const customerSuccess = {
        customerId: customer._id,
        customerName: customer.name,
        successPoints: 0,
        maxPoints: 9,
        criteria: {}
      };
      
      // Check each touchpoint
      if (customer.touchpoints.referralWelcomePopup) {
        metrics.customerSuccessRate.referralWelcomePopup++;
        customerSuccessPoints++;
        customerSuccess.criteria.referralWelcomePopup = true;
      } else {
        customerSuccess.criteria.referralWelcomePopup = false;
      }
      
      if (customer.touchpoints.extension) {
        metrics.customerSuccessRate.extension++;
        customerSuccessPoints++;
        customerSuccess.criteria.extension = true;
      } else {
        customerSuccess.criteria.extension = false;
      }
      
      if (customer.touchpoints.referralForm) {
        metrics.customerSuccessRate.referralForm++;
        customerSuccessPoints++;
        customerSuccess.criteria.referralForm = true;
      } else {
        customerSuccess.criteria.referralForm = false;
      }
      
      if (customer.touchpoints.whatsapp.whitelabeled) {
        metrics.customerSuccessRate.whatsappWhitelabeled++;
        customerSuccessPoints++;
        customerSuccess.criteria.whatsappWhitelabeled = true;
      } else {
        customerSuccess.criteria.whatsappWhitelabeled = false;
      }
      
      if (customer.touchpoints.whatsapp.followUps.enabled) {
        metrics.customerSuccessRate.whatsappFollowUps++;
        customerSuccessPoints++;
        customerSuccess.criteria.whatsappFollowUps = true;
      } else {
        customerSuccess.criteria.whatsappFollowUps = false;
      }
      
      if (customer.touchpoints.email.whitelabeled) {
        metrics.customerSuccessRate.emailWhitelabeled++;
        customerSuccessPoints++;
        customerSuccess.criteria.emailWhitelabeled = true;
      } else {
        customerSuccess.criteria.emailWhitelabeled = false;
      }
      
      if (customer.touchpoints.email.followUps.enabled) {
        metrics.customerSuccessRate.emailFollowUps++;
        customerSuccessPoints++;
        customerSuccess.criteria.emailFollowUps = true;
      } else {
        customerSuccess.criteria.emailFollowUps = false;
      }
      
      if (customer.offer.allCustomersCanUseCode) {
        metrics.customerSuccessRate.allCustomersCanUseCode++;
        customerSuccessPoints++;
        customerSuccess.criteria.allCustomersCanUseCode = true;
      } else {
        customerSuccess.criteria.allCustomersCanUseCode = false;
      }
      
      // Check if offer is high quality (15%+ discount and 300+ cashback)
      const discountValue = parseFloat(customer.offer.discount.replace('%', ''));
      const hasQualityOffer = discountValue >= 15 && customer.offer.cashback >= 300;
      
      if (hasQualityOffer) {
        metrics.customerSuccessRate.qualityOffer++;
        customerSuccessPoints++;
        customerSuccess.criteria.qualityOffer = true;
      } else {
        customerSuccess.criteria.qualityOffer = false;
      }
      
      totalSuccessPoints += customerSuccessPoints;
      customerSuccess.successPoints = customerSuccessPoints;
      customerSuccess.successRate = Math.round((customerSuccessPoints / 9) * 100);
      
      metrics.successBreakdown.push(customerSuccess);
    }
    
    // Calculate percentages
    if (customers.length > 0) {
      metrics.customerSuccessRate.referralWelcomePopup = Math.round((metrics.customerSuccessRate.referralWelcomePopup / customers.length) * 100);
      metrics.customerSuccessRate.extension = Math.round((metrics.customerSuccessRate.extension / customers.length) * 100);
      metrics.customerSuccessRate.referralForm = Math.round((metrics.customerSuccessRate.referralForm / customers.length) * 100);
      metrics.customerSuccessRate.whatsappWhitelabeled = Math.round((metrics.customerSuccessRate.whatsappWhitelabeled / customers.length) * 100);
      metrics.customerSuccessRate.whatsappFollowUps = Math.round((metrics.customerSuccessRate.whatsappFollowUps / customers.length) * 100);
      metrics.customerSuccessRate.emailWhitelabeled = Math.round((metrics.customerSuccessRate.emailWhitelabeled / customers.length) * 100);
      metrics.customerSuccessRate.emailFollowUps = Math.round((metrics.customerSuccessRate.emailFollowUps / customers.length) * 100);
      metrics.customerSuccessRate.qualityOffer = Math.round((metrics.customerSuccessRate.qualityOffer / customers.length) * 100);
      metrics.customerSuccessRate.allCustomersCanUseCode = Math.round((metrics.customerSuccessRate.allCustomersCanUseCode / customers.length) * 100);
      metrics.customerSuccessRate.overall = Math.round((totalSuccessPoints / maxSuccessPoints) * 100);
    }
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;