// utils/whatsappTemplates.js
const getWhatsAppTemplate = (templateName, customer, customMessage = null) => {
    const templates = {
      referralWelcomePopup: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed you haven't turned on your *Referral Welcome Pop-Up* yet.\n\n` +
        `This feature can increase your referral conversions by up to 35%! 📈\n\n` +
        `Set it up here: https://app.referrush.com/setup/popup?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      extension: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed you haven't activated the *ReferRush Extension* yet.\n\n` +
        `The extension helps capture referrals directly from social platforms, increasing conversion by an average of 42%! 🚀\n\n` +
        `Activate it here: https://app.referrush.com/setup/extension?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      referralForm: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed you haven't turned on your *Referral Form* yet.\n\n` +
        `Having a dedicated referral page makes it easy for customers to share your brand! 💪\n\n` +
        `Set it up here: https://app.referrush.com/setup/form?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      whatsappWhitelabeling: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed you haven't set up *WhatsApp White Labeling* yet.\n\n` +
        `White labeling increases trust and brand recognition, leading to 28% higher conversion rates! 📱\n\n` +
        `Set it up here: https://app.referrush.com/setup/whatsapp/whitelabel?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      whatsappFollowUps: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed you haven't turned on *WhatsApp Follow-Ups* yet.\n\n` +
        `Our data shows that customers with WhatsApp follow-ups see a 47% increase in referral completions! 🔄\n\n` +
        `Enable them here: https://app.referrush.com/setup/whatsapp/followups?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      emailWhitelabeling: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed you haven't set up *Email White Labeling* yet.\n\n` +
        `White labeled emails improve deliverability and brand consistency, leading to 31% higher open rates! ✉️\n\n` +
        `Set it up here: https://app.referrush.com/setup/email/whitelabel?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      emailFollowUps: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed you haven't turned on *Email Follow-Ups* yet.\n\n` +
        `Email follow-ups are essential for maximizing referral conversions, with our recommended 5-touch sequence increasing completions by 53%! 📧\n\n` +
        `Enable them here: https://app.referrush.com/setup/email/followups?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      offerQuality: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We've been analyzing your referral program, and have a recommendation that could boost your results.\n\n` +
        `Currently, your offer is *${customer.offer.discount} off with ${customer.offer.cashback} in cashback*. Our data shows that increasing to at least *15% off with $300 in cashback* can improve your referral conversion rate by up to 65%! 💰\n\n` +
        `Improve your offer here: https://app.referrush.com/setup/offer?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      allCustomersCanUseCode: 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `We noticed your referral program is currently limited to *new customers only*.\n\n` +
        `Brands that allow *all customers* to use referral codes see a 73% increase in referral volume! This simple change can dramatically improve your results. 🎯\n\n` +
        `Update your settings here: https://app.referrush.com/setup/offer/settings?id=${customer._id}\n\n` +
        `Need help? Reply to this message and our team will assist you.`,
      
      custom: customMessage || 
        `Hey ${customer.pointOfContact.name}! 👋\n\n` +
        `Thank you for using ReferRush for your referral program. We're here to help you maximize your results!\n\n` +
        `Please reach out if you have any questions or need assistance with your setup.`
    };
    
    return templates[templateName] || templates.custom;
  };
  
  module.exports = { getWhatsAppTemplate };