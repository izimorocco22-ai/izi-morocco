import express from 'express'
import { requireAuth } from '../middlewares/auth.middleware.js'
import { generalLimiter } from '../helpers/rateLimitter.js'
import { checkPermission } from '../middlewares/check-permission.middleware.js'
import { PERMISSIONS } from '../utils/permissions.js'
import {
  getAllTeamsController,
  getTeamWithPlayersController
} from '../controllers/team.controller.js'

const router = express.Router()

router.use(requireAuth)
router.use(generalLimiter)

router.get(
  '/',
  checkPermission(PERMISSIONS.GAMES.READ),
  getAllTeamsController
)

router.get(
  '/:id',
  checkPermission(PERMISSIONS.GAMES.READ),
  getTeamWithPlayersController
)

export default router

