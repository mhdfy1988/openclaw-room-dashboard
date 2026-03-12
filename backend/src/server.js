import { createApp } from './app/create-app.js'

const host = process.env.HOST ?? '127.0.0.1'
const port = Number(process.env.PORT ?? 4310)

const app = await createApp({ prod: false })

try {
  await app.listen({ host, port })
  app.log.info(`room-dashboard dev backend running on http://${host}:${port}`)
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
