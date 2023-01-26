import { Test, TestingModule } from '@nestjs/testing'
import { HomeService } from './home.service'

describe('HomeService', () => {
  let service: HomeService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeService],
    }).compile()

    service = module.get<HomeService>(HomeService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('testEnvironmentVariables()', () => {
    expect(service.testEnvironmentVariables()).toBe(false)
    process.env.TWITTER_API_KEY = 'ABC'
    process.env.TWITTER_API_KEY_SECRET = 'XYZ'
    expect(service.testEnvironmentVariables()).toBe(true)
  })
})
