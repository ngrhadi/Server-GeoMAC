const { Router } = require('express');
const geoInfo = require('../controllers/geotechInfo');
const authorizer = require('../middleware/authorizer');
const isAdmin = require('../middleware/isAdmin');
const router = new Router();

router.post('/info', authorizer, isAdmin, geoInfo.postingGeoInfo)
router.post('/workshop/:id', authorizer, isAdmin, geoInfo.postGeoWorkshop)
router.post('/file/:id', authorizer, isAdmin, geoInfo.postGeoFile)

module.exports = router;
