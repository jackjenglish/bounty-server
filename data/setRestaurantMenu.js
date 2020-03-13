import client from '../mongo';

export default function setRestaurantMenu(id, newMenu) {
  return new Promise((resolve, reject) => {
    if (client.isConnected()) {
      const collection = client.db('peckish').collection('restaurants');

      const query = { _id: id };
      const update = { $set: { menu: newMenu } };
      console.log(query, update);

      collection.updateOne(query, update, (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      });

    } else {
      return reject('Client Not Connected');
    }

  });
}