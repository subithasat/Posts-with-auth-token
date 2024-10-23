const {signupSchema, signinSchema, acceptCodeSchema} = require("../middlewares/validator")
const User = require("../models/usersModel")
const {doHash} = require("../utils/hashing")
const {doHashValidation, hmacProcess} = require("../utils/hashing")
const jwt = require("jsonwebtoken")
const transport = require('../middlewares/sendMail')
const { exist } = require("joi")

exports.signup = async (req,res)=>{
    const {email,password}= req.body;
    try{
      const {error,value} = signupSchema.validate({email,password})

      if(error){
        return res.status(401).json({success:false, message:error.details[0].message})
      }
      const existingUser= await User.findOne({email})

      if(existingUser){
        return res.status(401).json({success:false,message:"user already exists"})
      }

     const hashedPassword = await doHash(password,12)
     const newUser = new User({
        email, 
        password:hashedPassword,
     })

     const result  = await newUser.save();
     result.password = undefined;
     res.status(201).json({
        success:true,message:"your account has been created successfully",
        result,
     })

    }catch (error){
        console.log(error)
    }
}

exports.signin = async(req,res) =>{
    const{email,password} = req.body
    try{

        const {error,value} = signinSchema.validate({email,password})
        if(error){
            return res
            .status(401)
            .json({success:false, message:error.details[0].message})
        }

        const existingUser = await User.findOne({email}).select("+password")
        if(!existingUser){
            return res.status(401)
            .json({success:false,message:"user does not exists"})
        }
        const result = await doHashValidation(password,existingUser.password)
        if(!result){
            return res
            .status(401)
            .json({success:false,message:"Invalid credentials"})
        }

        const token= jwt.sign(
            {
                userId:existingUser._id,
                email:existingUser.email,
                verfied:existingUser.verified,
            },
            process.env.TOKEN_SECRET,
            {
                expiresIn:'8h'
            }
        );

        res.cookie('Authorization','Bearer'+token,{expires:new Date(Date.now()+
        8 * 3600000),httpOnly:process.env.NODE_ENV === 'production',
        secure:process.env.NODE_ENV ==='production',
})
 .json({
    success:true,
    token,
    message:'logged in successfully'
 })
 
    }catch(error){
        console.log(error);
    }
}

exports.signout = async (req,res)=>{
    try {
        // Signout logic here
        res.status(200).json({ success: true, message: "User signed out" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
//verification with email

exports.sendVerificationCode = async(req,res)=>{
    const{email} = req.body;
    try{
        const existingUser = await User.findOne({email});
        if(!existingUser){
            return res.status(404)
            .json({success:false,message:"user does not exists"})
        }
        if(existingUser.verified){
            return res
            .status(400)
            .json({success:false,message:'you are already verified'})
        }
        const codeValue = Math.floor(Math.random() * 1000000).toString();
        let info = await transport.sendMail({
            from:process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to:existingUser.email,
            subject:"verification code",
            html:'<h1>'+codeValue+'</h1>'
        })

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue,process.env.
                HMAC_VERIFICATION_CODE_SECRET)
                existingUser.verificationCode = hashedCodeValue;
                existingUser.verificationCodeValidation = Date.now();
                await existingUser.save()
                return res.status(200).json({success:true,message:'Code sent'})
        }
         res.status(400).json({success:false,message:'code sent failed'})

    }catch(error){
        console.log(error)
    }
}

//verification code 
exports.verifyVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
       
        const { error,value } = acceptCodeSchema.validate({ email, providedCode });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        // Find the user by email, selecting verification fields
        const existingUser = await User.findOne({ email }).select("+verificationCode +verificationCodeValidation");

        if (!existingUser) {
            return res.status(404).json({ success: false, message: "User does not exist" });
        }

        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: "You are already verified" });
        }

        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: "Something is wrong with the code" });
        }

        // Check if the code has expired (within 5 minutes)
        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Code has been expired" });
        }

        // Hash the provided code and compare with stored hashed code
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue === existingUser.verificationCode) {
            // Mark the user as verified
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;

            await existingUser.save();

            return res.status(200).json({ success: true, message: "Your account has been verified" });
        }

        // If the code does not match
        return res.status(400).json({ success: false, message: "unexpected occured" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
exports.changePassword = async(req,res)=>{
    const{userId,verified} = req.user;
    const{oldPassword,newPassword}=req.body;
    try{
        const { error,value } = changePasswordSchema.validate({ oldPassword, newPassword });
        if (error) {
            return res
            .status(401)
                .json({ success: false, message: error.details[0].message });
        }
        if(!verified){
            return res
            .status(401)
            .json({success:false, message:'you are not verified user'})
        }
        const existingUser = await User.findOne({_id:userId}).select('+password');
        if(!existingUser){
            return res
            .status(401)
            .json({success:false,message:'user does not exists'})
        }
        const result = await doHashValidation(oldPassword,existingUser.password)
        if(!result){
            return res
            .status(401)
            .json({success:false,message:'invalid credentials'})
        }

        const hashedPassword = await doHash(newPassword,12);
        existingUser.password = hashedPassword;
        await existingUser.save();
        return res
        .status(200)
        .json({success:true,message:'password updated'})
        
    }catch(error){
        console.log(error)
    }
}