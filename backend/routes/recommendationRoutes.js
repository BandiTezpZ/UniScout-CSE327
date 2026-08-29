const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/recommendationController');

router.use(auth);
router.post('/', controller.create);
router.get('/student', controller.listStudent);
router.patch('/:id/cancel', controller.cancel);
router.get('/faculty', controller.listFaculty);
router.patch('/:id/accept', controller.accept);
router.patch('/:id/decline', controller.decline);
router.post('/:id/letter', controller.uploadLetter);
router.get('/:id/letter', controller.downloadLetter);

module.exports = router;
