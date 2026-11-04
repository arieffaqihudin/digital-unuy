import mongoose from 'mongoose'

let connectionPromise: Promise<typeof mongoose> | null = null

export async function connectDb() {
  if (connectionPromise) return connectionPromise

  const config = useRuntimeConfig()
  mongoose.set('strictQuery', true)

  connectionPromise = mongoose
    .connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10
    })
    .catch((error) => {
      connectionPromise = null
      console.error('[database] connection failed', error?.message || error)
      throw createError({ statusCode: 503, statusMessage: 'Database belum dapat dihubungi.' })
    })

  return connectionPromise
}

export function isObjectId(value: unknown): boolean {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)
}
