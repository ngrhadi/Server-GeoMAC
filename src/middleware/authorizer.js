const jwt = require('jsonwebtoken');
const knex = require('../../config')
const generateJWT = require('./generateJWT');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization').split(' ')[1];

    const curentTime = new Date().getTime();
    const jwtExpt = new Date(jwt.decode(token).exp).getTime()
    const idUser = jwt.decode(token).id

    let newToken;


    if (curentTime > jwtExpt) { // && req.cookies._cxrf !== undefined add this if ready to production
      newToken = generateJWT(idUser)
      res.set('X-Access-Token', newToken)
      await knex('users_token').where({ id: idUser }).update({
        token_string: newToken
      })
    }


    if (!token && !req.cookies._cxrf !== undefined) {
      return res.status(401).send({
        "status": false,
        "message": 'You are not Login',
        "data": null
      });
    }



    const payload = await jwt.verify(newToken, process.env.JWT_SECRET);
    req.userId = payload.id;

    next();
  } catch (err) {
    return res.status(500).send({
      "status": false,
      "message": 'You are not Login',
      "data": null
    });
  }
}
