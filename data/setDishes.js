import client from '../mongo';
import { ObjectID } from 'mongodb';

export default function setDishes(dishes) {
  return new Promise(async (resolve, reject) => {
    if(dishes.length < 1) return resolve("No Dishes to set");
    if (client.isConnected()) {
      console.log('setting Dishes');
      const collection = client.db("peckish").collection("dishes");

      const bulk = collection.initializeUnorderedBulkOp();
      dishes.forEach(dish => {
        bulk.find( { _id: ObjectID(dish._id) } ).upsert().replaceOne({...dish, _id: ObjectID(dish._id)});
      });

      try {
        const results = await bulk.execute();
        console.log('Dishes set');
        return resolve(results);
      } catch (e) {
        console.log('ERRROR',e);//throw e;
      }
    } else {
      return reject("Client Not Connected");
    }

  });
}