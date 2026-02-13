
import express from 'express'
import  trimRequest  from 'trim-request';
import { requireAuth } from '../middlewares/auth.middleware.js';
import * as gameActivationController from '../controllers/game-activation.controller.js';
import * as gameActivationValidator from '../validators/game-activation.validator.js';


const router = express.Router()

router.use(trimRequest.all)
router.use(requireAuth)





router.post(
    '/' ,
    gameActivationValidator.getActivationCode ,
    gameActivationController.createGameActivationCode   
)

router.get(
    '/' ,
    gameActivationValidator.getAllActivationCodesForAdminValidator ,
    gameActivationController.getAllActivationCodesForAdmin   
)


export default router























