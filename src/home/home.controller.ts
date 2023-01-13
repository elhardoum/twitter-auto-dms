import { Controller, Get, Res } from '@nestjs/common'
import { Response } from 'express'
import { HomeService } from './home.service'

@Controller()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  index(@Res() res: Response): void {
    if (res.locals.logged_in) {
      return res.redirect('/dash')
    }

    return res.render('home', {
      logged_in: res.locals.logged_in,
      title: 'Home',
      envTested: this.homeService.testEnvironmentVariables(),
    })
  }
}
