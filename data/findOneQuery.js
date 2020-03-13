import { getClient } from '../mongo';

export default function findOneQuery(collectionName, query) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection(collectionName);

      collection.findOne(query, (err, result) => {
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
