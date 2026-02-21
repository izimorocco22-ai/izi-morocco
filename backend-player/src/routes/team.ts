import { Router } from 'express'
import auth from '../middlewares/auth/auth'
import {
  createTeam,
  getMyTeam,
  joinTeam,
  getTeamMembersForHost
} from '../controllers/team'

const router = Router()

router.get('/me', auth('P', 'A'), getMyTeam)
router.post('/', auth('P', 'A'), createTeam)
router.post('/join', auth('P', 'A'), joinTeam)
router.get('/members', auth('P', 'A'), getTeamMembersForHost)

export default router
