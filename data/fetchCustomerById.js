import client from '../mongo';

export default function fetchCustomer(id) {
  return new Promise((resolve, reject) => {
    if (client.isConnected()) {
      const collection = client.db("peckish").collection("customers");

      let query = { _id: id }
      collection.findOne(query, (err, result) =>{
        if (err) return reject(err);
        return resolve(result);
      });

    } else {
      return reject("Client Not Connected");
    }

  });
}