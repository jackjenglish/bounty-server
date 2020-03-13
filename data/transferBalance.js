import updateQuery from './updateQuery';
import { ObjectID } from 'mongodb';

export function transferBalance(fromUserId, toUserId, amount) {
  return Promise.all([
    updateQuery(
      'users',
      {
        _id: ObjectID(fromUserId)
      },
      {
        $inc: { balance: -amount }
      }
    ),
    updateQuery(
      'users',
      {
        _id: ObjectID(toUserId)
      },
      {
        $inc: { balance: amount }
      }
    )
  ]);
}
