import { Controller, Get, Res, Param } from '@nestjs/common'
import { Response } from 'express'
import { MessagesService } from './messages.service'

@Controller('dash')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  async view(@Res() res: Response, page = 1): Promise<void> {
    const data = await this.messagesService.getMessages(
      res.locals.profile.userId,
      page,
    )

    return res.render('dashboard/messages', {
      logged_in: res.locals.logged_in,
      profile: res.locals.profile,
      ...data,
      page,
    })
  }

  @Get('dms')
  index(@Res() res: Response) {
    return this.view(res)
  }

  @Get('dms/:page')
  paged(@Res() res: Response, @Param('page') page: number) {
    return this.view(res, +page > 0 ? +page : 1)
  }
}
