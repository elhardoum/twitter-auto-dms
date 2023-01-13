interface DirectMessage {
  senderId: string
  senderScreenName: string
  recipientId: string
  recipientScreenName: string
  message: string
  sentDate?: Date
  sendAt: Date
  status: DmStatus.Pending | DmStatus.Sent | DmStatus.Error
  _id?: any // cannot use ObjectId from mongodb
}
