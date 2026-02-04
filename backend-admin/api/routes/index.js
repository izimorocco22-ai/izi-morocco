import express from 'express'

import authRoutes from '../routes/auth.routes.js'
import uploadRoutes from '../routes/upload.routes.js'
import userRoutes from './user.routes.js'
import userGroupRoutes from './user-groups.routes.js'
import questionRoutes from './questions.routes.js'
import questionsSettingsRoutes from './questions-settings.routes.js'
import questionMediaRoutes from './questions-media.routes.js'
import questionCommentsRoutes from './question-comments.routes.js'
import tagsRoutes from './tags.routes.js'
import puzzleRoutes from './puzzle.routes.js'
import gameInfo from './game-info.routes.js'
import gameQuestions from './game-questions.routes.js'
import gameActivationRoutes from './game-activation.routes.js'
import playerRoutes from './player.routes.js'
import dashboardRoutes from './dashboard.routes.js'

const v1Routes = express.Router()
const router = express.Router()

v1Routes.use('/auth', authRoutes)
v1Routes.use('/upload', uploadRoutes)
v1Routes.use('/users', userRoutes)
v1Routes.use('/user-groups', userGroupRoutes)
v1Routes.use('/questions', questionRoutes)
v1Routes.use('/question-settings', questionsSettingsRoutes)
v1Routes.use('/question-media', questionMediaRoutes)
v1Routes.use('/question-comments', questionCommentsRoutes)
v1Routes.use('/tags', tagsRoutes)
v1Routes.use('/game-info', gameInfo)
v1Routes.use('/puzzle', puzzleRoutes)
v1Routes.use('/game-questions', gameQuestions)
v1Routes.use('/game-activation', gameActivationRoutes)
v1Routes.use('/player-admin', playerRoutes)
v1Routes.use('/dashboard', dashboardRoutes)



router.use('/api/v1', v1Routes)

export default router
