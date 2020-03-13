import jwt from 'jsonwebtoken';

/*export const login = (email, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      const customer = await findOneQuery('users', { email });

      bcrypt.compare(password, customer.password, (err, match) => {
        if (err) return reject('Hash Compare Error');
        if (!match) {
          return reject('Invalid Credentials');
        }
        const cleanCustomer = cust//cleanRestaurantData(customer);
        return resolve(cleanCustomer);
      });
    } catch (e) {
      return reject('Failed to fetch Customer');
    }
  });
};*/

export const generateToken = user => {
  const tokenPayload = {
    email: user.email,
    name: user.name,
    slugId: user.slugId,
    _id: user._id
  };

  const token = jwt.sign(tokenPayload, 'jack', {
    expiresIn: 60 * 60 * 24 * 7
  });

  return token;
};

export const isAuthenticated = (req, res, next) => {
  if (req.user && req.user._id) return next();
  console.log('Not logged in');
  return res.status(401).send({ message: 'Not Logged In' });
};
