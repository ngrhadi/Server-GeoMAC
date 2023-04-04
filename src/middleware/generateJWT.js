const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (id) => {
  const payload = {
    id
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '25s' });
}

