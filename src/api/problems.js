import client from './client'

export const getMyProblems = (status) =>
  client.get('/api/v1/problems', { params: status ? { status } : {} })

export const createProblem = (data) =>
  client.post('/api/v1/problems', data)

export const getProblem = (id) =>
  client.get(`/api/v1/problems/${id}`)

export const updateProblemStatus = (id, status) =>
  client.patch(`/api/v1/problems/${id}/status`, { status })

export const deleteProblem = (id) =>
  client.delete(`/api/v1/problems/${id}`)
