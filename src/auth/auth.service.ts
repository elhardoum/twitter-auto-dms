import { Injectable } from '@nestjs/common'
import { AuthLinkObject } from 'src/interfaces/AuthLinkObject'
import { LoginResult, TwitterApi } from 'twitter-api-v2'
import { MongoClient } from 'mongodb'

// eslint-disable-next-line
const uuid4 = require('uuid4')

@Injectable()
export class AuthService {
  getAuthorizedHandles(): string[] {
    return (process.env.AUTHORIZED_HANDLES || '')
      .replace(/\s/g, ',')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  }

  getApiClient(args?: { [key: string]: string }): TwitterApi {
    return new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_KEY_SECRET,
      ...args,
    })
  }

  async getRedirectObject(nextUrl: string): Promise<AuthLinkObject> {
    return await this.getApiClient().generateAuthLink(nextUrl)
  }

  async getUserAuthProfile(
    oauth_token: string,
    oauth_verifier: string,
    oauth_token_secret: string,
  ): Promise<AuthProfile> {
    const client = this.getApiClient({
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    })

    return await client
      .login(oauth_verifier)
      .then(
        ({ accessSecret, accessToken, userId, screenName }: LoginResult) => ({
          accessSecret,
          accessToken,
          userId,
          screenName,
        }),
      )
      .catch(() => undefined)
  }

  async persistProfile(profile: AuthProfile): Promise<boolean> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const users = db.collection('users')

      const user = await users.findOne({ userId: profile.userId })

      if (user && user._id) {
        const { matchedCount } = await users.updateOne(
          { _id: user._id },
          { $set: profile },
        )
        resolve(matchedCount > 0)
      } else {
        const { insertedId } = await users.insertOne(profile)
        resolve(!!insertedId)
      }
    })
      .then((result: boolean) => result)
      .catch(() => false) // @todo use logger api
      .finally(() => client.close())
  }

  getRandomSessionId(): string {
    return uuid4()
  }

  async getProfileBySessionId(
    sessId: string,
  ): Promise<AuthProfile | undefined> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const users = db.collection<AuthProfile>('users')

      const user = await users.findOne({ sessId })

      if (user && user._id) {
        resolve(user as AuthProfile)
      } else {
        resolve(undefined)
      }
    })
      .then((profile?: AuthProfile) => profile)
      .catch(() => undefined) // @todo use logger api
      .finally(() => client.close())
  }

  async clearProfileSession(profile: AuthProfile): Promise<void> {
    const client = new MongoClient(process.env.MONGODB_URI)

    return await new Promise(async (resolve) => {
      await client.connect()
      const db = client.db(process.env.MONGODB_DBNAME)
      const users = db.collection<AuthProfile>('users')

      await users.updateOne(
        { _id: profile._id },
        { $set: { sessId: undefined } },
      )

      resolve(true)
    })
      .then(() => undefined)
      .catch(() => undefined) // @todo use logger api
      .finally(() => client.close())
  }
}
