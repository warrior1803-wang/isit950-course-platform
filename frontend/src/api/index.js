import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

export const courseApi = {
  list: () => api.get('/courses'),
  browse: () => api.get('/courses/browse'),
  get: (id) => api.get(`/courses/${id}`),
  students: (id) => api.get(`/courses/${id}/students`),
  progress: (id) => api.get(`/courses/${id}/progress`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
};

export const enrolmentApi = {
  myEnrolments: () => api.get('/enrolments/me'),
  enrol: (courseId) => api.post(`/courses/${courseId}/enrol`),
  unenrol: (courseId) => api.delete(`/courses/${courseId}/enrol`),
};

export const materialApi = {
  list: (courseId) => api.get(`/courses/${courseId}/materials`),
  upload: (courseId, formData) =>
    api.post(`/courses/${courseId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (courseId, materialId) => api.delete(`/courses/${courseId}/materials/${materialId}`),
};

export const announcementApi = {
  list: (courseId) => api.get(`/courses/${courseId}/announcements`),
  create: (courseId, data) => api.post(`/courses/${courseId}/announcements`, data),
  update: (courseId, annId, data) => api.put(`/courses/${courseId}/announcements/${annId}`, data),
  delete: (courseId, annId) => api.delete(`/courses/${courseId}/announcements/${annId}`),
};

export const forumApi = {
  listPosts: (courseId) => api.get(`/courses/${courseId}/posts`),
  getPost: (courseId, postId) => api.get(`/courses/${courseId}/posts/${postId}`),
  createPost: (courseId, data) => api.post(`/courses/${courseId}/posts`, data),
  createReply: (courseId, postId, data) => api.post(`/courses/${courseId}/posts/${postId}/replies`, data),
  deletePost: (courseId, postId) => api.delete(`/courses/${courseId}/posts/${postId}`),
  deleteReply: (courseId, postId, replyId) =>
    api.delete(`/courses/${courseId}/posts/${postId}/replies/${replyId}`),
};

export const assignmentApi = {
  list: (courseId) => api.get(`/courses/${courseId}/assignments`),
  create: (courseId, data) => api.post(`/courses/${courseId}/assignments`, data),
  get: (courseId, assignmentId) => api.get(`/courses/${courseId}/assignments/${assignmentId}`),
  update: (courseId, assignmentId, data) => api.put(`/courses/${courseId}/assignments/${assignmentId}`, data),
  delete: (courseId, assignmentId) => api.delete(`/courses/${courseId}/assignments/${assignmentId}`),
  submit: (courseId, assignmentId, data, config) =>
    api.post(`/courses/${courseId}/assignments/${assignmentId}/submit`, data, config),
  submitFile: (courseId, assignmentId, formData) =>
    api.post(`/courses/${courseId}/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  submitAuto: (courseId, assignmentId, answers) =>
    api.post(`/courses/${courseId}/assignments/${assignmentId}/submit`, { answers }),
  listSubmissions: (courseId, assignmentId) =>
    api.get(`/courses/${courseId}/assignments/${assignmentId}/submissions`),
  mySubmission: (courseId, assignmentId) =>
    api.get(`/courses/${courseId}/assignments/${assignmentId}/submissions/me`),
  grade: (courseId, assignmentId, submissionId, data) =>
    api.put(`/courses/${courseId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, data),
};

export const membershipApi = {
  get: () => api.get('/membership'),
  getCurrent: () => api.get('/membership'),
  upgrade: (data) => api.post('/membership/upgrade', data),
  getLimits: () => api.get('/membership/limits'),
};
