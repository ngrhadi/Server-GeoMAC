const { Router } = require('express');
const project = require('../controllers/geotechInfo')

const router = new Router();

router.get('/:id', project.getProjectInfoById)

module.exports = router;
