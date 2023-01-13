import { Injectable, Logger } from '@nestjs/common'
import { MongoClient } from 'mongodb'

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name)

  async updateUserSchedule(schedule: UserSchedule): Promise<boolean> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const schedules = db.collection('schedules')

      const item = await schedules.findOne({ userId: schedule.userId })

      if (item && item._id) {
        const { matchedCount } = await schedules.updateOne(
          { _id: item._id },
          { $set: schedule },
        )
        resolve(matchedCount > 0)
      } else {
        const { insertedId } = await schedules.insertOne(schedule)
        resolve(!!insertedId)
      }
    })
      .then((result: boolean) => result)
      .catch(
        (err) => (this.logger.error('updateUserSchedule error', err), false),
      )
      .finally(() => client.close())
  }

  async getUserSchedule(userId: string): Promise<UserSchedule> {
    const schedules = await this.getUserListSchedule([userId])
    return schedules.get(userId)
  }

  async getUserListSchedule(
    userIds: string[],
  ): Promise<Map<string, UserSchedule>> {
    const client = new MongoClient(process.env.MONGODB_URI)

    const results: UserSchedule[] = await new Promise<UserSchedule[]>(
      async (resolve) => {
        await client.connect()
        const db = client.db(process.env.MONGODB_DBNAME)
        const schedules = db.collection<UserSchedule>('schedules')
        resolve(
          await schedules
            .find({
              userId: {
                $in: userIds,
              },
            })
            .toArray(),
        )
      },
    )
      .then((results: UserSchedule[]) => results)
      .catch(
        (err) => void this.logger.error('getUserListSchedule error', err) || [],
      )
      .finally(() => client.close())

    const schedules = new Map<string, UserSchedule>()

    for (let i = 0; i < userIds.length; i++) {
      const schedule = results.find((x) => x.userId == userIds[i])

      if (schedule) {
        schedule.schedule = +schedule.schedule
      }

      schedules.set(
        userIds[i],
        schedule ||
          ({
            // default schedule
            schedule: 1,
            schedule_unit: UserScheduleUnit.Minute,
            format: 'Thank you for following, @{{screenName}}!',
            enabled: true,
            userId: userIds[i],
          } as UserSchedule),
      )
    }

    return schedules
  }
}
