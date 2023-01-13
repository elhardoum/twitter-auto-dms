import { Module, MiddlewareConsumer } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { HomeModule } from './home/home.module'
import { AuthModule } from './auth/auth.module'
import { AuthMiddleware } from './auth/auth.middleware'
import { AuthRedirectMiddleware } from './auth/authRedirect.middleware'
import { AuthService } from './auth/auth.service'
import { DashModule } from './dash/dash.module'
import { SettingsModule } from './settings/settings.module'
import { FollowersService } from './followers/followers.service'
import { SettingsService } from './settings/settings.service'
import { MessagesModule } from './messages/messages.module'

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    HomeModule,
    AuthModule,
    DashModule,
    SettingsModule,
    MessagesModule,
  ],
  providers: [AuthService, SettingsService, FollowersService],
  controllers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('*')
    consumer.apply(AuthRedirectMiddleware).forRoutes('/dash')
  }
}
