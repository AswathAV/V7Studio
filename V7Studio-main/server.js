require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const uri = process.env.MONGODB_URI;
let db;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db('Phone_number');
  } catch (error) {
    process.exit(1); 
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

connectToDatabase().then(() => {
  app.post('/api/save-phone-number', async (req, res) => {
    try {
      const { name, phoneNumber, packageType } = req.body;

      if (!name || !phoneNumber || !packageType) {
        return res.status(400).json({ error: 'Name, phone number, and package type are required' });
      }
      const namepattn = /^[a-zA-Z\s]+$/;
      if(!namepattn.test(name)){
        return res.status(400).json({error:'Special character alert!'});
      }
      const numpattn = /^[0-9]{10}$/;
      if(!numpattn.test(phoneNumber)){
        return res.status(400).json({error:'Phone number should contain 10 digits!'});
      }
      if (!db) {
        return res.status(500).json({ error: 'Database not connected' });
      }

      const collection = db.collection('phoneNumbers');
      const result = await collection.insertOne({ name, phoneNumber, packageType });
      if (!result || !result.insertedId) {
        throw new Error('Failed to insert document');
      }

      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: 'v7studiophoto@gmail.com', 
        subject: 'New Booking',
        text: `Name: ${name}\nPhone Number: ${phoneNumber}\nPackage Type: ${packageType}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({ error: 'Error sending email' });
        }
        res.status(201).json({ _id: result.insertedId, name, phoneNumber, packageType });
      });

    } catch (error) {
      res.status(500).json({ error: 'An error occurred while saving the phone number' });
    }
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'V7_studio.html'));
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
