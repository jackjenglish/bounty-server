import { getClient } from '../mongo';
import { ObjectID } from 'mongodb';

export default function getPostComments(postSlugId, userId) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection('comments');

      const pipeline = [
        { $match: { postSlugId } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author'
          }
        }
      ];

      if (userId) {
        pipeline.push({
          $lookup: {
            from: 'votes',
            let: {
              comment: '$_id',
              user: ObjectID(userId)
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$commentId', '$$comment'] },
                      { $eq: ['$userId', '$$user'] }
                    ]
                  }
                }
              }
            ],
            as: 'upvoted'
          }
        });
      }

      pipeline.push(
        {
          $project: {
            _id: 1,
            text: 1,
            score: 1,
            upvoted: { $arrayElemAt: ['$upvoted', 0] },
            'author.name': 1,
            'author._id': 1,
            'author.slugId': 1,
            'author.profileImgSrc': 1
          }
        },
        {
          $unwind: '$author'
        }
      );

      const cursor = collection.aggregate(pipeline);

      // return results
      cursor.toArray((err, result) => {
        if (err) {
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
