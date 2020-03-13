import mongodb from 'mongodb';

let client;

export function connect() {
  return new Promise((resolve, reject) => {
    const MongoClient = mongodb.MongoClient;

    const uri =
      'mongodb+srv://jjenglish:z6Mv0dile31y5Yic@cluster0-fmo1e.mongodb.net/test?retryWrites=true&w=majority';
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    client.connect(err => {
      if (err) {
        console.log('err', err);
        return reject();
      }
      console.log('client connected');
      return resolve(client);
    });
  });
}

export async function getClient() {
  if (client && client.isConnected()) {
    return client;
  }

  return connect();
}

export default client;
