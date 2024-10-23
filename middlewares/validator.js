const Joi = require('joi')

exports.signupSchema = Joi.object({
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    password:Joi.string()
    .required()
    .pattern(new RegExp("^[A-Za-z\\d]{6,}$")) 
})
exports.signinSchema = Joi.object({
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    password:Joi.string()
    .required()
    .pattern(new RegExp("^[A-Za-z\\d]{6,}$")) 
})

exports.acceptCodeSchema = Joi.object({
    email:Joi.string()
    .min(6)
    .max(60)
    .required()
    .email({
        tlds:{allow:['com','net']},
    }),
    providedCode:Joi.number().required()
})

exports.changePasswordSchema = Joi.object({
    newPassword:Joi.string()
    .required()
    .pattern(new RegExp("^[A-Za-z\\d]{6,}$")), 
    oldPassword:Joi.string()
    .required()
    .pattern(new RegExp("^[A-Za-z\\d]{6,}$")) 
})