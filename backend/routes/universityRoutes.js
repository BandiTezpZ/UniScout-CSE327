const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/universityController');

router.use(auth);
router.get('/', controller.list);
router.get('/saved', controller.saved);
router.get('/suggested', controller.suggested);
router.post('/suggested/generate', controller.generateSuggested);
router.post('/ai/shortlist', controller.shortlistAi);
router.delete('/ai/shortlist/:id', controller.removeAiShortlist);
router.post('/:id/shortlist', controller.shortlist);
router.delete('/:id/shortlist', controller.removeShortlist);
router.get('/admin/all', controller.adminList);
router.post('/admin', controller.create);
router.put('/admin/:id', controller.update);
router.delete('/admin/:id', controller.remove);
router.post('/admin/upload-image', require('../controllers/uploadController').uploadUniversityPicture);

module.exports = router;
