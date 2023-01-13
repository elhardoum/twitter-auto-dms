import { Injectable } from '@nestjs/common'

@Injectable()
export class HomeService {
  testEnvironmentVariables(): boolean {
    return (
      process.env.TWITTER_API_KEY != undefined &&
      process.env.TWITTER_API_KEY_SECRET != undefined
    )
  }
}
