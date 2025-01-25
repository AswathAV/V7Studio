const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let database;

async function connectToDatabase() {
  if (!database) {
    try {
      await client.connect();
      database = client.db('Phone_number');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw new Error('Database connection failed');
    }
  }
  return database;
}

module.exports = async (req, res, db) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { name, phoneNumber, packageType } = req.body;

  if (!name || !phoneNumber || !packageType) {
    return res.status(400).json({ success: false, message: 'Name, phone number, and package type are required' });
  }

  try {
    const collection = db.collection('phoneNumbers');
    const result = await collection.insertOne({ name, phoneNumber, packageType });
    res.status(200).json({ success: true, data: result.ops[0] });
  } catch (error) {
    console.error('Error saving phone number:', error);
    res.status(500).json({ success: false, message: 'An error occurred while saving the phone number' });
  }
};
