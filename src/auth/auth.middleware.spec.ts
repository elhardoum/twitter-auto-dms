import { AuthMiddleware } from './auth.middleware'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'

describe('AuthMiddleware', () => {
  const service = new AuthService()
  const middleware = new AuthMiddleware(service)

  beforeAll(() => {
    process.env.MONGODB_URI = process.env.MONGO_URL
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(middleware).toBeDefined()
  })

  it('should be working', async () => {
    const res = {
      locals: {},
    } as unknown as Response

    const req = {
      signedCookies: {},
    } as unknown as Request

    const next = jest.fn()

    await middleware.use(req, res, next)
    expect(res.locals.logged_in).toBe(false)
    expect(next).toBeCalled()

    req.signedCookies.sid = 'session-1'
    await middleware.use(req, res, next)
    expect(res.locals.logged_in).toBe(false)
    expect(next).toBeCalled()

    const profile = {
      accessSecret: 'accessSecret',
      accessToken: 'accessToken',
      userId: '12345',
      screenName: 'test',
      sessId: await service.getRandomSessionId(),
    } as AuthProfile

    await service.persistProfile(profile)

    req.signedCookies.sid = profile.sessId
    await middleware.use(req, res, next)
    expect(res.locals.logged_in).toBe(true)
    expect(res.locals.profile).toBeTruthy()
    expect(res.locals.profile.userId).toBe(profile.userId)
    expect(next).toBeCalled()
  })
})
