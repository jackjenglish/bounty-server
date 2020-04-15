import { getClient } from '../mongo';
import { ObjectID } from 'mongodb';

export default function getReports(type) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      let reportCollection = 'comment_reports';
      if (type === 'posts') reportCollection = 'post_reports';

      const collection = client.db('bounty').collection(reportCollection);

      const pipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'reportAuthorId',
            foreignField: '_id',
            as: 'reportAuthor'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'subjectAuthorId',
            foreignField: '_id',
            as: 'subjectAuthor'
          }
        },
        {
          $lookup: {
            from: type,
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $project: {
            _id: 1,
            reason: 1,
            text: 1,
            subject: 1,
            type: 1,
            actionTaken: 1,
            'reportAuthor.name': 1,
            'reportAuthor._id': 1,
            'reportAuthor.slugId': 1,
            'reportAuthor.profileImgSrc': 1,
            'subjectAuthor.name': 1,
            'subjectAuthor._id': 1,
            'subjectAuthor.slugId': 1,
            'subjectAuthor.profileImgSrc': 1
          }
        },
        {
          $unwind: '$reportAuthor'
        },
        {
          $unwind: '$subject'
        },
        {
          $unwind: '$subjectAuthor'
        }
      ];

      const cursor = collection.aggregate(pipeline);

      // return results
      cursor.toArray((err, result) => {
        if (err) {
          console.log('toArray err');
          return reject(err);
        }
        return resolve(result);
      });
    } else {
      return reject('Client Not Connected');
      // TODO Try Connect
    }
  });
}
