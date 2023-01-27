import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { Request, Response } from 'express'
import { TwitterApi } from 'twitter-api-v2'

describe('AuthController', () => {
  let controller: AuthController
  let service: AuthService

  beforeAll(() => {
    process.env.MONGODB_URI = process.env.MONGO_URL
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('redirects to sso page', async () => {
    const res = {
      cookie: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    const req = {
      protocol: 'https',
      get: jest.fn(),
    } as unknown as Request

    const mock = {
      generateAuthLink: jest.fn(() => Promise.resolve({ data: {} })),
    } as unknown as TwitterApi

    jest.spyOn(service, 'getApiClient').mockImplementation(() => mock)

    await controller.redirect(req, res)
    expect(res.cookie).toHaveBeenCalledWith('oauth_sec', undefined, {
      signed: true,
      path: 'auth',
      httpOnly: true,
    })
    expect(res.redirect).toHaveBeenCalled()
  })

  it('perform oauth callback', async () => {
    const res = {
      status: jest.fn(() => res),
      end: jest.fn(),
      redirect: jest.fn(),
      cookie: jest.fn(),
    } as unknown as Response

    const req = {
      signedCookies: { oauth_sec: 'OAUTH-SEC' },
    } as unknown as Request

    const profile = {
      userId: '123456',
      screenName: 'jesse',
    } as AuthProfile

    const mock = {
      getUserAuthProfile: jest.fn(() => Promise.resolve({ data: profile })),
      login: jest.fn(() => Promise.resolve(profile)),
    } as unknown as TwitterApi

    jest.spyOn(service, 'getApiClient').mockImplementation(() => mock)

    process.env.AUTHORIZED_HANDLES = 'jack'

    await controller.callback(req, res, '', '')
    expect(res.status).toBeCalledWith(403)

    process.env.AUTHORIZED_HANDLES = ''
    await controller.callback(req, res, '', '')
    expect(res.cookie).toBeCalledWith('sid', expect.anything(), {
      signed: true,
      httpOnly: true,
    })
    expect(res.redirect).toBeCalledWith('/')
  })

  it('signs out', async () => {
    const res = {
      locals: {},
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    await controller.signout(res)

    expect(res.clearCookie).toBeCalledWith('sid', {
      signed: true,
      httpOnly: true,
    })

    expect(res.redirect).toBeCalledWith('/')
  })
})
