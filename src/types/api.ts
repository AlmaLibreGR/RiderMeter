export type ApiResponse<T> = {
  ok: boolean
  data?: T
  error?: string
}
const data: ApiResponse<User> = await res.json()

export type Platform = "efood" | "wolt" | "uber"
platform: Platform