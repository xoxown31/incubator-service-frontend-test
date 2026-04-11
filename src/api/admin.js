import client from './client'

// ────────── Stats ──────────
export const fetchStats = async () => {
  const { data } = await client.get('/api/v1/admin/stats')
  return data.data
}

// ────────── Users ──────────
export const fetchUsers = async ({ keyword = '', page = 0, size = 20 } = {}) => {
  const { data } = await client.get('/api/v1/admin/users', {
    params: { keyword: keyword || undefined, page, size },
  })
  return data.data
}

export const fetchUserDetail = async (userId) => {
  const { data } = await client.get(`/api/v1/admin/users/${userId}`)
  return data.data
}

export const updateUserRole = async (userId, role) => {
  const { data } = await client.patch(`/api/v1/admin/users/${userId}/role`, { role })
  return data.data
}

export const deleteUser = async (userId) => {
  await client.delete(`/api/v1/admin/users/${userId}`)
}

// ────────── Problems ──────────
export const fetchProblems = async ({ keyword = '', page = 0, size = 20 } = {}) => {
  const { data } = await client.get('/api/v1/admin/problems', {
    params: { keyword: keyword || undefined, page, size },
  })
  return data.data
}

export const fetchProblemDetail = async (problemId) => {
  const { data } = await client.get(`/api/v1/admin/problems/${problemId}`)
  return data.data
}

export const deleteProblem = async (problemId) => {
  await client.delete(`/api/v1/admin/problems/${problemId}`)
}

// ────────── Posts ──────────
export const fetchPosts = async ({ keyword = '', page = 0, size = 20 } = {}) => {
  const { data } = await client.get('/api/v1/admin/posts', {
    params: { keyword: keyword || undefined, page, size },
  })
  return data.data
}

export const fetchPostDetail = async (postId) => {
  const { data } = await client.get(`/api/v1/admin/posts/${postId}`)
  return data.data
}

export const deletePost = async (postId) => {
  await client.delete(`/api/v1/admin/posts/${postId}`)
}

// ────────── Answer Templates ──────────
// 목록/상세는 기존 공개 API 재사용 (인증 불필요)
export const fetchTemplates = async () => {
  const { data } = await client.get('/api/v1/answer-templates')
  return data.data
}

export const createTemplate = async (payload) => {
  const { data } = await client.post('/api/v1/admin/answer-templates', payload)
  return data.data
}

export const updateTemplate = async (id, payload) => {
  const { data } = await client.put(`/api/v1/admin/answer-templates/${id}`, payload)
  return data.data
}

export const deleteTemplate = async (id) => {
  await client.delete(`/api/v1/admin/answer-templates/${id}`)
}
