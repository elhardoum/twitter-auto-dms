import { Test, TestingModule } from '@nestjs/testing'
import { SettingsController } from './settings.controller'
import { SettingsService } from './settings.service'
import { Response } from 'express'

describe('SettingsController', () => {
  let controller: SettingsController
  let service: SettingsService

  beforeAll(() => {
    process.env.MONGODB_URI = process.env.MONGO_URL
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [SettingsService],
    }).compile()

    controller = module.get<SettingsController>(SettingsController)
    service = module.get<SettingsService>(SettingsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(service).toBeDefined()
  })

  it('renders settings page', async () => {
    const res = {
      locals: {
        logged_in: true,
        profile: {
          userId: '123',
        },
      },
      render: jest.fn(),
    } as unknown as Response

    await controller.index(res)
    expect(res.render).toHaveBeenCalledWith('dashboard/settings', {
      logged_in: res.locals.logged_in,
      errors: undefined,
      formdata: await service.getUserSchedule(res.locals.profile.userId),
    })
  })

  it('submits user settings', async () => {
    const res = {
      locals: {
        logged_in: true,
        profile: {
          userId: '123',
        },
      },
      render: jest.fn(),
    } as unknown as Response

    const postdata = {
      schedule: '',
      schedule_unit: '',
      format: 'Thanks for following =)',
      enabled: 1,
    }

    await controller.submit(postdata, res)

    let schedule = await service.getUserSchedule(res.locals.profile.userId)

    expect(schedule.format).not.toBe(postdata.format)

    postdata.schedule = '1'
    postdata.schedule_unit = UserScheduleUnit.Day

    await controller.submit(postdata, res)

    schedule = await service.getUserSchedule(res.locals.profile.userId)

    expect(schedule.format).toBe(postdata.format)
    expect(schedule.schedule).toBe(+postdata.schedule)
    expect(schedule.enabled).toBeTruthy()
    expect(schedule.userId).toBe(res.locals.profile.userId)
  })
})
