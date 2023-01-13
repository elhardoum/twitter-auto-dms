import { AuthRedirectMiddleware } from './authRedirect.middleware'

describe('AuthRedirectMiddleware', () => {
  it('should be defined', () => {
    expect(new AuthRedirectMiddleware()).toBeDefined()
  })
})
