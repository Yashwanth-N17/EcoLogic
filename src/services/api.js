const API_BASE = 'http://localhost:8080';

const getHeaders = (studentId) => {
  const headers = {};
  if (studentId) {
    headers['X-Student-Id'] = studentId;
  }
  return headers;
};

export const api = {
  async getProfile(studentId) {
    const res = await fetch(`${API_BASE}/students/me`, {
      headers: getHeaders(studentId)
    });
    if (!res.ok) {
      throw new Error("Failed to fetch profile");
    }
    return res.json();
  },

  async createProfile(profileData) {
    const res = await fetch(`${API_BASE}/students/me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileData.name,
        email: profileData.email || `${profileData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: profileData.phone || "+919740512345",
        is_first_gen: profileData.firstGen === 'yes',
        state: profileData.state,
        course: profileData.academicLevel,
        year_of_study: 1,
        annual_family_income: parseFloat(profileData.income),
        category: profileData.category,
        gender: profileData.gender,
        score: parseFloat(profileData.score)
      })
    });
    if (!res.ok) {
      throw new Error("Failed to create profile");
    }
    return res.json();
  },

  async updateProfile(studentId, profileData) {
    const payload = {};
    if (profileData.name !== undefined) payload.name = profileData.name;
    if (profileData.email !== undefined) payload.email = profileData.email;
    if (profileData.phone !== undefined) payload.phone = profileData.phone;
    if (profileData.score !== undefined) payload.score = parseFloat(profileData.score);
    if (profileData.income !== undefined) payload.annual_family_income = parseFloat(profileData.income);

    const res = await fetch(`${API_BASE}/students/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(studentId)
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error("Failed to update profile");
    }
    return res.json();
  },

  async getScholarships() {
    const res = await fetch(`${API_BASE}/scholarships`);
    if (!res.ok) {
      throw new Error("Failed to fetch scholarships");
    }
    return res.json();
  },

  // Trigger backend crawler to fetch latest scholarships
  async triggerCrawl() {
    const res = await fetch(`${API_BASE}/crawl`, { method: 'POST' });
    if (!res.ok) {
      throw new Error('Failed to trigger crawler');
    }
    return res.json();
  },

  async getApplications(studentId) {
    const res = await fetch(`${API_BASE}/applications`, {
      headers: getHeaders(studentId)
    });
    if (!res.ok) {
      throw new Error("Failed to fetch applications");
    }
    return res.json();
  },

  async saveApplication(studentId, scholarshipId, status, checklist = {}, essay = '') {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(studentId)
      },
      body: JSON.stringify({
        scholarship_id: scholarshipId,
        status,
        checklist,
        essay
      })
    });
    if (!res.ok) {
      throw new Error("Failed to save application");
    }
    return res.json();
  },

  async updateApplication(studentId, scholarshipId, patchData) {
    const res = await fetch(`${API_BASE}/applications/${scholarshipId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(studentId)
      },
      body: JSON.stringify(patchData)
    });
    if (!res.ok) {
      throw new Error("Failed to update application");
    }
    return res.json();
  },

  async getDocuments(studentId) {
    const res = await fetch(`${API_BASE}/documents`, {
      headers: getHeaders(studentId)
    });
    if (!res.ok) {
      throw new Error("Failed to fetch documents");
    }
    return res.json();
  },

  async uploadDocument(studentId, docType, file) {
    const formData = new FormData();
    formData.append('doc_type', docType);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      headers: getHeaders(studentId),
      body: formData
    });
    if (!res.ok) {
      throw new Error("Failed to upload document");
    }
    return res.json();
  },

  async askChatbot(studentId, message) {
    const res = await fetch(`${API_BASE}/chatbot/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getHeaders(studentId)
      },
      body: JSON.stringify({ message })
    });
    if (!res.ok) {
      throw new Error("Failed to query chatbot");
    }
    return res.json();
  },

  async getNotifications(studentId) {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(studentId)
    });
    if (!res.ok) {
      throw new Error("Failed to fetch notifications");
    }
    return res.json();
  }
};
