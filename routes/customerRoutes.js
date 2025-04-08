const express = require('express');
const router = express.Router();
const Customer = require('../')

/**
 * Add email(s) to a customer
 * POST /api/customers/:customerId/contact/email
 * Request body: { emails: ['email1@example.com', 'email2@example.com'] }
 */
router.post('/:customerId/contact/email', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of emails' });
    }
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Add emails that don't already exist
    const existingEmails = customer.pointOfContact.email || [];
    const uniqueEmails = emails.filter(email => !existingEmails.includes(email));
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: { 'pointOfContact.email': { $each: uniqueEmails } },
        lastUpdated: Date.now()
      },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Emails added successfully',
      data: updatedCustomer.pointOfContact.email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Delete email(s) from a customer
 * DELETE /api/customers/:customerId/contact/email
 * Request body: { emails: ['email1@example.com', 'email2@example.com'] }
 */
router.delete('/:customerId/contact/email', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { emails } = req.body;
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of emails' });
    }
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $pull: { 'pointOfContact.email': { $in: emails } },
        lastUpdated: Date.now()
      },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Emails removed successfully',
      data: updatedCustomer.pointOfContact.email
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Add phone number(s) to a customer
 * POST /api/customers/:customerId/contact/phone
 * Request body: { phones: ['+1234567890', '+0987654321'] }
 */
router.post('/:customerId/contact/phone', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { phones } = req.body;
    
    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of phone numbers' });
    }
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Add phone numbers that don't already exist
    const existingPhones = customer.pointOfContact.phone.flat() || [];
    const uniquePhones = phones.filter(phone => !existingPhones.includes(phone));
    
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: { 'pointOfContact.phone': { $each: uniquePhones } },
        lastUpdated: Date.now()
      },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Phone numbers added successfully',
      data: updatedCustomer.pointOfContact.phone
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Delete phone number(s) from a customer
 * DELETE /api/customers/:customerId/contact/phone
 * Request body: { phones: ['+1234567890', '+0987654321'] }
 */
router.delete('/:customerId/contact/phone', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { phones } = req.body;
    
    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of phone numbers' });
    }
    
    const customer = await Customer.findById(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Note: Since phone is an array of arrays in your schema, we need a different approach
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        $pull: { 'pointOfContact.phone': { $in: phones } },
        lastUpdated: Date.now()
      },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Phone numbers removed successfully',
      data: updatedCustomer.pointOfContact.phone
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;