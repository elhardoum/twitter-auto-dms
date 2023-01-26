import { Test, TestingModule } from '@nestjs/testing'
import { FollowersService } from './followers.service'
import { SettingsService } from './../settings/settings.service'

describe('FollowersService', () => {
  let service: FollowersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FollowersService, SettingsService],
    }).compile()

    service = module.get<FollowersService>(FollowersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
