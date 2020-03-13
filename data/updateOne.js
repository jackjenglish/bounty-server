import { getClient } from '../mongo';

export default function updateQuery(collectionName, query, updateObject) {
  return new Promise((resolve, reject) => {
    getClient()
      .then(client => {
        if (client.isConnected()) {
          const collection = client.db('bounty').collection(collectionName);

          // const query = { _id: id };
          const update = { $set: updateObject };
          console.log('\n\nupdateOne\n', query, '\n', update);

          collection.updateOne(query, update, (err, result) => {
            if (err) return reject(err);
            return resolve(result);
          });
        } else {
          return reject('Client Not Connected');
          // TODO Try Connect
        }
      })
      .catch(() => reject());
  });
}
