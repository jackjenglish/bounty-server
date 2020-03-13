import { getClient } from '../mongo';

export default function getProfileBalance(slugId) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();
    if (client.isConnected()) {
      const collection = client.db('bounty').collection('users');
      const cursor = collection.aggregate([
        { $match: { slugId } },
        {
          $project: {
            _id: 1,
            balance: 1
          }
        }
      ]);

      // return results
      cursor.toArray((err, result) => {
        if (err || result.length != 1) {
          console.log('toArray err');
          return reject(err);
        }
        return resolve(result[0]);
      });
    } else {
      return reject('Client Not Connected');
      // TODO Try Connect
    }
  });
}
