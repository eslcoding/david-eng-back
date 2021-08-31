const router = require('express').Router();
const { authenticationMiddleware } = require('../../middlewares/requireAuth.middleware');

const {getInter, onUpdateColumns, getInterTest} = require('./monday.controller');

router.post('/inter',authenticationMiddleware, getInter);
router.post('/interTest',authenticationMiddleware, getInterTest);
router.post('/updateColumns',authenticationMiddleware, onUpdateColumns);
// router.post('/updateColumns',authenticationMiddleware, testMailPdf);


// router.post('/auto', mondayController.getWebHook);
// router.post('/interItem',authenticationMiddleware, mondayController.getInterItem);
// router.post('/item', mondayController.getWebHookItem);
// router.post('/auto',authenticationMiddleware, mondayController.getWebHook);
// router.post('/auto', mondayController.tryWebHooks);

module.exports = router;