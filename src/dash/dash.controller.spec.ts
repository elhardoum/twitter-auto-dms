import { Test, TestingModule } from '@nestjs/testing'
import { DashController } from './dash.controller'
import { Response } from 'express'

describe('DashController', () => {
  let controller: DashController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashController],
    }).compile()

    controller = module.get<DashController>(DashController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('DashController.index()', () => {
    const res = {
      locals: {},
      render: jest.fn(),
    } as unknown as Response

    controller.index(res)
    expect(res.render).toHaveBeenCalledWith(
      'dashboard/index',
      expect.anything(),
    )
  })
})
