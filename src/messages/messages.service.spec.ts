import { Test, TestingModule } from '@nestjs/testing'
import { MessagesService } from './messages.service'

describe('MessagesService', () => {
  let service: MessagesService

  beforeAll(() => {
    process.env.MONGODB_URI = process.env.MONGO_URL
  })

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessagesService],
    }).compile()

    service = module.get<MessagesService>(MessagesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('return user messages', async () => {
    const user = {
      userId: '123',
    }

    let messages = await service.getMessages(user.userId, 1, 5)

    expect(messages.items).toStrictEqual([])
    expect(messages.paged).toBeInstanceOf(Object)
    expect(messages.paged.next).toBe(undefined)
    expect(messages.paged.previous).toBe(undefined)

    messages = await service.getMessages(user.userId, 2, 5)

    expect(messages.paged.previous).toBe(1)
  })
})
