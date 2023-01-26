import { Test, TestingModule } from '@nestjs/testing'
import { SettingsService } from './settings.service'

describe('SettingsService', () => {
  let service: SettingsService

  beforeAll(async () => {
    process.env.MONGODB_URI = process.env.MONGO_URL
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService],
    }).compile()

    service = module.get<SettingsService>(SettingsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('mongodb data persistence', async () => {
    const sampleSchedule = {
      schedule: 1,
      schedule_unit: UserScheduleUnit.Minute,
      format: 'Thanks for following!',
      enabled: true,
      userId: '123',
    } as UserSchedule

    let schedule = await service.getUserSchedule('404')
    expect(schedule).toBeTruthy() // a default schedule is returned on 404s
    expect(schedule.format).not.toBe(sampleSchedule.format)
    expect(schedule.userId).toBe('404')

    await service.updateUserSchedule(sampleSchedule)

    schedule = await service.getUserSchedule('123')
    expect(schedule).toBeTruthy()
    expect(schedule.format).toBe(sampleSchedule.format)
    expect(schedule.userId).toBe('123')

    expect((await service.getUserListSchedule(['404', '123'])).size).toBe(2)
  })
})
