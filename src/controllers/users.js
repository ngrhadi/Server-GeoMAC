const knex = require('../../config.js');
const bcrypt = require('bcrypt');
const generateJWT = require('../middleware/generateJWT');
const { generateToken } = require('../utils/cxrf');

async function registerUser(req, res, next) {
  try {
    const { data } = req.body

    const {
      username,
      email,
      password,
      company_name
    } = data

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const encryptedPassword = await bcrypt.hash(password, salt);

    await knex('users').insert({ username: username, email: email, password: encryptedPassword, company_name: company_name}
    )

    const userInfo = await knex('users').where('username', username).select(
      'email', 'username', 'role', 'company_name', 'created_at', 'updated_at'
    )

    res.send({
      status: true,
      message: "Successfully registered",
      data: userInfo
    })

  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const {data} = req.body
    const {
      username,
      password,
    } = data

    console.log(req.body)

    let isUserName = false
    let isEmail = false

    const filterUsernameOrEmail = [username].filter(v => v?.toLowerCase().includes('@') || v?.toLowerCase().includes('.') ? isEmail =true : isUserName = true)
    let userInfo;
    if (isEmail === true) {
      userInfo = await knex('users').where('email', username).select('password', 'id')
    } else {
      userInfo = await knex('users').where('username', username).select('password', 'id')
    }

    const userInfoReturn = await knex('users').where('username', username).select('id', 'email', 'username', 'company_name')

    if (userInfo.length === 0) {
      return res.status(404).send({
        "status": false,
        "message": 'Incorrect email / password',
        "data": null
      });
    }

    const validPassword = await bcrypt.compare(password, userInfo[0].password);

    if (!validPassword) {
      return res.status(404).send({
        "status": false,
        "message": 'Incorrect email / password',
        "data": null
      });
    } else {
      const token = generateJWT(userInfo[0].id);

      const checkUserLogin = await knex('users_token').where('user_id', userInfo[0].id)

      if (checkUserLogin.length === 0) {
        await knex('users_token').insert({
          user_id: userInfo[0].id,
          token_string: token,
        })
      }

      const tokenCxrf = generateToken(res, req)
      res.cookie('_cxrf', tokenCxrf)

      res.set('X-Access-Token', token)

      await res.status(201).json({
        status: true,
        message: "Successfully signed",
        data: {
          ...userInfoReturn[0],
          _cxrf: tokenCxrf,
          token: token
        }
      })
    }

  } catch (error) {
    next(error);
  }
}

async function logoutUser(req, res, next) {
  try {
    next()
    if (req.session) {
      req.session.destroy();
    }
    if (req.headers && req.headers.authorization) {
      res.clearCookie('_cxrf')
      res.set('authorization', null)
      res.set('x-access-token', null)
      res.send({
        "status": true,
        "message": "Success logout",
        "data": null
      })
    }
  } catch (error) {
    next(error)
  }
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser
}
