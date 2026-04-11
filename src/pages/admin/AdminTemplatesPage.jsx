import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
} from '../../api/admin'

const EMPTY = { name: '', description: '', schema: '' }

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [editing, setEditing] = useState(null) // null=none, 'new', or id
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    fetchTemplates()
      .then(setTemplates)
      .catch(e => setError(e.response?.data?.message || '불러오기 실패'))
  }, [])

  useEffect(() => { load() }, [load])

  const startNew = () => {
    setEditing('new')
    setForm(EMPTY)
  }

  const startEdit = (t) => {
    setEditing(t.id)
    setForm({
      name: t.name || '',
      description: t.description || '',
      schema: t.schema || '',
    })
  }

  const cancel = () => {
    setEditing(null)
    setForm(EMPTY)
  }

  const save = async () => {
    try {
      if (editing === 'new') {
        await createTemplate(form)
      } else {
        await updateTemplate(editing, form)
      }
      cancel()
      load()
    } catch (e) {
      alert(e.response?.data?.message || '저장 실패')
    }
  }

  const handleDelete = async (t) => {
    if (!confirm(`"${t.name}" 양식을 삭제할까?`)) return
    try {
      await deleteTemplate(t.id)
      load()
    } catch (e) {
      alert(e.response?.data?.message || '삭제 실패')
    }
  }

  return (
    <AdminLayout title="정답 양식 관리">
      <div className="flex justify-between mb-4">
        <p className="text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{templates.length}</span>개 양식
        </p>
        <button
          onClick={startNew}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
        >
          + 양식 추가
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

      {editing !== null && (
        <div className="bg-white rounded-xl border border-indigo-200 p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            {editing === 'new' ? '새 양식 추가' : `양식 수정 (#${editing})`}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">이름</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">설명</label>
              <input
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Schema (JSON)</label>
              <textarea
                value={form.schema}
                onChange={e => setForm({ ...form, schema: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder='{"fields":[{"key":"current_thought","label":"현재 나의 생각","type":"text"}]}'
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={save}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
            >
              저장
            </button>
            <button
              onClick={cancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">이름</th>
              <th className="text-left px-4 py-3">설명</th>
              <th className="text-left px-4 py-3">Schema</th>
              <th className="text-right px-4 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(t => (
              <tr key={t.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-500">{t.id}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{t.description}</td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-md truncate font-mono">{t.schema}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => startEdit(t)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400 text-sm">등록된 양식이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  )
}
