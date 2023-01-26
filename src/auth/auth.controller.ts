import { Controller, Get, Req, Res, Query } from '@nestjs/common'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('redirect')
  async redirect(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const redirect = await this.authService.getRedirectObject(
      process.env.OAUTH_REDIRECT_URL ||
        `${req.protocol}://${req.get('Host')}/auth/callback`,
    )

    res.cookie('oauth_sec', redirect.oauth_token_secret, {
      signed: true,
      path: 'auth',
      httpOnly: true,
    })

    return res.redirect(redirect.url)
  }

  @Get('callback')
  async callback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('oauth_token') oauth_token: string,
    @Query('oauth_verifier') oauth_verifier: string,
  ): Promise<Response | void> {
    const { oauth_sec: oauth_token_secret } = req.signedCookies

    const profile = await this.authService.getUserAuthProfile(
      oauth_token,
      oauth_verifier,
      oauth_token_secret,
    )

    if (!profile || undefined === profile.userId) {
      return res.status(400).end()
    }

    const authorized_handles = this.authService.getAuthorizedHandles()

    // check if profile handle is whitelisted to use the service
    if (
      authorized_handles.length > 0 &&
      -1 == authorized_handles.indexOf(profile.screenName.toLocaleLowerCase())
    ) {
      return res
        .status(403)
        .end(`@${profile.screenName} is not authorized to use this service.`)
    }

    profile.sessId = this.authService.getRandomSessionId()

    if (await this.authService.persistProfile(profile)) {
      res.cookie('sid', profile.sessId, {
        signed: true,
        httpOnly: true,
      })

      return res.redirect('/')
    }

    return res.status(500)
  }

  @Get('signout')
  async signout(@Res() res: Response) {
    if (res.locals.logged_in) {
      await this.authService.clearProfileSession(res.locals.profile)
    }

    res.clearCookie('sid', {
      signed: true,
      httpOnly: true,
    })

    return res.redirect('/')
  }
}
