import client from './client'

export const register = (email, password, nickname) =>
  client.post('/api/v1/auth/register', { email, password, nickname })

export const login = async (email, password) => {
  const { data } = await client.post('/api/v1/auth/login', { email, password })
  localStorage.setItem('accessToken', data.data.accessToken)
  localStorage.setItem('refreshToken', data.data.refreshToken)
  return data.data
}

export const logout = async () => {
  await client.post('/api/v1/auth/logout')
  localStorage.clear()
}
