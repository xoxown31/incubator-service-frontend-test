import client from './client'

export const getTemplates = () =>
  client.get('/api/v1/answer-templates')

export const getTemplate = (id) =>
  client.get(`/api/v1/answer-templates/${id}`)

export const getAnswers = (problemId) =>
  client.get(`/api/v1/problems/${problemId}/answers`)

export const submitAnswer = (problemId, templateId, data) =>
  client.post(`/api/v1/problems/${problemId}/answers`, { templateId, data })
