import client from '../mongo';

export default function getRestaurant(id) {
  return new Promise((resolve, reject) => {
    if (client.isConnected()) {
      const collection = client.db('peckish').collection('restaurants');

      const query = { _id: id };

      collection.findOne(query, (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      });

    } else {
      return reject('Client Not Connected');
    }

  });
}