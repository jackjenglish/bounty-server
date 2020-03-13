import { getClient } from '../mongo';

export default function getProfile(slugId) {
  return new Promise(async (resolve, reject) => {
    const client = await getClient();
    if (client.isConnected()) {
      const collection = client.db('bounty').collection('users');
      const cursor = collection.aggregate([
        { $match: { slugId } },
        {
          $lookup: {
            from: 'posts',
            localField: '_id',
            foreignField: 'authorId',
            as: 'posts'
          }
        },
        {
          $lookup: {
            from: 'comments',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$authorId', '$$userId'] }
                }
              },
              {
                $lookup: {
                  from: 'posts',
                  localField: 'postSlugId',
                  foreignField: 'slugId',
                  as: 'post'
                }
              },
              { $unwind: '$post' }
            ],
            as: 'comments'
          }
        },

        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            slugId: 1,
            posts: 1,
            comments: 1,
            bio: 1,
            balance: 1,
            education: 1,
            employment: 1,
            profileImgSrc: 1
          }
        }
      ]);

      // return results
      cursor.toArray((err, result) => {
        if (err || result.length != 1) {
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
