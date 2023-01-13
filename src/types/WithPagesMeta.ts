type WithPagesMeta<T> = {
  items: T
  paged: {
    next?: number
    previous?: number
  }
}
