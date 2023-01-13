interface AuthProfile {
  accessSecret: string
  accessToken: string
  userId: string
  screenName: string
  sessId: string
  _id?: any // cannot use ObjectId from mongodb
}
