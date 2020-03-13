import { getClient } from '../mongo';

export default function findQuery(collectionName, query) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection(collectionName);

      const cursor = collection.find(query);

      // return results
      cursor.toArray((err, result) => {
        if (err) {
          console.log('toArray err');
          return reject(err);
        }
        return resolve(result);
      });
    } else {
      return reject('Client Not Connected');
      // TODO Try Connect
    }
  });
}
