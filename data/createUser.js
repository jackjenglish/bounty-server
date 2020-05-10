import { getClient } from '../mongo';
import crypto from 'crypto';
import bcrypt from 'bcrypt-nodejs';

const createUserObject = (data) => {
  return new Promise((resolve, reject) => {
    const slugId = crypto.randomBytes(5).toString('hex');

    const plaintextPassword = data.password;
    bcrypt.hash(plaintextPassword, null, null, async (err, hashedPassword) => {
      if (err) return reject('Hashing Error');

      return resolve({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        slugId,
        balance: 0,
        bio: '',
        education: '',
        employment: '',
        profileImgSrc: null,
        userType: 'moderator',
      });
    });
  });
};

export default function createUser(userData) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection('users');

      const newCustomer = await createUserObject(userData);

      collection.insertOne(newCustomer, (err, result) => {
        if (err) return reject(err);
        return resolve({ ...newCustomer, ...{ _id: result.insertedId } });
      });
    } else {
      return reject('Client Not Connected');
    }
  });
}
