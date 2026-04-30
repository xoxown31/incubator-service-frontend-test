import client from './client'

export const getMe = () =>
  client.get('/api/v1/users/me')

export const updateMe = (nickname) =>
  client.put('/api/v1/users/me', { nickname })
