import { Test, TestingModule } from '@nestjs/testing'
import { AuthLinkObject } from 'src/interfaces/AuthLinkObject'
import { TwitterApi } from 'twitter-api-v2'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService

  beforeAll(() => {
    process.env.MONGODB_URI = process.env.MONGO_URL
    process.env.TWITTER_API_KEY = 'API-KEY'
    process.env.TWITTER_API_KEY_SECRET = 'API-KEY-SECRET'
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('returns list of whitelisted handles', () => {
    process.env.AUTHORIZED_HANDLES = '   , Jack,     jesse     walter'
    expect(service.getAuthorizedHandles()).toStrictEqual([
      'jack',
      'jesse',
      'walter',
    ])
  })

  it('returns the api client', () => {
    expect(service.getApiClient()).toBeInstanceOf(TwitterApi)

    const tokens = {
      accessToken: 'ACCESS-TOKEN',
      accessSecret: 'ACCESS-SECRET',
    }
    const client = service.getApiClient(tokens)
    const apiTokens = client.getActiveTokens() as Record<any, any>

    expect(apiTokens.accessToken).toBe(tokens.accessToken)
    expect(apiTokens.accessSecret).toBe(tokens.accessSecret)
    expect(apiTokens.appSecret).toBe(process.env.TWITTER_API_KEY_SECRET)
  })

  it('tests the api client', async () => {
    const mock = {
      generateAuthLink: jest.fn(),
      login: jest.fn(() => Promise.resolve({})),
    } as unknown as TwitterApi

    jest.spyOn(service, 'getApiClient').mockImplementation(() => mock)

    const redirect = await service.getRedirectObject('https://example.com')
    expect(mock.generateAuthLink).toHaveBeenCalledWith('https://example.com')

    await service.getUserAuthProfile('', 'verifier', '')
    expect(mock.login).toHaveBeenCalledWith('verifier')
  })

  it('tests profile data persistence', async () => {
    const profile = {
      accessSecret: 'accessSecret',
      accessToken: 'accessToken',
      userId: '1234',
      screenName: 'test',
      sessId: await service.getRandomSessionId(),
    } as AuthProfile

    expect(profile.sessId).toMatch(/^[0-9a-f-]{16,}$/i)

    expect(await service.getProfileBySessionId(profile.sessId)).toBe(undefined)

    await service.persistProfile(profile)

    const persisted = await service.getProfileBySessionId(profile.sessId)

    expect(persisted.userId).toBe(profile.userId)
    expect(persisted.screenName).toBe(profile.screenName)

    await service.clearProfileSession(persisted)
    expect(await service.getProfileBySessionId(profile.sessId)).toBe(undefined)
  })
})
