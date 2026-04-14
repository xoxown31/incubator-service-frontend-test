import { useState, useEffect } from 'react'
import { getNotifications, markAllRead } from '../api/notifications'
import Layout from '../components/Layout'

const TYPE_LABEL = {
  POST_LIKED: '좋아요',
  POST_COMMENTED: '댓글',
  INCUBATION_READY: '인큐베이션',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])

  const load = async () => {
    try {
      const { data } = await getNotifications()
      setNotifications(data.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { load() }, [])

  const handleMarkAllRead = async () => {
    await markAllRead()
    load()
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">알림</h2>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              전체 읽음
            </button>
          )}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">알림이 없습니다.</div>
        )}

        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border px-4 py-3 shadow-sm flex items-start gap-3 ${
                !n.isRead ? 'border-indigo-100' : 'border-gray-100'
              }`}
            >
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
              {n.isRead && <div className="w-2 h-2 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-400 font-medium">{TYPE_LABEL[n.type] ?? n.type}</span>
                  <span className="text-xs text-gray-300">
                    {new Date(n.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
