import client from '../mongo';

export default function mongoQuery(collectionName) {
  if (client.isConnected()) {
    const collection = client.db('peckish').collection(collectionName);
    return collection;
  }
  throw Error('Client Not Connected');
}
