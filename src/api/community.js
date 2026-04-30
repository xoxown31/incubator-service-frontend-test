import client from './client'

export const getPublicProblems = (keyword, page = 0, size = 20) =>
  client.get('/api/v1/community', { params: { keyword: keyword || undefined, page, size, sort: 'createdAt,desc' } })

export const getPopularProblems = () =>
  client.get('/api/v1/community/popular')

export const getTopUsers = () =>
  client.get('/api/v1/community/top-users')
