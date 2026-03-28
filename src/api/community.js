import client from './client'

export const getPublicProblems = (keyword, page = 0, size = 20) =>
  client.get('/api/v1/community', { params: { keyword: keyword || undefined, page, size, sort: 'createdAt,desc' } })
