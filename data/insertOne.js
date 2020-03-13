import { getClient } from '../mongo';

export default function insertOne(collectionName, object) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection(collectionName);

      collection.insertOne(object, (err, result) => {
        if (err) return reject(err);
        return resolve({ ...object, ...{ _id: result.insertedId } });
      });
    } else {
      return reject('Client Not Connected');
    }
  });
}
