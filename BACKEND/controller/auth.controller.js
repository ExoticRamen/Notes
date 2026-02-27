const User = require('../model/user.model.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const registerUser = async (req, res) => {
    try{
        const {email, password} = req.body;

        const existingUser = await User.findOne({email});
        if(existingUser) return res.status(400).json({message: "User already exits"})

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email, password: hashedPassword
        });

        res.status(200).json({message: "User creation successful"});
    }
    catch(error){
        res.status(500).json({message: error.message});
    }

}

const loginUser = async (req, res) =>{

    try {
        const{email, password} = req.body;
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({message: "User not found"});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(500).json({message: "Invalid credentials"});

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.status(200).json({token, user: {email: user.email, id: user._id}});
        
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}

module.exports = {registerUser, loginUser};