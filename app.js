
const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const cors = require('cors');
const Customer = require('./model/Customer');
const NudgeLog = require('./model/NudgeLog');
const CustomerRoutes = require("./routes/customerRoutes");
const nudgeRoutes = require("./routes/nudgeRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/customers", CustomerRoutes);
app.use("/api/nudge", nudgeRoutes);
app.use("/api/metrics", metricsRoutes);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/referrush', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));



// cron.schedule('0 9 * * *', async () => {
//   console.log('Running automated nudges...');
//   try {
//     const results = await triggerAutomaticNudges();
//     console.log(`Automated nudges complete. Success: ${results.successful}, Failed: ${results.failed}`);
//   } catch (error) {
//     console.error('Error in automated nudges:', error);
//   }
// });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
