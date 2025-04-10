const nodemailer = require('nodemailer');
const axios = require('axios');
const Customer = require('../model/Customer');
const NudgeLog = require('../model/NudgeLog');
const { getEmailTemplate } = require('../utils/emailTemplates');
const { getWhatsAppTemplate } = require('../utils/whatsappTemplates');

const sendEmailNudge = async (customer, touchpoint, subject, customMessage = null, emailOverride) => {
  try {
    const htmlMessage = getEmailTemplate(touchpoint, customer, customMessage);

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 465,
      secure: process.env.EMAIL_SECURE !== 'false',
      auth: {
        user: process.env.EMAIL_USER || 'email@referrush.com',
        pass: process.env.EMAIL_PASSWORD || 'password'
      }
    });

    const recipientEmail = emailOverride || customer.pointOfContact.email[0];

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'success@referrush.com',
      to: recipientEmail,
      subject: subject,
      html: htmlMessage
    };

    const info = await transporter.sendMail(mailOptions);

    await new NudgeLog({
      customerId: customer._id,
      touchpoint: touchpoint,
      channel: 'email',
      recipient: recipientEmail,
      success: true
    }).save();

    const updateObj = {};
    updateObj[`lastNudged.${touchpoint}`] = new Date();

    if (touchpoint === 'emailFollowUps') {
      updateObj['touchpoints.email.followUps.nudgeCount'] = Math.min(
        (customer.touchpoints?.email?.followUps?.nudgeCount || 0) + 1, 
        5
      );
      updateObj['touchpoints.email.followUps.lastNudgeDate'] = new Date();
    }

    await Customer.findByIdAndUpdate(customer._id, updateObj);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);

    await new NudgeLog({
      customerId: customer._id,
      touchpoint: touchpoint,
      channel: 'email',
      recipient: emailOverride || customer.pointOfContact.emails[0],
      success: false,
      errorMessage: error.message
    }).save();

    return { success: false, error: error.message };
  }
};

const sendWhatsAppNudge = async (customer, touchpoint, customMessage = null, phoneOverride) => {
  try {
    const message = getWhatsAppTemplate(touchpoint, customer, customMessage);

    const whatsappApiUrl = process.env.WHATSAPP_API_URL || 'https://api.whatsapp-provider.com/send';
    const whatsappApiKey = process.env.WHATSAPP_API_KEY || 'your-whatsapp-api-key';

    const recipientPhone = phoneOverride || customer.pointOfContact.phone[0];

    const response = await axios.post(whatsappApiUrl, {
      phone: recipientPhone,
      message: message,
      apiKey: whatsappApiKey
    });

    if (response.data.success) {
      await new NudgeLog({
        customerId: customer._id,
        touchpoint: touchpoint,
        channel: 'whatsapp',
        success: true
      }).save();

      const updateObj = {};
      updateObj[`lastNudged.${touchpoint}`] = new Date();

      if (touchpoint === 'whatsappFollowUps') {
        updateObj['touchpoints.whatsapp.followUps.nudgeCount'] = Math.min(
          (customer.touchpoints.whatsapp.followUps.nudgeCount || 0) + 1, 
          5
        );
        updateObj['touchpoints.whatsapp.followUps.lastNudgeDate'] = new Date();
      }

      await Customer.findByIdAndUpdate(customer._id, updateObj);

      return { success: true, messageId: response.data.messageId };
    } else {
      throw new Error(response.data.message || 'WhatsApp API error');
    }
  } catch (error) {
    console.error('WhatsApp error:', error);

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

module.exports = { sendEmailNudge, sendWhatsAppNudge };
