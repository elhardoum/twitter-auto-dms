import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.locals.logged_in = false

    const { sid } = req.signedCookies

    if (sid) {
      const profile = await this.authService.getProfileBySessionId(sid)

      if (profile) {
        res.locals.profile = profile
        res.locals.logged_in = true
      }
    }

    next()
  }
}
