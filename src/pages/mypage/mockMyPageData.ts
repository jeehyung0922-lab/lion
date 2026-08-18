export interface MockMyPageData {
  name: string
  caption: string
  commuteMinutes: number
  prepMinutes: number
  targetSleepMinutes: number
  napAvailable: boolean
  napAvailableMinutes: number
  rhythmPreference: string
}

export const MOCK_MY_PAGE_DATA: MockMyPageData = {
  name: '박일하',
  caption: '교대근무 생활 리듬 관리 중',
  commuteMinutes: 30,
  prepMinutes: 45,
  targetSleepMinutes: 420,
  napAvailable: true,
  napAvailableMinutes: 30,
  rhythmPreference: '리듬 유지형',
}
