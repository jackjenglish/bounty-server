import express from 'express';
import bcrypt from 'bcrypt-nodejs';
import findOneQuery from '../data/findOneQuery';
import createUser from '../data/createUser';
import { generateToken } from '../authenticate';
import stripPrivateUserData from '../utils/stripPrivateUserData';
import { validateNewUserData } from '../utils/userUtils';
import postRouter from './post';
import profileRouter from './profile';
import reportsRouter from './reports';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findOneQuery('users', { email });

    if (!user)
      return res
        .status(401)
        .send({ message: 'Account with that email not found' });

    bcrypt.compare(password, user.password, (err, match) => {
      if (err) throw new Error('Hash Compare Error');

      if (!match) {
        return res.status(401).send({ message: 'Invalid Credentials' });
      }
      const cleanUser = stripPrivateUserData(user); // strip off sensitive info

      const token = generateToken(user);

      return res.json({ user: cleanUser, token });
    });
  } catch (e) {
    return res.status(500).send();
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { email } = req.body;

    const existingCustomer = await findOneQuery('users', { email });
    if (existingCustomer) {
      res
        .status(401)
        .send({ message: `Account with email ${email} already exists` });
    }

    const userData = req.body;

    const validated = validateNewUserData(userData);
    if (!validated) return res.status(400).send();
    const newUser = await createUser(userData);
    const token = generateToken(newUser);
    return res.json({ user: stripPrivateUserData(newUser), token });
  } catch (e) {
    console.log(e);
    return res.status(500).send('Error');
  }
});

router.use(postRouter);
router.use(profileRouter);
router.use(reportsRouter);

export default router;
