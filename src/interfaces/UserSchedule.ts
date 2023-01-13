interface UserSchedule {
  schedule: number
  schedule_unit:
    | UserScheduleUnit.Minute
    | UserScheduleUnit.Hour
    | UserScheduleUnit.Day
  format: string
  enabled: boolean
  userId: string
}
