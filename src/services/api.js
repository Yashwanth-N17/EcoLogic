/**
 * Scholar Mate — Frontend API Service Layer
 * ==========================================
 * This module abstracts all data persistence for the app.
 * 
 * Architecture:
 *   Frontend (React) → this file (api.js) → localStorage (always works)
 *                                          → FastAPI backend (optional, port 8080)
 * 
 * When the FastAPI backend is running, data is synced to SQLite via the backend.
 * When it is offline, the app works fully via localStorage.
 */

const API_BASE = 'http://localhost:8080';
const STORAGE_KEYS = {
  studentId: 'econav_student_id',
  profile: 'econav_profile',
  applications: 'econav_applications',
  savedScholarships: 'firstgen_saved',
  messages: 'firstgen_messages',
  notifications: 'econav_notifications',
  language: 'econav_language',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

async function tryFetch(url, options = {}) {
  const studentId = localStorage.getItem(STORAGE_KEYS.studentId);
  const headers = { ...options.headers };
  if (studentId) headers['X-Student-Id'] = studentId;
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const defaultTimeout = (url.includes('/chatbot') || url.includes('/upload')) ? 25000 : 3000;
  const timeoutVal = options.timeout || defaultTimeout;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutVal);
  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    clearTimeout(timeout);
    return null; // backend offline — caller uses localStorage fallback
  }
}

// ─── Local Storage helpers ───────────────────────────────────────────────────

