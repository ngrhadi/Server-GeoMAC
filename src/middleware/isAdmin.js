const knex = require('../../config')

module.exports = async function (req, res, next) {
  try {
    console.log(req.userId)
    const adminInfo = await knex('users').where('id', req.userId).select('role')
    console.log(adminInfo[0].role)
    if (adminInfo[0].role?.toString() !== 'AD' ?? 'SA') {
      res.status(401).send({
        status: true,
        message: "Not authorized",
        data: null
      })
    } else {
      next()
    }
  } catch (error) {
    next(error)
  }
}
