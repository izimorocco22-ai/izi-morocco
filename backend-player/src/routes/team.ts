import { Router } from 'express'
import auth from '../middlewares/auth/auth'
import { createTeam, getMyTeam } from '../controllers/team'

const router = Router()

router.get('/me', auth('P', 'A'), getMyTeam)
router.post('/', auth('P', 'A'), createTeam)

export default router