const local = {
  getProfile: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.profile)); } catch { return null; }
  },
  setProfile: (data) => localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(data)),

  getApplications: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.applications)) || {}; } catch { return {}; }
  },
  setApplications: (data) => localStorage.setItem(STORAGE_KEYS.applications, JSON.stringify(data)),

  getSaved: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.savedScholarships)) || []; } catch { return []; }
  },
  setSaved: (arr) => localStorage.setItem(STORAGE_KEYS.savedScholarships, JSON.stringify(arr)),

  getNotifications: () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.notifications)) || []; } catch { return []; }
  },
  setNotifications: (arr) => localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(arr)),
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const api = {

  // ── Profile ────────────────────────────────────────────────────────────────

  async getProfile(studentId) {
    // Try backend first
    const remote = await tryFetch('/students/me');
    if (remote) {
      local.setProfile(remote);
      return remote;
    }
    // Fallback: localStorage
    const cached = local.getProfile();
    if (cached) {
      // The backend does not have the profile (or is offline), so let's try to sync it if the backend is online!
      try {
        const payload = {
          name: cached.name,
          email: cached.email || `${(cached.name || 'student').toLowerCase().replace(/\s+/g, '')}@scholarmate.app`,
          phone: cached.phone || '+91 98765 43210',
          is_first_gen: cached.firstGen === 'yes' || cached.is_first_gen === true,
          state: cached.state,
          course: cached.academicLevel || cached.course || 'Undergrad',
          year_of_study: cached.year_of_study || 1,
          annual_family_income: parseFloat(cached.income || cached.annual_family_income) || 0,
          category: cached.category || 'General',
          disability_status: cached.disability_status || false,
          gender: cached.gender || 'Not Specified',
          preferred_language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
          score: parseFloat(cached.score) || 0,
        };
        const synced = await tryFetch('/students/me', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (synced && synced.id) {
          localStorage.setItem(STORAGE_KEYS.studentId, synced.id);
          const fullProfile = { ...payload, ...cached, id: synced.id };
          local.setProfile(fullProfile);
          return fullProfile;
        }
      } catch (err) {
        console.error("Failed to auto-sync student profile to backend", err);
      }
      return cached;
    }
    throw new Error('No profile found');
  },

  async createProfile(profileData) {
    const payload = {
      name: profileData.name,
      email: profileData.email || `${(profileData.name || 'student').toLowerCase().replace(/\s+/g, '')}@scholarmate.app`,
      phone: profileData.phone || '+91 98765 43210',
      is_first_gen: profileData.firstGen === 'yes',
      state: profileData.state,
      course: profileData.academicLevel || 'Undergrad',
      year_of_study: 1,
      annual_family_income: parseFloat(profileData.income) || 0,
      category: profileData.category || 'General',
      disability_status: false,
      gender: profileData.gender || 'Not Specified',
      preferred_language: localStorage.getItem(STORAGE_KEYS.language) || 'en',
      score: parseFloat(profileData.score) || 0,
    };

    // Try backend
    const remote = await tryFetch('/students/me', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const studentId = remote?.id || generateId();
    localStorage.setItem(STORAGE_KEYS.studentId, studentId);

    // Merge with original frontend fields for local use
    const fullProfile = { ...payload, ...profileData, id: studentId };
    local.setProfile(fullProfile);
    return fullProfile;
  },

  async updateProfile(studentId, profileData) {
    const payload = {
      name: profileData.name,
      score: parseFloat(profileData.score),
      annual_family_income: parseFloat(profileData.income),
    };

    // Try backend
    await tryFetch('/students/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    // Always update local
    const existing = local.getProfile() || {};
    const updated = { ...existing, ...profileData, ...payload };
    local.setProfile(updated);
    return updated;
  },

  // ── Applications ───────────────────────────────────────────────────────────

  async getApplications(studentId) {
    // Try backend
    const remote = await tryFetch('/applications');
    if (remote && Array.isArray(remote)) {
      // Sync to local as object map
      const appsObj = {};
      remote.forEach(app => {
        appsObj[app.scholarship_id] = {
          status: app.status === 'saved' ? 'Not Started' : app.status,
          checklist: app.checklist || {},
          essay: app.essay || '',
          startedAt: app.updated_at,
          submittedAt: app.applied_at,
        };
      });
      local.setApplications(appsObj);
      // Return in format App.jsx expects (array with scholarship_id)
      return remote;
    }
    // Fallback: convert localStorage object to array format
    const appsObj = local.getApplications();
    return Object.entries(appsObj).map(([scholarship_id, data]) => ({
      scholarship_id,
      status: data.status,
      checklist: data.checklist || {},
      essay: data.essay || '',
      updated_at: data.startedAt,
      applied_at: data.submittedAt,
    }));
  },

  async saveApplication(studentId, scholarshipId, status, checklist = {}, essay = '') {
    // Try backend
    await tryFetch('/applications', {
      method: 'POST',
      body: JSON.stringify({ scholarship_id: scholarshipId, status, checklist, essay }),
    });
    // Always update local
    const apps = local.getApplications();
    apps[scholarshipId] = { status, checklist, essay, startedAt: apps[scholarshipId]?.startedAt || new Date().toISOString() };
    local.setApplications(apps);
    return apps[scholarshipId];
  },

  async updateApplication(studentId, scholarshipId, patchData) {
    // Try backend
    await tryFetch(`/applications/${scholarshipId}`, {
      method: 'PATCH',
      body: JSON.stringify(patchData),
    });
    // Always update local
    const apps = local.getApplications();
    if (!apps[scholarshipId]) apps[scholarshipId] = {};
    apps[scholarshipId] = { ...apps[scholarshipId], ...patchData };
    if (patchData.status === 'Submitted') {
      apps[scholarshipId].submittedAt = new Date().toISOString();
    }
    local.setApplications(apps);
    return apps[scholarshipId];
  },

  // ── Documents ──────────────────────────────────────────────────────────────

  async getDocuments(studentId) {
    const remote = await tryFetch('/documents');
    if (remote && Array.isArray(remote)) return remote;
    return []; // No local document storage (files can't be in localStorage)
  },

  async uploadDocument(studentId, docType, file) {
    const formData = new FormData();
    formData.append('doc_type', docType);
    formData.append('file', file);
    const remote = await tryFetch('/documents/upload', { method: 'POST', body: formData });
    if (remote) return remote;
    // Offline fallback: return a mock successful response
    return { doc_type: docType, file_url: `local://${file.name}`, uploaded_at: new Date().toISOString() };
  },

  // ── Chatbot ────────────────────────────────────────────────────────────────

  async askChatbot(studentId, message) {
    const remote = await tryFetch('/chatbot/query', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    if (remote) return remote;
    return null; // Handled gracefully in MentorChat with local responses
  },

  async translateMessage(text, targetLang) {
    const remote = await tryFetch('/chatbot/translate', {
      method: 'POST',
      body: JSON.stringify({ text, target_lang: targetLang })
    });
    return remote?.translated_text || text;
  },

  // ── Notifications ──────────────────────────────────────────────────────────

  async getNotifications(studentId) {
    const remote = await tryFetch('/notifications');
    if (remote && Array.isArray(remote)) {
      local.setNotifications(remote);
      return remote;
    }
    return local.getNotifications();
  },
};
