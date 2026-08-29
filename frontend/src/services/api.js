const API_URL = 'http://localhost:5001/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth API
  register: async (fullName, email, password, role, mobileNumber, facultyProfile = {}) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role, mobileNumber, ...facultyProfile }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  verifyEmail: async (email, token) => {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Verification failed');
    return data;
  },

  resendOtp: async (email) => {
    const res = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Resend failed');
    return data;
  },

  login: async (email, password, role) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const data = await res.json();
    if (data.requiresVerification) return data;
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  resetPassword: async (oldPassword, newPassword) => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Password reset failed');
    return data;
  },

  forgotPassword: async (email) => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  resetPasswordOtp: async (email, otp, newPassword) => {
    const res = await fetch(`${API_URL}/auth/reset-password-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Reset failed');
    return data;
  },

  // Student CV API
  uploadCV: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('cv', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/cv/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'CV Upload failed');
    return data;
  },

  uploadFacultyCV: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('cv', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/faculty/cv/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Faculty CV Upload failed');
    return data;
  },

  getProfile: async () => {
    const res = await fetch(`${API_URL}/cv/profile`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Profile fetch failed');
    return data.profile;
  },

  updateProfile: async (profileData) => {
    const res = await fetch(`${API_URL}/cv/profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Profile update failed');
    return data;
  },

  uploadProfilePicture: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('profilePicture', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/user/upload-picture`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },

  // Admin API
  getAdminUsers: async () => {
    const res = await fetch(`${API_URL}/admin/users`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Admin fetch failed');
    return data.users;
  },
  adminCreateUser: async (body) => request('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateUser: async (id, body) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUser: async (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  setUserBlocked: async (id, isBlocked) => request(`/admin/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ isBlocked }) }),
  getFacultyProfile: async () => (await request('/faculty/profile')).profile,
  updateFacultyProfile: async (body) => request('/faculty/profile', { method: 'POST', body: JSON.stringify(body) }),
  createRecommendation: async (body) => request('/recommendations', { method: 'POST', body: JSON.stringify(body) }),
  getStudentRecommendations: async () => (await request('/recommendations/student')).recommendations,
  cancelRecommendation: async (id) => request(`/recommendations/${id}/cancel`, { method: 'PATCH' }),
  getFacultyRecommendations: async () => (await request('/recommendations/faculty')).recommendations,
  acceptRecommendation: async (id) => request(`/recommendations/${id}/accept`, { method: 'PATCH' }),
  declineRecommendation: async (id) => request(`/recommendations/${id}/decline`, { method: 'PATCH' }),
  uploadRecommendationLetter: async (id, file) => {
    const body = new FormData(); body.append('letter', file);
    const res = await fetch(`${API_URL}/recommendations/${id}/letter`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body });
    const data = await res.json(); if (!res.ok) throw new Error(data.message || 'Letter upload failed'); return data;
  },
  downloadRecommendationLetter: async (id, fileName = 'recommendation-letter.pdf') => {
    const res = await fetch(`${API_URL}/recommendations/${id}/letter`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) { const data = await res.json(); throw new Error(data.message || 'Letter download failed'); }
    const url = URL.createObjectURL(await res.blob()); const anchor = document.createElement('a'); anchor.href = url; anchor.download = fileName; anchor.click(); URL.revokeObjectURL(url);
  },
  getUniversities: async (params = {}) => request(`/universities?${new URLSearchParams(params).toString()}`),
  getSuggestedUniversities: async () => request('/universities/suggested'),
  generateSuggestedUniversities: async () => request('/universities/suggested/generate', { method: 'POST' }),
  getSavedUniversities: async () => request('/universities/saved'),
  saveUniversity: async (id) => request(`/universities/${id}/shortlist`, { method: 'POST' }),
  removeSavedUniversity: async (id) => request(`/universities/${id}/shortlist`, { method: 'DELETE' }),
  saveAiUniversity: async (body) => request('/universities/ai/shortlist', { method: 'POST', body: JSON.stringify(body) }),
  removeSavedAiUniversity: async (id) => request(`/universities/ai/shortlist/${id}`, { method: 'DELETE' }),
  getAdminUniversities: async () => (await request('/universities/admin/all')).universities,
  createUniversity: async (body) => request('/universities/admin', { method: 'POST', body: JSON.stringify(body) }),
  updateUniversity: async (id, body) => request(`/universities/admin/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteUniversity: async (id) => request(`/universities/admin/${id}`, { method: 'DELETE' }),
  uploadUniversityPicture: async (file) => {
    const token = localStorage.getItem('token');
    const body = new FormData();
    body.append('universityPicture', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/universities/admin/upload-image`, { method: 'POST', headers, body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }
};

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...getHeaders(), ...(options.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}
