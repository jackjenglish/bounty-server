import express from 'express';
import getReports from '../data/getReports';

const router = express.Router();

router.get('/post-reports', async (req, res) => {
  try {
    // return res.json({});
    console.log('post-reports');
    let userId;
    if (req.user) {
      userId = req.user._id;
    }
    const data = await getReports('posts');

    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get('/comment-reports', async (req, res) => {
  try {
    console.log('comment-reports');

    // return res.json({});
    let userId;
    if (req.user) {
      userId = req.user._id;
    }
    const data = await getReports('comments');

    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

export default router;
