export default function(userData) {
  const returnObject = Object.assign({}, userData);
  delete returnObject['password'];
  return returnObject;
}
