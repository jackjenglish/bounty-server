import { getClient } from '../mongo';

export default function upsertOne(collectionName, filter, object) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection(collectionName);

      collection.replaceOne(filter, object, { upsert: true }, (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      });
    } else {
      return reject('Client Not Connected');
    }
  });
}
