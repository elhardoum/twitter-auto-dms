import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { tmpdir } from 'os'
import { join } from 'path'
import { MongoClient, ObjectId } from 'mongodb'
import { TwitterApi } from 'twitter-api-v2'
import { SettingsService } from './../settings/settings.service'

// eslint-disable-next-line
const lockfile = require('lockfile')

@Injectable()
export class FollowersService {
  private readonly logger = new Logger(FollowersService.name)

  constructor(private readonly settingsService: SettingsService) {}

  @Cron('* * * * *')
  async followersCron(): Promise<void> {
    const lock = join(tmpdir(), '/followers.lock')

    try {
      lockfile.lockSync(lock)
    } catch (err) {
      return
    }

    try {
      await this.#_followersCron()
    } catch (err) {
      this.logger.log('followersCron.error: ' + err)
    } finally {
      lockfile.unlockSync(lock)
    }
  }

  async #_followersCron(): Promise<void> {
    const users = await this.getSubscribedUsers()

    if (0 == users.length) return

    const schedules = await this.settingsService.getUserListSchedule(
      users.map((user) => user.userId),
    )

    for (let i = 0; i < users.length; i++) {
      const user = users[i]

      const schedule = schedules.get(user.userId)

      const client = this.getApiClient(user.accessToken, user.accessSecret)
      const pagiState =
        (await this.getListPaginationState(user.userId)) ||
        ({
          userId: user.userId,
        } as FollowersPaginationState)

      const { data = [] } =
        (await client.v2.followers(user.userId, {
          max_results: 1000,
        })) || {}

      let newFollowers: FollowerUserObject[] = []

      if (pagiState.initialIndexCompleted) {
        if (pagiState.inPageCursor) {
          const index = data.findIndex(
            (user) => user.id == pagiState.inPageCursor,
          )

          if (index != -1) {
            newFollowers = data.slice(0, index)
          } else {
            newFollowers = []
          }
        } else {
          newFollowers = data
        }
      }

      // push pending dms if auto-dms is enabled
      if (schedule.enabled && 0 != newFollowers.length) {
        await this.insertDms(
          newFollowers.map(
            (follower) =>
              ({
                senderId: user.userId,
                senderScreenName: user.screenName,
                recipientId: follower.id,
                recipientScreenName: follower.username,
                status: DmStatus.Pending,
                message: schedule.format
                  .replace(new RegExp('{{screenName}}', 'g'), follower.username)
                  .replace(new RegExp('{{name}}', 'g'), follower.name),
                sendAt: (() => {
                  const now = +new Date()

                  switch (schedule.schedule_unit) {
                    case UserScheduleUnit.Minute:
                      return new Date(now + schedule.schedule * 60 * 1000)

                    case UserScheduleUnit.Hour:
                      return new Date(now + schedule.schedule * 3600 * 1000)

                    case UserScheduleUnit.Day:
                      return new Date(now + schedule.schedule * 86400 * 1000)

                    default:
                      return new Date()
                  }
                })(),
              } as DirectMessage),
          ),
        )
      }

      // mark indexing as completed
      pagiState.initialIndexCompleted = true
      // persist page cursor for future calls to locate new followers
      pagiState.inPageCursor = data.length > 0 ? data[0].id : null

      await this.setListPaginationState(pagiState)
    }
  }

  async getSubscribedUsers(userIds?: string[]): Promise<AuthProfile[]> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const users = db.collection<AuthProfile>('users')
      resolve(
        await users
          .find(
            Object.assign(
              {
                accessSecret: { $exists: true },
                accessToken: { $exists: true },
              },
              userIds
                ? {
                    userId: { $in: userIds },
                  }
                : {},
            ),
          )
          .toArray(),
      )
    })
      .then((users: AuthProfile[]) => users)
      .catch(
        (err) => void this.logger.error('getSubscribedUsers error', err) || [],
      )
      .finally(() => client.close())
  }

  async getListPaginationState(
    userId: string,
  ): Promise<FollowersPaginationState> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const pages = db.collection<FollowersPaginationState>('pages')
      const item = await pages.findOne({ userId })
      resolve(item && item._id ? item : undefined)
    })
      .then((state?: FollowersPaginationState) => state)
      .catch(
        (err) =>
          void this.logger.error('getListPaginationState error', err) ||
          undefined,
      )
      .finally(() => client.close())
  }

  async setListPaginationState(
    state: FollowersPaginationState,
  ): Promise<boolean> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const pages = db.collection<FollowersPaginationState>('pages')
      const item = await this.getListPaginationState(state.userId)

      if (item) {
        const { matchedCount } = await pages.updateOne(
          { userId: item.userId },
          { $set: state },
        )
        resolve(matchedCount > 0)
      } else {
        const { insertedId } = await pages.insertOne(state)
        resolve(!!insertedId)
      }
    })
      .then((result: boolean) => result)
      .catch(
        (err) =>
          void this.logger.error('setListPaginationState error', err) || false,
      )
      .finally(() => client.close())
  }

  async persistDm(dm: DirectMessage): Promise<boolean> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const dms = db.collection('messages')

      if (dm._id) {
        const { matchedCount } = await dms.updateOne(
          { _id: dm._id },
          { $set: dm },
        )
        resolve(matchedCount > 0)
      } else {
        const { insertedId } = await dms.insertOne(dm)
        resolve(!!insertedId)
      }
    })
      .then((result: boolean) => result)
      .catch((err) => void this.logger.error('persistDm error', err) || false)
      .finally(() => client.close())
  }

  async insertDms(dms: DirectMessage[]): Promise<ObjectId[]> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const coll = db.collection('messages')
      const { insertedIds } = await coll.insertMany(dms)
      resolve(Object.values(insertedIds))
    })
      .then((insertIds: ObjectId[]) => insertIds)
      .catch((err) => void this.logger.error('insertDms error', err) || [])
      .finally(() => client.close())
  }

  async getPendingDms(
    limit: number,
    onlyDue = false,
  ): Promise<DirectMessage[]> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const dms = db.collection<DirectMessage>('messages')
      resolve(
        await dms
          .find(
            Object.assign(
              {
                status: { $eq: DmStatus.Pending },
              },
              onlyDue ? { sendAt: { $lt: new Date() } } : {},
            ),
          )
          .sort({ sendAt: 1 })
          .limit(limit)
          .toArray(),
      )
    })
      .then((dms: DirectMessage[]) => dms)
      .catch((err) => void this.logger.error('getPendingDms error', err) || [])
      .finally(() => client.close())
  }

  getApiClient(accessToken: string, accessSecret: string): TwitterApi {
    return new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_KEY_SECRET,
      accessToken,
      accessSecret,
    })
  }

  @Cron('* * * * *')
  async dmsCron(): Promise<void> {
    const lock = join(tmpdir(), '/dms.lock')

    try {
      lockfile.lockSync(lock)
    } catch (err) {
      return
    }

    try {
      await this.#_dmsCron()
    } catch (err) {
      this.logger.log('dmsCron.error: ' + err)
    } finally {
      lockfile.unlockSync(lock)
    }
  }

  async #_dmsCron(): Promise<void> {
    const dms = await this.getPendingDms(
      +process.env.DMS_API_BATCH_SIZE || 10,
      true,
    )

    if (0 == dms.length) {
      return
    }

    const users = await this.getSubscribedUsers(dms.map((dm) => dm.senderId))

    for (let i = 0; i < dms.length; i++) {
      const dm = dms[i]
      const user = users.find((u) => u.userId == dm.senderId)

      if (user && user.accessToken && user.accessSecret) {
        const client = this.getApiClient(user.accessToken, user.accessSecret)
        let sent = false

        try {
          const res = await client.v2.post(
            'dm_conversations/with/:participant_id/messages',
            {
              text: dm.message,
            },
            { params: { participant_id: dm.recipientId } },
          )

          sent = !!res?.data?.dm_event_id
        } catch (err) {
          this.logger.error('sendDmToParticipant error', err)
        }

        if (sent) {
          dm.status = DmStatus.Sent
          dm.sentDate = new Date()
        } else {
          dm.status = DmStatus.Error
        }

        await this.persistDm(dm)
      } else {
        // mark as won't send
        dm.status = DmStatus.Error
        await this.persistDm(dm)
      }
    }
  }
}
