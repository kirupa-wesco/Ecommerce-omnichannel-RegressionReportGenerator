require('dotenv').config();
// getCriticalPathRerun.js
// Usage: MONGODB_URI=your_mongo_uri node getCriticalPathRerun.js

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI environment variable not set!');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(uri);
  const dbName = process.env.MONGODB_DB || 'regression_reports';
  const collectionName = process.env.MONGODB_COLLECTION || 'logincollection';
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const doc = await collection.findOne({ name: 'criticalpathrerun' });
    if (!doc) {
      console.log('No document found with name "criticalpathrerun".');
    } else {
      console.log('CriticalPath Rerun JSON:');
      console.log(JSON.stringify(doc.data, null, 2));
    }
  } catch (err) {
    console.error('MongoDB operation failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
