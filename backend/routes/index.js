const express = require('express')
const UserController = require('../controllers/user-controller')
const DocumentController = require('../controllers/document-controller')
const router = express.Router()

router.post('/users/login', UserController.login)
router.post('/users/logout', UserController.logout)
router.post('/users/signout', UserController.signout)
router.get('/users/verify', UserController.verify)

router.post('/collection/create', DocumentController.createDocument)
router.post('/collection/delete', DocumentController.deleteDocument)
router.get('/collection/list', DocumentController.listDocument)