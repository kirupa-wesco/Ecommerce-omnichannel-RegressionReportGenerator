require('dotenv').config();
// uploadFailuresToMongo.js
// Usage: MONGODB_URI=your_mongo_uri node uploadFailuresToMongo.js [path-to-json]

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');


// Use .env values for MongoDB connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable not set!');
  process.exit(1);
}

const jsonPath = process.argv[2] || path.join(__dirname, 'Parallel-exec-config.failures.json');

async function main() {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    console.error('Failed to read or parse JSON:', err);
    process.exit(1);
  }

  const client = new MongoClient(uri);
  const dbName = process.env.MONGODB_DB || 'regression_reports';
  const collectionName = process.env.MONGODB_COLLECTION || 'logincollection';
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    await collection.updateOne(
      { _id: 'latest' },
      { $set: { data, updatedAt: new Date(), name: 'criticalpathrerun' } },
      { upsert: true }
    );
    console.log(`Failures JSON uploaded to MongoDB database '${dbName}', collection '${collectionName}' with name 'criticalpathrerun' successfully!`);
  } catch (err) {
    console.error('MongoDB operation failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
