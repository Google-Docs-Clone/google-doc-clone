const User = require('../models/user-model')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const exec = require('child_process').spawn

sendEmail = async (email, key, host, res) => {
    let link = "http://" + host + "/verify?email=" + encodeURIComponent(email) + "&key=" + key
    let commands = ['-c', "echo " + '\"' + link + "\"" + " | mail --encoding=quoted-printable -s \"verify\" " + email] 
    let child = exec('sh', commands)

    //console.log('email sent')
    return res
        .status(200)
        .json({
            status: 'ok'
        })
}

login = async (req, res) => {
    res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
    const {email, password} = req.body
    //console.log(req.body)

    if (!email || !password){
        return res
                .status(200)
                .json({
                    error: true,
                    message: 'missing email or password'
                })
    }
    const user = await User.findOne({email:email})
    if(!user){
        return res
                .status(200)
                .json({
                    error: true,
                    message: 'no user found'
                })
    }

    if(!user.verified){
        return res
                .status(200)
                .json({
                    error: true,
                    message: 'user unverified'
                })
    }

    const match = await bcrypt.compare(password, user.password);
    if(!match) {
        return res
            .status(200)
            .json({
                error: true,
                message: 'invalid password'
            })
    }

    req.session.user = email
    req.session.name = user.name
    req.session.token = crypto.generateKeySync('hmac', { length: 128 }).export().toString('hex')
    return res
        .status(200)
        .json({
            status: 'login',
            name: user.name
        })

}

signup = async (req, res) => {
    const {name, password, email} = req.body;
    console.log(req.body)
    res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
    if (!name || !password || !email) {
        return res
            .status(200)
            .json({
                error: true,
                message: 'invalid username, password, or email'
            })
    }

    const existingEmail = await User.findOne({ email: email });
    console.log(existingEmail)
    const existingUser = await User.findOne({ name: name });
    console.log(existingUser)
    if (existingEmail || existingUser) {
        return res
            .status(200)
            .json({
                error: true,
                message: "existing user"
            })
    }   

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    const key = crypto.generateKeySync('hmac', { length: 128 }).export().toString('hex')

    const newUser = new User({
        email: email,
        name: name,
        password: passwordHash,
        verified: false,
        key: key
    })

    const savedUser = await newUser.save();

    sendEmail(email, key, req.get('host'), res)

}

verify = async (req, res) => {
    res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
    const {email, key} = req.query

    const user = await User.findOne({ email: email });

    if (key !== user.key){
        //console.log('not same key')
        return res
            .status(200)
            .json({
                error: true,
                message: 'invalid verification key'
            })
    }
    user.verified = true
    await user.save()
    //console.log('wait')
    return res
        .status(200)
        .json({
            status: 'OK'
        })
}

signout = (req, res) => {
    //console.log(req.session)
    console.log('logout')
    res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
    req.session.destroy()
    return res
        .status(200)
        .send(JSON.stringify({
            status: 'OK'
        }))
}

module.exports = {
    login,
    signout,
    verify,
    signup
}