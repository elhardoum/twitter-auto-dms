import { Module } from '@nestjs/common'
import { DashController } from './dash.controller'

@Module({
  controllers: [DashController],
})
export class DashModule {}
