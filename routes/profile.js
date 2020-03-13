import express from 'express';
import getProfile from '../data/getProfile';
import getProfileBalance from '../data/getProfileBalance';
import { isAuthenticated } from '../authenticate';
import { ObjectID } from 'mongodb';
import updateQuery from '../data/updateQuery';
import insertOne from '../data/insertOne';
import multer from 'multer';
import mime from 'mime';
import crypto from 'crypto';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'static/uploads');
  },
  filename: (req, file, cb) => {
    const randString = crypto.randomBytes(16).toString('hex');
    const fileName = `${randString}.${mime.getExtension(file.mimetype)}`;
    console.log('fileName', fileName);
    cb(null, fileName);
  }
});

const upload = multer({ storage });

const router = express.Router();

router.post('/profile/edit', isAuthenticated, async (req, res) => {
  try {
    const { profileId, data } = req.body;

    if (req.user._id != profileId) {
      res.status(401).send({ message: 'Profile does not belong to user' });
    }

    const query = {
      _id: ObjectID(req.user._id)
    };

    const permittedUpdateFields = [
      'name',
      'bio',
      'education',
      'employment',
      'balance'
    ];

    const update = { $set: {} };
    for (let field in data) {
      if (permittedUpdateFields.includes(field)) {
        if (field === 'balance') {
          const formattedNumber = Math.round(Number(data[field]) * 100) / 100;
          if (isNaN(formattedNumber)) {
            return res.status(400).send();
          }
          data[field] = formattedNumber;
        }
        update.$set[field] = data[field];
      }
    }

    console.log('updating', query, update);

    await updateQuery('users', query, update);

    return res.status(200).send();
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get('/profile/balance', async (req, res) => {
  try {
    console.log('/profile/balance');
    console.log('slug', req.user);
    const data = await getProfileBalance(req.user.slugId);
    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.get('/profile/:slugId', async (req, res) => {
  try {
    const slugId = req.params.slugId;
    const profile = await getProfile(slugId);

    return res.json(profile);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

router.post(
  '/uploadProfileImage',
  isAuthenticated,
  upload.single('file'),
  async (req, res) => {
    try {
      console.log('file', req.file, req.customer);

      const profileImgSrc = `\\${req.file.path}`;

      const query = {
        _id: ObjectID(req.user._id)
      };

      const update = {
        $set: {
          profileImgSrc
        }
      };

      await updateQuery('users', query, update);

      return res.json({ path: profileImgSrc });
    } catch (e) {
      console.log('/uploadProfileImage err', e);
      return res.status(500).send();
    }
  }
);

router.post('/submit-report', isAuthenticated, async (req, res) => {
  try {
    const {
      reportType,
      reportReason,
      reportText,
      subjectId,
      subjectAuthorId
    } = req.body;

    const report = {
      type: reportType,
      reason: reportReason,
      text: reportText,
      reportAuthorId: ObjectID(req.user._id),
      subjectId: ObjectID(subjectId),
      subjectAuthorId: ObjectID(subjectAuthorId)
    };

    console.log('submit-report', report);

    const data = await insertOne('reports', report);
    return res.json(data);
  } catch (e) {
    console.log(e);
    return res.status(500).send();
  }
});

export default router;
