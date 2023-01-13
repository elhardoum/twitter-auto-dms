import { Controller, Get, Post, Res, Body } from '@nestjs/common'
import { Response } from 'express'
import { SettingsService } from './settings.service'

@Controller('dash')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  async index(
    @Res() res: Response,
    errors?: string[],
    formdata?: UserSchedule,
  ): Promise<void> {
    if (!formdata) {
      formdata = await this.settingsService.getUserSchedule(
        res.locals.profile.userId,
      )
    }

    return res.render('dashboard/settings', {
      logged_in: res.locals.logged_in,
      errors,
      formdata,
    })
  }

  @Post('settings')
  async submit(@Body() body, @Res() res: Response) {
    const { schedule, schedule_unit, format } = body

    const errors: string[] = []

    if (!schedule || 0 == schedule.trim().length)
      errors.push('Schedule cannot be empty.')

    if (
      !schedule_unit ||
      -1 ==
        [
          UserScheduleUnit.Minute,
          UserScheduleUnit.Hour,
          UserScheduleUnit.Day,
        ].indexOf(schedule_unit)
    )
      errors.push('Unknown schedule.')

    if (!format || 0 == format.trim().length)
      errors.push('Message format cannot be empty.')

    const userSchedule = {
      schedule,
      schedule_unit,
      format,
      enabled: !!body.enabled,
      userId: res.locals.profile.userId,
    } as UserSchedule

    if (0 == errors.length)
      await this.settingsService.updateUserSchedule(userSchedule)

    return this.index(res, errors, userSchedule)
  }
}
