import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller('dash')
export class DashController {
  @Get()
  index(@Res() res: Response) {
    return res.render('dashboard/index', {
      logged_in: res.locals.logged_in,
      profile: res.locals.profile,
    })
  }
}
