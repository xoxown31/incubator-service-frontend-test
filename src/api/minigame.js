import client from './client'

export const submitRecord = (wpm, accuracy, durationSeconds, gameType) =>
  client.post('/api/v1/minigame/records', { wpm, accuracy, durationSeconds, gameType })

export const getMyRecords = () =>
  client.get('/api/v1/minigame/records')

export const getLeaderboard = (gameType = 'TYPING_PRACTICE', limit = 20) =>
  client.get('/api/v1/minigame/leaderboard', { params: { gameType, limit } })
