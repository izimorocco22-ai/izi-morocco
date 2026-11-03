import { Router } from 'express'
import { makeOptionalFields, validateReq } from '../middlewares/validate'
import { deleteMyAccount, editPlayer, viewPlayer } from '../controllers/player'
import auth from '../middlewares/auth/auth'
import { playerValidatorsMap } from '../validators/player'

const router = Router()

router.get('/me', auth('P', 'A'), viewPlayer)

router.delete('/me', auth('P', 'A'), deleteMyAccount)

router.put(
  '/update',
  auth('P', 'A'),
  validateReq(
    makeOptionalFields(playerValidatorsMap, ['name', 'phone', 'profileImage'])
  ),
  editPlayer
)

export default router
