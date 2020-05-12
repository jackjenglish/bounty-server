import express from 'express';
import getReports from '../data/getReports';
import updateQuery from '../data/updateQuery';
import deleteOne from '../data/deleteOne';
import upsertOne from '../data/upsertOne';
import { ObjectID } from 'mongodb';
import insertOne from '../data/insertOne';
import { isAuthenticated } from '../authenticate';

const router = express.Router();
router.post('/submit-report', isAuthenticated, async (req, res) => {
  try {
    const {
      reportType,
      reportReason,
      reportText,
      subjectId,
      subjectAuthorId,
    } = req.body;

    const report = {
      type: reportType,
      reason: reportReason,
      text: reportText,
      reportAuthorId: ObjectID(req.user._id),
      subjectId: ObjectID(subjectId),
      subjectAuthorId: ObjectID(subjectAuthorId),
    };

    let reportCollection = 'post_reports';
    if (report.type === 'comment') {
      reportCollection = 'comment_reports';
    }

    console.log('submit-report', report);

    const data = await insertOne(reportCollection, report);
    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get('/post-reports', async (req, res) => {
  try {
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

router.post('/report-action', isAuthenticated, async (req, res) => {
  try {
    console.log('user ', req.user);
    if (req.user.userType !== 'moderator') {
      return res.status(400).send();
    }

    const { report, reportAction } = req.body;
    if (!report.type) return res.status(400).send();
    let reportCollection = 'post_reports';
    let subjectCollection = 'posts';
    if (report.type === 'comment') {
      reportCollection = 'comment_reports';
      subjectCollection = 'comments';
    }

    const dbQueries = [
      updateQuery(
        reportCollection,
        { _id: ObjectID(report._id) },
        { $set: { actionTaken: reportAction } }
      ),
    ];

    if (reportAction === 'subject-removed') {
      dbQueries.push(
        upsertOne(
          subjectCollection,
          { _id: ObjectID(report.subject._id) },
          { $set: { removed: true } }
        )
      );
    }

    const responses = await Promise.all(dbQueries);

    return res.json(responses);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

export default router;
