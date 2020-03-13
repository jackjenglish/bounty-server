import client from '../mongo';

export default function queryDishes(dishIds) {
  return new Promise((resolve, reject) => {
    if (client.isConnected()) {
      const collection = client.db("peckish").collection("dishes");


      let query = {
        _id: { $in: dishIds }
      }

      const cursor = collection.find(query);

      // return results
      cursor.toArray((err, result) =>  {
        if (err) {
          return reject(err)
        };
        return resolve(result);
      });
    } else {
      return reject("Client Not Connected");
    }

  });
}