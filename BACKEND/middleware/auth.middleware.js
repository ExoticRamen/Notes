const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const {authorization} = req.headers;

    if(!authorization) return res.status(400).json({message: "Authorization token required"});
    const token = authorization.split(' ')[1];
    try {
        const {id} = jwt.verify( token, process.env.JWT_SECRET);
        req.user = {id};

        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid or expired token. Access Denied." });
    }


};

module.exports = requireAuth;