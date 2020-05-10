import jwt from 'jsonwebtoken';

export const generateToken = (user) => {
  const tokenPayload = {
    email: user.email,
    name: user.name,
    userType: user.userType,
    slugId: user.slugId,
    _id: user._id,
  };

  if (!user.userType) tokenPayload.userType = 'moderator';

  const token = jwt.sign(tokenPayload, 'jack', {
    expiresIn: 60 * 60 * 24 * 7,
  });

  return token;
};

export const isAuthenticated = (req, res, next) => {
  if (req.user && req.user._id) return next();
  console.log('Not logged in');
  return res.status(401).send({ message: 'Not Logged In' });
};
