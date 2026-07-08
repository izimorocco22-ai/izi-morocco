import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import fileUpload from 'express-fileupload'
import './db'
import { errorHandler } from './utils/err'

import authRoutes from './routes/auth'
import playerRoutes from './routes/player'
import gamesRoutes from './routes/games'
import uploadRoutes from './routes/upload'
import teamRoutes from './routes/team'
import results from './routes/results'

const port = process.env.PORT || '3000'

const app = express()

//middlerware
app.set('trust proxy', true)
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: '10mb' }))
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}))
app.use(cors())
app.use(morgan('dev'))

//Setups Routes
app.get('/', (req, res) => {
  res.send('Server is up and running!')
})

app.use('/auth', authRoutes)
app.use('/player', playerRoutes)
app.use('/games', gamesRoutes)
app.use('/upload', uploadRoutes)
app.use('/result', results)
app.use('/team', teamRoutes)

app.use(errorHandler)

// Bind to 0.0.0.0 so the hosting platform (Render) can detect the open port.
app.listen(Number(port), '0.0.0.0', () => {
  console.log('server started on port:', port)
})
