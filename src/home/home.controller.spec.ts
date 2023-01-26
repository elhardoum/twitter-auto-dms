import { Test, TestingModule } from '@nestjs/testing'
import { HomeController } from './home.controller'
import { HomeService } from './home.service'
import { Response } from 'express'

describe('HomeController', () => {
  let controller: HomeController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HomeController],
      providers: [HomeService],
    }).compile()

    controller = module.get<HomeController>(HomeController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('HomeController.index()', () => {
    const res = {
      locals: {
        logged_in: true,
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    controller.index(res)
    expect(res.redirect).toHaveBeenCalledWith('/dash')

    res.locals.logged_in = false
    controller.index(res)
    expect(res.render).toHaveBeenCalled()
  })
})
