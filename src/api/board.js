import client from './client'

export const getPosts = (problemId, params) =>
  client.get(`/api/v1/problems/${problemId}/posts`, { params })

export const createPost = (problemId, data) =>
  client.post(`/api/v1/problems/${problemId}/posts`, data)

export const getPost = (problemId, postId) =>
  client.get(`/api/v1/problems/${problemId}/posts/${postId}`)

export const deletePost = (problemId, postId) =>
  client.delete(`/api/v1/problems/${problemId}/posts/${postId}`)

export const likePost = (problemId, postId) =>
  client.post(`/api/v1/problems/${problemId}/posts/${postId}/like`)

export const addComment = (problemId, postId, content) =>
  client.post(`/api/v1/problems/${problemId}/posts/${postId}/comments`, { content })
