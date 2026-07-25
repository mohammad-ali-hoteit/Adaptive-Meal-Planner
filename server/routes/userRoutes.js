const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('Please enter a valid email address.'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
], userController.registerUser);

router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.')
], userController.loginUser);

router.get('/user', auth, userController.getUserProfile);
router.post('/onboarding', auth, userController.saveOnboarding);
router.put('/settings', auth, userController.updateSettings);
router.put('/user/profile', auth, userController.updateProfile);
router.delete('/user/delete', auth, userController.deleteAccount);

module.exports = router;
