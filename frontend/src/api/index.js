import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const courseApi = {
  list: () => api.get('/courses'),
  get: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const enrolmentApi = {
  myEnrolments: () => api.get('/enrolments/me'),
  enrol: (courseId) => api.post('/enrolments', { courseId }),
  unenrol: (courseId) => api.delete(`/enrolments/${courseId}`),
};

export const materialApi = {
  list: (courseId) => api.get(`/materials/${courseId}`),
  upload: (courseId, formData) =>
    api.post(`/materials/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/materials/${id}`),
};

export const announcementApi = {
  list: (courseId) => api.get(`/announcements/${courseId}`),
  create: (courseId, data) => api.post(`/announcements/${courseId}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
};

export const forumApi = {
  listPosts: (courseId) => api.get(`/forum/${courseId}`),
  createPost: (courseId, data) => api.post(`/forum/${courseId}`, data),
  createReply: (postId, data) => api.post(`/forum/posts/${postId}/replies`, data),
  deletePost: (id) => api.delete(`/forum/posts/${id}`),
};

export const assignmentApi = {
  list: (courseId) => api.get(`/assignments/${courseId}`),
  create: (courseId, data) => api.post(`/assignments/${courseId}`, data),
  submit: (id, formData) =>
    api.post(`/assignments/${id}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  listSubmissions: (id) => api.get(`/assignments/${id}/submissions`),
  grade: (submissionId, data) => api.patch(`/assignments/submissions/${submissionId}/grade`, data),
};
