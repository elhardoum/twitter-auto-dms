import { AuthMiddleware } from './auth.middleware'
import { AuthService } from './auth.service'

describe('AuthMiddleware', () => {
  it('should be defined', () => {
    expect(new AuthMiddleware(new AuthService())).toBeDefined()
  })
})
