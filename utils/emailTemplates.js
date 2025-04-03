// utils/emailTemplates.js
const getEmailTemplate = (templateName, customer, customMessage = null) => {
    const templates = {
      referralWelcomePopup: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Activate Your Referral Welcome Pop-Up</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed you haven't turned on your <strong>Referral Welcome Pop-Up</strong> yet.</p>
          <p>The Referral Welcome Pop-Up is a crucial touchpoint that can increase your referral conversions by up to 35%!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/popup?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Set Up Your Pop-Up Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      extension: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Activate Your ReferRush Extension</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed you haven't activated the <strong>ReferRush Extension</strong> yet.</p>
          <p>The extension helps capture referrals directly from social platforms, increasing your conversion rate by an average of 42%!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/extension?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Activate Extension Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      referralForm: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Activate Your Referral Form</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed you haven't turned on your <strong>Referral Form</strong> yet.</p>
          <p>The Referral Form provides a dedicated page for referrals, increasing conversions by making it easy for customers to share your brand!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/form?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Set Up Your Form Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      whatsappWhitelabeling: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Set Up WhatsApp White Labeling</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed you haven't set up <strong>WhatsApp White Labeling</strong> yet.</p>
          <p>White labeling your WhatsApp messages increases trust and brand recognition, leading to 28% higher conversion rates on average!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/whatsapp/whitelabel?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Set Up White Labeling Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      whatsappFollowUps: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Activate WhatsApp Follow-Ups</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed you haven't turned on <strong>WhatsApp Follow-Ups</strong> yet.</p>
          <p>Our data shows that customers with WhatsApp follow-ups enabled see a 47% increase in referral completions!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/whatsapp/followups?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Enable Follow-Ups Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      emailWhitelabeling: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Set Up Email White Labeling</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed you haven't set up <strong>Email White Labeling</strong> yet.</p>
          <p>White labeled emails improve deliverability and brand consistency, leading to 31% higher open rates!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/email/whitelabel?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Set Up White Labeling Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      emailFollowUps: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Activate Email Follow-Ups</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed you haven't turned on <strong>Email Follow-Ups</strong> yet.</p>
          <p>Email follow-ups are essential for maximizing referral conversions, with our recommended 5-touch sequence increasing completions by 53%!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/email/followups?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Enable Follow-Ups Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      offerQuality: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Improve Your Referral Offer</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We've been analyzing your referral program, and we have a recommendation that could significantly boost your results.</p>
          <p>Currently, your offer is <strong>${customer.offer.discount} off with ${customer.offer.cashback} in cashback</strong>. Our data shows that increasing to at least <strong>15% off with $300 in cashback</strong> can improve your referral conversion rate by up to 65%!</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/offer?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Improve Your Offer Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      allCustomersCanUseCode: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Allow All Customers to Use Referral Codes</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>We noticed your referral program is currently limited to <strong>new customers only</strong>.</p>
          <p>Brands that allow <strong>all customers</strong> to use referral codes see a 73% increase in referral volume! This simple change can dramatically improve your results.</p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="https://app.referrush.com/setup/offer/settings?id=${customer._id}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Update Referral Settings Now
            </a>
          </div>
          <p>Need help? Just reply to this email or schedule a quick call with our customer success team.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `,
      
      custom: customMessage || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://www.referrush.com/landingPage/images/logo.png" alt="ReferRush Logo" style="max-width: 150px;">
          </div>
          <h2 style="color: #333;">Message from ReferRush</h2>
          <p>Hey ${customer.pointOfContact.name},</p>
          <p>Thank you for using ReferRush for your referral program. We're here to help you maximize your results!</p>
          <p>Please reach out if you have any questions or need assistance with your setup.</p>
          <p>Best,<br>The ReferRush Team</p>
        </div>
      `
    };
    
    return templates[templateName] || templates.custom;
  };
  
  module.exports = { getEmailTemplate };