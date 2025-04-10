const express = require('express');
const router = express.Router();
const Customer = require('../model/Customer');

router.get('/success', async (req, res) => {
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

module.exports = router;