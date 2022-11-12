const express = require('express')
const DocumentController = require('../controllers/document-controller')
const UserController = require('../controllers/user-controller')
const FrontEndController = require('../controllers/get-frontend-controller')
const router = express.Router()
const multer  = require('multer')
const upload = multer({ dest: 'media/' })

const auth = (req, res, next) => {
    res.setHeader('X-CSE356', '6306cc6d58d8bb3ef7f6b85b');
    //console.log(req)
    //console.log(req.session)
    //console.log(req.session.id)
    if (req.session.user){
        next()
    }else{
        return res
            .status(200)
            .json({
                error: true,
                message: 'unauthorized'
            })
    }
}
router.post('/users/login', UserController.login)
router.post('/users/signup', UserController.signup)
router.post('/users/signout', UserController.signout)
router.get('/users/verify', UserController.verify)

router.post('/collection/create', auth,  DocumentController.createDocument)
router.post('/collection/delete', auth, DocumentController.deleteDocument)
router.get('/collection/list', auth, DocumentController.listDocument)

router.get('/api/connect/:id', auth, DocumentController.connect)
router.post('/api/op/:id', auth, DocumentController.update)
router.post('/api/presence/:id', auth, DocumentController.updatePresence)

router.post('/media/upload', auth, upload.single('file'), DocumentController.fileUpload)
router.get('/media/access/:mediaid', auth, DocumentController.fileDownload)

//router.get('/edit/:id', auth, FrontEndController.getEditor)
//router.get('/home', auth, FrontEndController.getLib)
router.get('/library/crdt.js', FrontEndController.getLib)

module.exports = router