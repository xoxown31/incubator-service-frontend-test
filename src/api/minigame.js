import client from './client'

export const getGames = () =>
  client.get('/api/v1/minigame')

export const submitRecord = (gameId, score, durationSeconds) =>
  client.post('/api/v1/minigame/records', { gameId, score, durationSeconds })

export const getMyRecords = () =>
  client.get('/api/v1/minigame/records')

export const getLeaderboard = (gameId, limit = 20) =>
  client.get('/api/v1/minigame/leaderboard', { params: { gameId, limit } })

export const getTodayScore = () =>
  client.get('/api/v1/minigame/today-score')
