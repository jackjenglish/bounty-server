import express from 'express';
import path from 'path';
import { connect } from './mongo';
import routes from './routes';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  let token = req.headers.authorization;
  if (!token) return next();

  token = token.replace('Bearer ', '');

  try {
    const decodedToken = jwt.verify(token, 'jack');
    req.user = decodedToken;
    next();
  } catch (e) {
    console.log('auth middleware fail');
    return res.status(401).json({
      success: false,
      message: 'Please log in'
    });
  }
});

app.use(routes);
app.use('/dist', express.static('../bounty-client/dist'));
app.use('/static', express.static('static'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

const server = app.listen(8080);
const mongoClient = connect();

server.on('listening', () => {
  console.log('listening on 8080');
});
