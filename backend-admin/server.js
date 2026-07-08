import 'dotenv/config.js'
import './config/startup.js'

import bodyParser from 'body-parser'
import chalk from 'chalk'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import expressRateLimit from 'express-rate-limit'
import expressSession from 'express-session'
import helmet from 'helmet'
import httpStatus from 'http-status'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

// import { verifyAWSConnection } from './api/controllers/upload.controller.js'
import v1Routes from './api/routes/index.js'
import buildErrorObject from './api/utils/buildErrorObject.js'
import init from './config/mongo.js'
import sessionManager from './config/sessionManager.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const api = express()
api.set("trust proxy", 1);


const rateLimit = expressRateLimit({
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  limit: 40,
  message: 'TOO_MANY_REQUESTS',
  windowMs: 10 * 60 * 1000,
})

const startServer = (dbStatus) => {


  // verifyAWSConnection()


  api.use(bodyParser.json({ limit: '32mb' }))
  api.use(bodyParser.urlencoded({ limit: '32mb', extended: false }))
  api.use(cookieParser())
  const originsEnv = process.env.CORS_ORIGINS || ''
  const allowedOrigins = [
    'http://localhost:5173',
    'https://izi-morocco-delta.vercel.app',
    process.env.FRONTEND_URL,
    ...originsEnv.split(',').map((s) => s.trim()).filter(Boolean),
  ].filter(Boolean)

  console.log('Allowed Origins:', allowedOrigins);

  api.use(
    cors({
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      methods: ['POST', 'GET', 'PATCH', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
      origin: (origin, cb) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return cb(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
          return cb(null, true);
        } else {
          console.log('CORS blocked origin:', origin);
          return cb(new Error('Not allowed by CORS'));
        }
      },
      optionsSuccessStatus: 200,
    }),
  )

  api.use('/public', express.static(path.join(__dirname, 'public')))



  api.use(helmet({
    crossOriginResourcePolicy: false,
  }))
  api.use(morgan('dev'))


  api.use('', v1Routes)

  api.get('/', (_req, res) =>
    res
      .status(httpStatus.OK)
      .sendFile(path.join(__dirname, './pages/index.html')),
  )

  api.all('*', (_req, res) =>
    res
      .status(httpStatus.NOT_FOUND)
      .json(buildErrorObject(httpStatus.NOT_FOUND, 'URL_NOT_FOUND')),
  )

  const PORT = process.env.PORT || 8080
  const server = api.listen(PORT, '0.0.0.0', () => {
    const port = server.address().port
    console.log(chalk.cyan.bold('********************************'))
    console.log(chalk.green.bold('   🚀 Server Information 🚀'))
    console.log(chalk.cyan.bold('********************************'))
    console.log(chalk.yellow.bold('Api Name:    IZIMorocco Admin Backend'))
    console.log(chalk.yellow.bold(`Port:        ${port}`))
    console.log(chalk.yellow.bold(`Database:    ${dbStatus}`))
    console.log(chalk.cyan.bold('********************************'))
    console.log(chalk.green.bold('🚀 Server is up and running! 🚀'))
    console.log(chalk.cyan.bold('********************************'))
  })
}

// Open the HTTP port immediately so the platform (Render) always detects it,
// then connect to the DB in the background. A DB failure is logged, not fatal.
startServer('connecting...')

init()
  .then((dbStatus) => console.log(chalk.yellow.bold(`Database:    ${dbStatus}`)))
  .catch((err) => console.log('Database init failed:', err))

// For testing
export default api
