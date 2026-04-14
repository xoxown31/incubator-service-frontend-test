import client from './client'

export const getNotifications = () =>
  client.get('/api/v1/notifications')

export const getUnreadCount = () =>
  client.get('/api/v1/notifications/unread-count')

export const markAllRead = () =>
  client.patch('/api/v1/notifications/read-all')
