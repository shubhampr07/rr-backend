const express = require('express');
const Customer = require('../model/Customer.js');

const router = express.Router(); 

// Get All Customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({});
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific customer by ID
router.get('/:id', async (req, res) => {
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
router.post('/', async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    await newCustomer.save();
    res.status(201).json({ success: true, data: newCustomer });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update a customer by ID
router.put('/:id', async (req, res) => {
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

// Delete a customer by ID
router.delete('/:id', async (req, res) => {
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

router.post('/:customerId/contact/email', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!customer.pointOfContact) customer.pointOfContact = {};
    if (!customer.pointOfContact.email) customer.pointOfContact.email = [];

    if (!customer.pointOfContact.email.includes(email)) {
      customer.pointOfContact.email.push(email);
      customer.lastUpdated = Date.now();
      await customer.save();

      return res.status(200).json({ success: true, message: 'Email added successfully', emails: customer.pointOfContact.email });
    } else {
      return res.status(200).json({ success: true, message: 'Email already exists', emails: customer.pointOfContact.email });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add phone contact
router.post('/:customerId/contact/phone', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!customer.pointOfContact) customer.pointOfContact = {};
    if (!customer.pointOfContact.phone) customer.pointOfContact.phone = [];

    if (!customer.pointOfContact.phone.includes(phone)) {
      customer.pointOfContact.phone.push(phone);
      customer.lastUpdated = Date.now();
      await customer.save();

      return res.status(200).json({ success: true, message: 'Phone added successfully', phones: customer.pointOfContact.phone });
    } else {
      return res.status(200).json({ success: true, message: 'Phone already exists', phones: customer.pointOfContact.phone });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete email contacts
router.delete('/:customerId/contact/email', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { emails } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of emails' });
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { $pull: { 'pointOfContact.email': { $in: emails } }, lastUpdated: Date.now() },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: 'Emails removed successfully', emails: customer.pointOfContact.email });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete phone contacts
router.delete('/:customerId/contact/phone', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { phones } = req.body;

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of phone numbers' });
    }

    const customer = await Customer.findByIdAndUpdate(
      customerId,
      { $pull: { 'pointOfContact.phone': { $in: phones } }, lastUpdated: Date.now() },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: 'Phone numbers removed successfully', phones: customer.pointOfContact.phone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add notes
router.post('/notes', async (req, res) => {
  try {
    const { customerId, note } = req.body;

    if (!customerId || !note) {
      return res.status(400).json({ success: false, message: 'Customer ID and note are required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.note = note;
    await customer.save();

    res.status(200).json({ success: true, message: 'Note added successfully', data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;