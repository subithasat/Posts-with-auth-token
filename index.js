require('dotenv').config();
const express = require('express');
const { default: helmet } = require('helmet');
const cors = require('cors')
const cookieParser = require("cookie-parser")
const mongoose = require('mongoose')
const app = express()
const bodyParser = require('body-parser');
const authRouter = require('./routes/authRouter')

app.use(cors())
app.use(helmet())
app.use(cookieParser())
app.use(express.json())
app.use(bodyParser.json());
app.use(express.urlencoded({extended:true}))


mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("Database connected")
}).catch(err=>{
    console.log(err)
})

app.use('/api/auth',authRouter)
app.get('/',(req,res)=>{
    res.json({message:"hello from the server"})
})

//mongodb+srv://subisamca:12345@cluster0.bip7r.mongodb.net/
app.listen(process.env.PORT,()=>{
    console.log('listening..');
});