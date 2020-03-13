import { getClient } from '../mongo';

export default function deleteOne(collectionName, filter) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection(collectionName);

      collection.deleteOne(filter, (err, result) => {
        if (err) {
          console.log('err', err);
          return reject(err);
        }
        return resolve(result);
      });
    } else {
      return reject('Client Not Connected');
    }
  });
}
