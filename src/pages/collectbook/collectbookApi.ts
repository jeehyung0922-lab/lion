export type ApiLocalTime =
  | string
  | {
      hour: number
      minute: number
      second?: number
      nano?: number
    }

export interface CollectbookZoneResponse {
  rank: number
  utcOffset: number
  city: string
  livedDays: number
  representativeSleepStart: ApiLocalTime
  representativeSleepEnd: ApiLocalTime
  isNew: boolean
}

export interface CollectbookResponse {
  month: string
  summary: string
  zones: CollectbookZoneResponse[]
  totalTravelHours: number
  maxDailyTravelHours: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function fetchCollectbook(month: string, signal?: AbortSignal) {
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, '')}/api/collectbook?month=${encodeURIComponent(month)}`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`CollectBook request failed: ${response.status}`)
  }

  return (await response.json()) as CollectbookResponse
}
