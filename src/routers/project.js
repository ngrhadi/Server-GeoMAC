const { Router } = require('express');
const project = require('../controllers/geotechInfo');
const isAdmin = require('../middleware/isAdmin');
const authorizer = require('../middleware/authorizer');

const router = new Router();

router.get('/:id', project.getProjectInfoById)
router.post('/delete/:id', authorizer, isAdmin, project.deleteProjectInfo)
router.put('/edit/geo-info/:id', authorizer, isAdmin, project.editProjectGeoInfo)
router.put('/edit/geo-workshop/:id', authorizer, isAdmin, project.editProjectWorkshop)
router.put('/edit/geo-file/:id', authorizer, isAdmin, project.editProjectGeoFile)
router.post('/delete/geo-file/:id', project.deleteFileEdit)

module.exports = router;
