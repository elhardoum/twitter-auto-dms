import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { join } from 'path'
import { NestExpressApplication } from '@nestjs/platform-express'
import * as cookieParser from 'cookie-parser'

// eslint-disable-next-line
const hbs = require('hbs')

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  app.useStaticAssets(join(__dirname, '..', 'public'))
  app.setBaseViewsDir(join(__dirname, '..', 'views'))
  app.setViewEngine('hbs')

  app.disable('x-powered-by')

  app.use(cookieParser(process.env.COOKIE_SECRET))

  // configure hbs custom blocks
  const blocks: { [key: string]: string[] } = {}

  hbs.registerHelper(
    'extend',
    function (name: string, context: { fn: (arg0: typeof hbs) => string }) {
      let block = blocks[name]
      if (!block) block = blocks[name] = []
      block.push(context.fn(this))
    },
  )

  hbs.registerHelper('block', function (name: string) {
    const val = (blocks[name] || []).join('\n')
    blocks[name] = [] // clear the block
    return val
  })

  hbs.registerHelper(
    'ifeq',
    function (arg1: string, arg2: string, options: typeof hbs) {
      return arg1 == arg2 ? options.fn(this) : options.inverse(this)
    },
  )

  const port: number = +process.env.HTTP_PORT || 3000
  await app.listen(port, null, () => console.log(`Listening on port ${port}`))
}

bootstrap()
