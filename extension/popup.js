const API_BASE = 'http://localhost:8080';
let activeProfile = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  syncProfile();
  
  document.getElementById('retry-btn').addEventListener('click', syncProfile);
  document.getElementById('autofill-btn').addEventListener('click', triggerAutofill);
});

// Try to find the session ID from localhost:5173 tab and fetch profile details
async function syncProfile() {
  const statusBadge = document.getElementById('connection-status');
  const profileContainer = document.getElementById('profile-container');
  const noProfileView = document.getElementById('no-profile-view');
  
  try {
    // 1. Find all tabs matching localhost:5173
    const tabs = await chrome.tabs.query({ url: "*://localhost/*" });
    const targetTab = tabs.find(tab => tab.url.includes('5173'));
    
    if (!targetTab) {
      throw new Error("No active web dashboard tab found");
    }
    
    // 2. Execute script on dashboard tab to get student ID from local storage
    const results = await chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: () => localStorage.getItem('econav_student_id')
    });
    
    const studentId = results[0]?.result;
    
    if (!studentId) {
      throw new Error("No student session ID active in dashboard");
    }
    
    // 3. Fetch full profile from local FastAPI backend
    const res = await fetch(`${API_BASE}/students/me`, {
      headers: { 'X-Student-Id': studentId }
    });
    
    if (!res.ok) {
      throw new Error("Failed to fetch profile details from backend");
    }
    
    const data = await res.json();
    
    // Map details
    activeProfile = {
      name: data.name,
      state: data.state,
      gender: data.gender,
      category: data.category,
      income: data.annual_family_income ? `₹${Math.round(data.annual_family_income).toLocaleString('en-IN')}` : '-',
      score: String(data.score),
      phone: data.phone,
      email: data.email
    };
    
    // Update UI
    document.getElementById('prof-name').textContent = activeProfile.name;
    document.getElementById('prof-cat').textContent = activeProfile.category;
    document.getElementById('prof-inc').textContent = activeProfile.income;
    document.getElementById('prof-state').textContent = activeProfile.state;
    document.getElementById('prof-score').textContent = activeProfile.score;
    
    statusBadge.textContent = 'Connected';
    statusBadge.className = 'status-badge connected';
    
    profileContainer.style.display = 'block';
    noProfileView.style.display = 'none';
    
  } catch (err) {
    console.error("Autofill sync failed:", err);
    statusBadge.textContent = 'Disconnected';
    statusBadge.className = 'status-badge disconnected';
    
    profileContainer.style.display = 'none';
    noProfileView.style.display = 'block';
  }
}

// Send profile to content script on the current active tab
async function triggerAutofill() {
  if (!activeProfile) return;
  
  const autofillBtn = document.getElementById('autofill-btn');
  const originalText = autofillBtn.textContent;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      alert("No active portal tab found!");
      return;
    }
    
    autofillBtn.disabled = true;
    autofillBtn.textContent = '⚡ Filling Form Fields...';
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "autofill",
      profile: activeProfile
    });
    
    if (response && response.success) {
      autofillBtn.textContent = `✅ Filled ${response.filledCount} Fields!`;
      setTimeout(() => {
        autofillBtn.disabled = false;
        autofillBtn.textContent = originalText;
      }, 2000);
    } else {
      throw new Error("No inputs detected or filled");
    }
  } catch (err) {
    console.error("Autofill fill trigger failed:", err);
    autofillBtn.textContent = '❌ No forms detected';
    setTimeout(() => {
      autofillBtn.disabled = false;
      autofillBtn.textContent = originalText;
    }, 2000);
  }
}
