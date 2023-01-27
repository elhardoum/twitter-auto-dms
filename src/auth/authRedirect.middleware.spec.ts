import { AuthRedirectMiddleware } from './authRedirect.middleware'
import { Request, Response } from 'express'

describe('AuthRedirectMiddleware', () => {
  const middleware = new AuthRedirectMiddleware()

  it('should be defined', () => {
    expect(middleware).toBeDefined()
  })

  it('should be working', async () => {
    const res = {
      locals: {
        logged_in: false,
      },
      redirect: jest.fn(),
    } as unknown as Response

    const req = {} as unknown as Request
    const next = jest.fn()

    await middleware.use(req, res, next)
    expect(next).not.toBeCalled()
    expect(res.redirect).toBeCalledWith('/')

    res.locals.logged_in = true
    await middleware.use(req, res, next)
    expect(next).toBeCalled()
  })
})
