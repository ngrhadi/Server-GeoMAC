const { Router } = require('express')
const users = require('../controllers/users')
const limiter = require('../utils/limiters');
const speedLimiter = require('../utils/slowDown');
const authorizer = require('../middleware/authorizer');
const knex = require('../../config')

const router = new Router()

router.post('/register', users.registerUser)
router.post('/login', limiter, speedLimiter, users.loginUser)
router.post('/logout', authorizer, users.logoutUser, async function (req, res, next) {
  try {
    await knex('users_token').where({ user_id: req.userId }).del()
  } catch (error) {
    next(error)
  }
})

module.exports = router
