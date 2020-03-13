import express from 'express';
import bcrypt from 'bcrypt-nodejs';
import { ObjectID } from 'mongodb';
import crypto from 'crypto';
import findOneQuery from '../data/findOneQuery';
import createUser from '../data/createUser';
import insertOne from '../data/insertOne';
import { generateToken, isAuthenticated } from '../authenticate';
import stripPrivateUserData from '../utils/stripPrivateUserData';
import getPosts from '../data/getPosts';
import getPost from '../data/getPost';
import getPostComments from '../data/getPostComments';
import updateQuery from '../data/updateQuery';
import deleteOne from '../data/deleteOne';
import upsertOne from '../data/upsertOne';
import getProfile from '../data/getProfile';
import getProfileBalance from '../data/getProfileBalance';
import { transferBalance } from '../data/transferBalance';

const router = express.Router();

router.post('/posts', async (req, res) => {
  try {
    let userId;
    if (req.user) {
      userId = req.user._id;
    }
    const data = await getPosts(userId);

    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.post('/submit-post', isAuthenticated, async (req, res) => {
  try {
    const { title, description, value } = req.body;
    const slugId = crypto.randomBytes(5).toString('hex');
    const newPost = {
      title,
      description,
      value,
      currency: 'USD',
      authorId: ObjectID(req.user._id),
      slugId
    };

    const data = await insertOne('posts', newPost);
    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get('/post/:slugId', async (req, res) => {
  try {
    const slugId = req.params.slugId;
    let userId;
    if (req.user) {
      userId = req.user._id;
    }

    const [post, comments] = await Promise.all([
      getPost(slugId, userId),
      getPostComments(slugId, userId)
    ]);

    post.comments = comments;
    return res.json(post);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.post('/comments', async (req, res) => {
  try {
    const { slugId, userId } = req.body;
    const comments = await getPostComments(slugId, userId);
    return res.json(comments);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.post('/post/accept', isAuthenticated, async (req, res) => {
  try {
    const { postSlugId, commentId } = req.body;
    console.log('accept', postSlugId, commentId);

    const [comment, postData, currentBalance] = await Promise.all([
      findOneQuery('comments', { _id: ObjectID(commentId) }),
      getPost(postSlugId),
      getProfileBalance(req.user.slugId)
    ]);

    const bountyWinnerId = comment.authorId;
    const postBounty = postData.value;
    const userBalance = currentBalance.balance;

    if (req.user._id === String(bountyWinnerId)) {
      return res.status(400).send();
    }

    if (userBalance < postBounty) {
      return res.status(402).json({
        error: 'Insufficient Balance to awardy bounty',
        userBalance,
        postBounty
      });
    }

    await transferBalance(req.user._id, bountyWinnerId, postBounty);

    const query = {
      authorId: ObjectID(req.user._id),
      slugId: postSlugId
    };
    const update = {
      $set: {
        acceptedReply: ObjectID(commentId)
      }
    };
    const data = await updateQuery('posts', query, update);

    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.post('/post/accept-clear', isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.body;

    const query = {
      authorId: ObjectID(req.user._id),
      _id: ObjectID(postId)
    };

    const update = {
      $set: {
        acceptedReply: null
      }
    };

    const data = await updateQuery('posts', query, update);

    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.post('/post/:slugId/comment', isAuthenticated, async (req, res) => {
  try {
    const { comment, postSlugId } = req.body;

    const result = await insertOne('comments', {
      authorId: ObjectID(req.user._id),
      postSlugId,
      text: comment.content
    });

    const postFilter = { slugId: postSlugId };
    const incrementCommentCount = { $inc: { commentCount: 1 } };
    await updateQuery('posts', postFilter, incrementCommentCount);

    return res.json({
      ...result,
      author: {
        _id: req.user._id,
        name: req.user.name,
        profileImgSrc: req.user.profileImgSrc
      }
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get('/post/:postSlugId/upvote', isAuthenticated, async (req, res) => {
  try {
    const { postSlugId } = req.params;
    const voteObject = {
      userId: ObjectID(req.user._id),
      postSlugId
    };

    const upsertResult = await upsertOne('votes', voteObject, voteObject);

    if (!upsertResult.result.nModified) {
      const postFilter = { slugId: postSlugId };
      const incrementScore = { $inc: { score: 1 } };
      await updateQuery('posts', postFilter, incrementScore);
    }

    return res.status(200).send();
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get(
  '/post/:postSlugId/clear-upvote',
  isAuthenticated,
  async (req, res) => {
    try {
      const { postSlugId } = req.params;

      const deleteResult = await deleteOne('votes', {
        userId: ObjectID(req.user._id),
        postSlugId
      });

      if (deleteResult.deletedCount === 1) {
        const postFilter = { slugId: postSlugId };
        const incrementScore = { $inc: { score: -1 } };
        await updateQuery('posts', postFilter, incrementScore);
      }

      return res.status(200).send();
    } catch (e) {
      console.log(e);
      return res.status(500).send();
    }
  }
);

router.get('/comment/:commentId/upvote', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const voteObject = {
      userId: ObjectID(req.user._id),
      commentId: ObjectID(commentId)
    };

    const upsertResult = await upsertOne('votes', voteObject, voteObject);

    if (!upsertResult.result.nModified) {
      const commentFilter = { _id: ObjectID(commentId) };
      const commentIncrementScore = { $inc: { score: 1 } };
      await updateQuery('comments', commentFilter, commentIncrementScore);
    }

    return res.status(200).send();
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get(
  '/comment/:commentId/clear-upvote',
  isAuthenticated,
  async (req, res) => {
    try {
      const { commentId } = req.params;

      const deleteResult = await deleteOne('votes', {
        userId: ObjectID(req.user._id),
        commentId: ObjectID(commentId)
      });

      if (deleteResult.deletedCount === 1) {
        const commentFilter = { _id: ObjectID(commentId) };
        const commentIncrementScore = { $inc: { score: -1 } };
        await updateQuery('comments', commentFilter, commentIncrementScore);
      }

      return res.status(200).send();
    } catch (e) {
      console.log(e);
      return res.status(500).send();
    }
  }
);

export default router;
