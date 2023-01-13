import { Injectable, Logger } from '@nestjs/common'
import { MongoClient } from 'mongodb'

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name)

  async getMessages(
    page: number,
    pageSize = +process.env.MESSAGES_PER_PAGE || 20,
  ): Promise<WithPagesMeta<DirectMessage[]>> {
    const client = new MongoClient(process.env.MONGODB_URI)

    const items = await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const dms = db.collection<DirectMessage>('messages')
      resolve(
        await dms
          .find()
          .skip(page > 0 ? (page - 1) * pageSize : 0)
          .limit(pageSize + 1)
          .sort({ _id: -1 })
          .toArray(),
      )
    })
      .then((dms: DirectMessage[]) => dms)
      .catch((err) => void this.logger.error('getMessages error', err) || [])
      .finally(() => client.close())

    return {
      items: items.slice(0, pageSize).map((item) => ({
        ...item,
        sentDateIso: item.sentDate
          ? item.sentDate.toISOString().replace('T', ' ').substr(0, 19)
          : '',
      })),
      paged: {
        next: items.length > pageSize ? page + 1 : undefined,
        previous: page > 1 ? page - 1 : undefined,
      },
    }
  }
}
