import config from '../config'
import mongoose from 'mongoose'
import loadModels from './helper/loadModals'

const mongoURL = config.mongodb.MONGO_URI

// Guard against a missing URI so the import can't throw synchronously and
// prevent the HTTP server from ever binding its port.
if (!mongoURL) {
  console.log('MONGO_URI is not set — starting without a database connection.')
} else {
  mongoose
    .connect(mongoURL)
    .then(() => {
      loadModels()
      console.log('mongoDb Connected')
    })
    .catch((e) => {
      console.log(e)
    })
}

const mongoDB = mongoose.connection

export default mongoDB
