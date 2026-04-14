import client from './client'

export const getMyProblems = (status) =>
  client.get('/api/v1/problems', { params: status ? { status } : {} })

export const getRecommendedProblems = () =>
  client.get('/api/v1/problems/recommended')

export const createProblem = (data) =>
  client.post('/api/v1/problems', data)

export const getProblem = (id) =>
  client.get(`/api/v1/problems/${id}`)

export const updateProblem = (id, data) =>
  client.put(`/api/v1/problems/${id}`, data)

export const updateProblemStatus = (id, status) =>
  client.patch(`/api/v1/problems/${id}/status`, { status })

export const deleteProblem = (id) =>
  client.delete(`/api/v1/problems/${id}`)

export const getProblemComments = (problemId) =>
  client.get(`/api/v1/problems/${problemId}/comments`)

export const addProblemComment = (problemId, content) =>
  client.post(`/api/v1/problems/${problemId}/comments`, { content })

export const deleteProblemComment = (commentId) =>
  client.delete(`/api/v1/problems/comments/${commentId}`)
