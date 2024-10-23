const express = require("express")
const identifier = require ("../middlewares/identification")
const authController = require("../controllers/authController")
const router = express.Router();

router.post('/signup',authController.signup)
router.post('/signin',authController.signin)
router.post('/signout',authController.signout)

router.patch('/send-verification-code',authController.sendVerificationCode)
router.patch('/verify-verification-code',authController.verifyVerificationCode)

//router.patch('/change-password',identifier,authController.changePassword)

module.exports = router