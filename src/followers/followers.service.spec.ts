import { Test, TestingModule } from '@nestjs/testing'
import { FollowersService } from './followers.service'
import { SettingsService } from './../settings/settings.service'
import { AuthService } from './../auth/auth.service'
import { TwitterApi } from 'twitter-api-v2'

describe('FollowersService', () => {
  let service: FollowersService
  let authService: AuthService
  let settingsService: SettingsService

  beforeAll(() => {
    process.env.MONGODB_URI = process.env.MONGO_URL
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowersService, SettingsService, AuthService],
    }).compile()

    service = module.get<FollowersService>(FollowersService)
    authService = module.get<AuthService>(AuthService)
    settingsService = module.get<SettingsService>(SettingsService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should persist pagination state', async () => {
    const pagiState = {} as FollowersPaginationState
    pagiState.initialIndexCompleted = true
    pagiState.userId = '1234567'
    await service.setListPaginationState(pagiState)

    const persisted = await service.getListPaginationState(pagiState.userId)

    expect(persisted.initialIndexCompleted).toBe(true)
    expect(persisted.inPageCursor).toBe(undefined)
  })

  it('should fetch new followers via cron and save dms', async () => {
    const profile = {
      accessSecret: 'accessSecret',
      accessToken: 'accessToken',
      userId: '1234567',
      screenName: 'test',
      sessId: await authService.getRandomSessionId(),
    } as AuthProfile

    await authService.persistProfile(profile)

    expect((await service.getSubscribedUsers()).length).toBeGreaterThanOrEqual(
      1,
    )

    // set user schedule to send immediately
    const schedule = await settingsService.getUserSchedule(profile.userId)
    schedule.schedule = 0
    await settingsService.updateUserSchedule(schedule)

    const mock = {
      v2: {
        followers: jest.fn((userId: string) =>
          Promise.resolve({
            data:
              profile.userId != userId
                ? []
                : [
                    {
                      name: 'Jesse',
                      username: 'diesel',
                      id: '10001',
                    },
                    {
                      name: 'Walter',
                      username: 'the1whoknocks',
                      id: '10002',
                    },
                    {
                      name: 'Bogdan',
                      username: 'bogdan',
                      id: '10003',
                    },
                    {
                      name: "Bogdan's Eyebrows",
                      username: 'eyebrows',
                      id: '10004',
                    },
                  ],
          }),
        ),
      },
    } as unknown as TwitterApi

    jest.spyOn(service, 'getApiClient').mockImplementation(() => mock)

    await service.followersCron()

    expect(mock.v2.followers).toHaveBeenCalled()

    const pending = await service.getPendingDms(10)

    expect(pending.length).toBe(4)
    expect(pending.map((msg) => msg.senderId)).toStrictEqual(
      new Array(4).fill(profile.userId),
    )
  })

  it('should update dms', async () => {
    const [dm] = await service.getPendingDms(1)

    dm.status = DmStatus.Error
    await service.persistDm(dm)

    const pending = await service.getPendingDms(10)
    expect(pending.length).toBe(3)
  })

  it('should send dms via cron', async () => {
    expect((await service.getPendingDms(10)).length).toBe(3)

    const mock = {
      v2: {
        post: jest.fn(() =>
          Promise.resolve({
            data: {
              dm_event_id: 'evt-123',
            },
          }),
        ),
      },
    } as unknown as TwitterApi

    jest.spyOn(service, 'getApiClient').mockImplementation(() => mock)

    await service.dmsCron()

    expect(mock.v2.post).toHaveBeenCalledWith(
      'dm_conversations/with/:participant_id/messages',
      expect.anything(),
      expect.anything(),
    )

    expect((await service.getPendingDms(10)).length).toBe(0)
  })
})
