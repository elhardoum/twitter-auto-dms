import { Test, TestingModule } from '@nestjs/testing'
import { MessagesController } from './messages.controller'
import { MessagesService } from './messages.service'
import { Response } from 'express'

describe('MessagesController', () => {
  let controller: MessagesController
  let service: MessagesService

  beforeAll(() => {
    process.env.MONGODB_URI = process.env.MONGO_URL
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [MessagesService],
    }).compile()

    controller = module.get<MessagesController>(MessagesController)
    service = module.get<MessagesService>(MessagesService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
    expect(service).toBeDefined()
  })

  it('lists user messages', async () => {
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
    expect(res.render).toHaveBeenCalledWith('dashboard/messages', {
      logged_in: res.locals.logged_in,
      profile: res.locals.profile,
      ...(await service.getMessages(res.locals.profile.userId, 1)),
      page: 1,
    })

    await controller.paged(res, 2)
    expect(res.render).toHaveBeenCalledWith('dashboard/messages', {
      logged_in: res.locals.logged_in,
      profile: res.locals.profile,
      ...(await service.getMessages(res.locals.profile.userId, 2)),
      page: 2,
    })
  })
})
