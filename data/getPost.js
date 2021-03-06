import { getClient } from '../mongo';
import { ObjectID } from 'mongodb';

export default function getPost(slugId, userId) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();

    if (client.isConnected()) {
      const collection = client.db('bounty').collection('posts');

      const pipeline = [
        { $match: { slugId } },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $lookup: {
            from: 'topics',
            localField: 'topics',
            foreignField: '_id',
            as: 'topics'
          }
        }
      ];

      if (userId) {
        pipeline.push({
          $lookup: {
            from: 'votes',
            let: {
              slugId,
              user: ObjectID(userId)
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$postSlugId', '$$slugId'] },
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
            title: 1,
            description: 1,
            currency: 1,
            value: 1,
            slugId: 1,
            topic: 1,
            removed: 1,
            acceptedReply: 1,
            upvoted: { $arrayElemAt: ['$upvoted', 0] },
            score: 1,
            topics: 1,
            commentCount: 1,
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
        if (err || result.length < 1) {
          console.log('toArray err');
          return reject(err);
        }

        return resolve(result[0]);
      });
    } else {
      return reject('Client Not Connected');
      // TODO Try Connect
    }
  });
}
