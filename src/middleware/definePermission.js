const knex = require('../config')


async function isSuperAdmin(req, res, next) {
  const isRoleId = await knex('users_account').where('id', req.userId)

  if (isRoleId.role_id[0] !== 1) {
    return res.status(401).send({
      status: false,
      message: 'Not authorized',
      data: null
    })
  }

  next()
}

async function isAdmin(req, res, next) {
  const isRoleId = await knex('users_account').where('id', req.userId)

  if (isRoleId.role_id[0] !== 1 || 2) {
    return res.status(401).send({
      status: false,
      message: 'Not authorized',
      data: null
    })
  }

  next()
}

async function isOperatorSurvey(req, res, next) {
  const isRoleId = await knex('users_account').where('id', req.userId)

  if (isRoleId.role_id[0] !== 1 || 2 || 3) {
    return res.status(401).send({
      status: false,
      message: 'Not authorized',
      data: null
    })
  }

  next()
}

async function isOperatorSpam(req, res, next) {
  const isRoleId = await knex('users_account').where('id', req.userId)

  if (isRoleId.role_id[0] !== 1 || 2 || 3 || 4) {
    return res.status(401).send({
      status: false,
      message: 'Not authorized',
      data: null
    })
  }

  next()
}

async function isPublic(req, res, next) {
  const isRoleId = await knex('users_account').where('id', req.userId)

  if (isRoleId.role_id[0] === 5) {
    next()
  }

  return res.status(401).send({
    status: false,
    message: 'Not authorized',
    data: null
  })
}

module.exports = {
  isSuperAdmin,
  isAdmin,
  isOperatorSurvey,
  isOperatorSpam,
  isPublic
}
