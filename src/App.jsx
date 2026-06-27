import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { 
  GraduationCap, 
  Home, 
  Search, 
  ClipboardList, 
  BookOpen, 
  MessageSquare, 
  User, 
  LogOut,
  Sparkles,
  FolderLock,
  Bell,
  Globe,
  Beaker
} from 'lucide-react';

import { SCHOLARSHIPS, MOCK_MENTOR_CHAT } from './data';
import { TRANSLATIONS } from './data/translations';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import ScholarshipListing from './components/ScholarshipListing';
import ScholarshipDetail from './components/ScholarshipDetail';
import Tracker from './components/Tracker';
import ResourceCenter from './components/ResourceCenter';
import MentorChat from './components/MentorChat';
import WelcomeScreen from './components/WelcomeScreen';
import DocumentVault from './components/DocumentVault';
import EcoLabs from './components/EcoLabs';

export default function App() {
  // --- Persistent State ---
  const [studentId, setStudentId] = useState(() => {
    return localStorage.getItem('econav_student_id') || null;
  });

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [savedScholarships, setSavedScholarships] = useState(() => {
    const saved = localStorage.getItem('firstgen_saved');
    return saved ? JSON.parse(saved) : [];
  });

  const [applications, setApplications] = useState({});

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('firstgen_messages');
    return saved ? JSON.parse(saved) : MOCK_MENTOR_CHAT;
  });

  const [vaultDocs, setVaultDocs] = useState([
    { id: 'aadhaar', name: 'Aadhaar Card (Identity Proof)', status: 'Missing', file: null, date: null },
    { id: 'income', name: 'Income Certificate', status: 'Missing', file: null, date: null },
    { id: 'marksheet_12', name: 'Class 12 Marksheet', status: 'Missing', file: null, date: null },
    { id: 'marksheet_10', name: 'Class 10 Marksheet', status: 'Missing', file: null, date: null },
    { id: 'domicile', name: 'Domicile Certificate (Address Proof)', status: 'Missing', file: null, date: null }
  ]);

  // --- UI Layout State ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedScholarshipId, setSelectedScholarshipId] = useState(null);
  const [activeTerm, setActiveTerm] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('econav_language') || 'en';
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [extensionActive, setExtensionActive] = useState(false);

  // Fetch all user details from the backend if studentId exists
  useEffect(() => {
    async function loadData() {
      if (!studentId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // 1. Fetch profile
        const profileData = await api.getProfile(studentId);
        const normalizedProfile = {
          ...profileData,
          academicLevel: profileData.course,
          income: String(Math.round(profileData.annual_family_income)),
          firstGen: profileData.is_first_gen ? 'yes' : 'no'
        };
        setProfile(normalizedProfile);

        // 2. Fetch applications
        const appsData = await api.getApplications(studentId);
        const appsObj = {};
        appsData.forEach(app => {
          appsObj[app.scholarship_id] = {
            status: app.status,
            checklist: app.checklist,
            essay: app.essay,
            startedAt: app.updated_at,
            submittedAt: app.applied_at
          };
        });
        setApplications(appsObj);

        // 3. Fetch documents
        const docsData = await api.getDocuments(studentId);
        setVaultDocs(prev => {
          let updatedDocs = prev.map(d => {
            const uploaded = docsData.find(u => u.doc_type === d.id);
            if (uploaded) {
              return {
                ...d,
                status: 'Uploaded',
                file: uploaded.file_url.split(/[\/\\]/).pop(),
                size: '2.4 MB',
                date: new Date(uploaded.uploaded_at).toLocaleDateString('en-IN')
              };
            }
            return d;
          });
          
          // caste certificate dynamic slot
          const hasCasteSlot = updatedDocs.some(d => d.id === 'caste');
          const needsCasteSlot = normalizedProfile.category && normalizedProfile.category !== 'General';
          if (needsCasteSlot && !hasCasteSlot) {
            const uploadedCaste = docsData.find(u => u.doc_type === 'caste');
            updatedDocs = [...updatedDocs, {
              id: 'caste',
              name: `Caste Certificate (${normalizedProfile.category})`,
              status: uploadedCaste ? 'Uploaded' : 'Missing',
              file: uploadedCaste ? uploadedCaste.file_url.split(/[\/\\]/).pop() : null,
              size: uploadedCaste ? '2.4 MB' : null,
              date: uploadedCaste ? new Date(uploadedCaste.uploaded_at).toLocaleDateString('en-IN') : null
            }];
          } else if (!needsCasteSlot && hasCasteSlot) {
            updatedDocs = updatedDocs.filter(d => d.id !== 'caste');
          }
          return updatedDocs;
        });

        // 4. Fetch notifications (WhatsApp & In-App)
        const notifData = await api.getNotifications(studentId);
        const mappedNotifs = notifData.map(n => {
          let type = 'in-app';
          let title = 'Alert';
          if (n.message.includes('[WHATSAPP]') || n.message.includes('[META]') || n.message.includes('[TWILIO]') || n.message.includes('WhatsApp')) {
            type = 'whatsapp';
            title = 'Meta WhatsApp Alert Sent';
          } else if (n.message.includes('OCR') || n.message.includes('Document')) {
            title = 'AI OCR Document Extracted';
          } else if (n.message.includes('Profile')) {
            title = 'Profile Configured';
          }
          return {
            id: n.id,
            title: title,
            message: n.message.replace(/^\[[A-Z]+\]\s*/, ''), // clean tag
            type: type,
            time: new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: false
          };
        });
        setNotifications(mappedNotifs);

      } catch (err) {
        console.error("Failed to load backend profile, resetting student_id", err);
        setProfile(null);
        setStudentId(null);
        localStorage.removeItem('econav_student_id');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [studentId]);

  // Sync language and bookmarks to LocalStorage
  useEffect(() => {
    localStorage.setItem('econav_language', language);
  }, [language]);

  useEffect(() => {
    const checkExt = () => {
      const active = document.documentElement.getAttribute('data-scholarmate-extension') === 'active';
      setExtensionActive(active);
    };
    checkExt();
    window.addEventListener('ScholarMateExtensionLoaded', checkExt);
    return () => window.removeEventListener('ScholarMateExtensionLoaded', checkExt);
  }, []);

  useEffect(() => {
    localStorage.setItem('firstgen_saved', JSON.stringify(savedScholarships));
  }, [savedScholarships]);

  useEffect(() => {
    localStorage.setItem('firstgen_messages', JSON.stringify(messages));
  }, [messages]);

  const t = (key) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const handleOCRUpdate = async (field, value) => {
    if (!profile) return;
    try {
      const updatedStudent = await api.updateProfile(studentId, {
        [field]: value
      });
      
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          name: updatedStudent.name,
          score: String(updatedStudent.score),
          income: String(Math.round(updatedStudent.annual_family_income))
        };
      });

      // Refetch notifications logs
      const notifData = await api.getNotifications(studentId);
      const mappedNotifs = notifData.map(n => {
        let type = 'in-app';
        let title = 'Alert';
        if (n.message.includes('[WHATSAPP]') || n.message.includes('[META]') || n.message.includes('[TWILIO]') || n.message.includes('WhatsApp')) {
          type = 'whatsapp';
          title = 'Meta WhatsApp Alert Sent';
        } else if (n.message.includes('OCR') || n.message.includes('Document')) {
          title = 'AI OCR Document Extracted';
        }
        return {
          id: n.id,
          title: title,
          message: n.message.replace(/^\[[A-Z]+\]\s*/, ''),
          type: type,
          time: new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true
        };
      });
      setNotifications(mappedNotifs);
    } catch (err) {
      console.error("Failed to sync OCR update to profile", err);
    }
  };

  // --- Handlers ---
  const handleOnboardingComplete = async (profileData) => {
    try {
      setLoading(true);
      const createdStudent = await api.createProfile(profileData);
      localStorage.setItem('econav_student_id', createdStudent.id);
      setStudentId(createdStudent.id);
    } catch (err) {
      console.error("Failed to save profile on onboarding", err);
      alert("Backend API connection failed. Please ensure FastAPI is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = (id) => {
    setSavedScholarships(prev => {
      if (prev.includes(id)) {
        return prev.filter(sid => sid !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleRemoveSaved = (id) => {
    setSavedScholarships(prev => prev.filter(sid => sid !== id));
  };

  const handleStartApplication = async (id) => {
    const scholarship = SCHOLARSHIPS.find(s => s.id === id);
    if (!scholarship) return;

    // Seed empty checklist based on scholarship requirements
    const initialChecklist = {};
    scholarship.requirements.forEach(req => {
      initialChecklist[req.id] = false;
    });

    try {
      const createdApp = await api.saveApplication(studentId, id, 'In Progress', initialChecklist, '');
      setApplications(prev => ({
        ...prev,
        [id]: {
          status: createdApp.status,
          checklist: createdApp.checklist,
          essay: createdApp.essay,
          startedAt: createdApp.updated_at
        }
      }));

      // Auto-save/bookmark the scholarship if it wasn't saved already
      setSavedScholarships(prev => {
        if (!prev.includes(id)) {
          return [...prev, id];
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to start application on server", err);
    }
  };

  const handleToggleChecklistItem = async (scholarshipId, reqId) => {
    const app = applications[scholarshipId];
    if (!app) return;

    const newChecklist = {
      ...app.checklist,
      [reqId]: !app.checklist[reqId]
    };

    try {
      const updatedApp = await api.updateApplication(studentId, scholarshipId, {
        checklist: newChecklist
      });
      
      setApplications(prev => ({
        ...prev,
        [scholarshipId]: {
          ...app,
          checklist: updatedApp.checklist
        }
      }));
    } catch (err) {
      console.error("Failed to toggle checklist item", err);
    }
  };

  const handleSaveEssay = async (scholarshipId, essayText) => {
    const app = applications[scholarshipId];
    if (!app) return;

    try {
      const updatedApp = await api.updateApplication(studentId, scholarshipId, {
        essay: essayText
      });
      
      setApplications(prev => ({
        ...prev,
        [scholarshipId]: {
          ...app,
          essay: updatedApp.essay
        }
      }));
    } catch (err) {
      console.error("Failed to save essay", err);
    }
  };

  const handleSubmitApplication = async (scholarshipId) => {
    const scholarship = SCHOLARSHIPS.find(s => s.id === scholarshipId);
    const app = applications[scholarshipId];
    if (!app) return;

    try {
      const updatedApp = await api.updateApplication(studentId, scholarshipId, {
        status: 'Submitted'
      });
      
      setApplications(prev => ({
        ...prev,
        [scholarshipId]: {
          ...app,
          status: 'Submitted',
          submittedAt: updatedApp.applied_at
        }
      }));

      // Fetch fresh notification logs showing the WhatsApp template sent
      const notifData = await api.getNotifications(studentId);
      const mappedNotifs = notifData.map(n => {
        let type = 'in-app';
        let title = 'Alert';
        if (n.message.includes('[WHATSAPP]') || n.message.includes('[META]') || n.message.includes('[TWILIO]') || n.message.includes('WhatsApp')) {
          type = 'whatsapp';
          title = 'Meta WhatsApp Alert Sent';
        }
        return {
          id: n.id,
          title: title,
          message: n.message.replace(/^\[[A-Z]+\]\s*/, ''),
          type: type,
          time: new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: true
        };
      });
      setNotifications(mappedNotifs);
    } catch (err) {
      console.error("Failed to submit application", err);
    }
  };

  const handleSendMessage = (msgObj) => {
    setMessages(prev => [...prev, msgObj]);
  };

  const handleResetApp = () => {
    if (window.confirm("Are you sure you want to log out and clear all your dashboard progress? This will reset your profile.")) {
      localStorage.clear();
      setStudentId(null);
      setProfile(null);
      setSavedScholarships([]);
      setApplications({});
      setMessages(MOCK_MENTOR_CHAT);
      setVaultDocs([
        { id: 'aadhaar', name: 'Aadhaar Card (Identity Proof)', status: 'Missing', file: null, date: null },
        { id: 'income', name: 'Income Certificate', status: 'Missing', file: null, date: null },
        { id: 'marksheet_12', name: 'Class 12 Marksheet', status: 'Missing', file: null, date: null },
        { id: 'marksheet_10', name: 'Class 10 Marksheet', status: 'Missing', file: null, date: null },
        { id: 'domicile', name: 'Domicile Certificate (Address Proof)', status: 'Missing', file: null, date: null }
      ]);
      setActiveTab('dashboard');
      setShowProfileModal(false);
      setShowWelcome(true);
    }
  };

  const handleOpenJargonTerm = (term) => {
    setActiveTerm(term);
    setActiveTab('resources');
    setSelectedScholarshipId(null); // Close detail view drawer
  };

  const handleNavigate = (tabName, detailId = null) => {
    setActiveTab(tabName);
    if (detailId) {
      setSelectedScholarshipId(detailId);
    }
  };

  // Profile modal edit states
  const [editName, setEditName] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editIncome, setEditIncome] = useState('');

  const openProfileEdit = () => {
    if (profile) {
      setEditName(profile.name);
      setEditScore(profile.score);
      setEditIncome(profile.income);
      setShowProfileModal(true);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const updatedStudent = await api.updateProfile(studentId, {
        name: editName,
        score: editScore,
        income: editIncome
      });
      setProfile(prev => ({
        ...prev,
        name: updatedStudent.name,
        score: String(updatedStudent.score),
        income: String(Math.round(updatedStudent.annual_family_income))
      }));
      setShowProfileModal(false);
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  };

  // If loading and student exists, show loading screen
  if (loading && studentId) {
    return (
      <div style={{
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <GraduationCap size={48} style={{ color: 'var(--primary)', margin: '0 auto 16px auto', display: 'block', animation: 'pulse 1.5s infinite' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>Scholar Mate</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading your secure profile portfolio...</p>
        </div>
      </div>
    );
  }

  // If no profile, show WelcomeScreen first, then Onboarding form
  if (!profile) {
    if (showWelcome) {
      return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
    }
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const selectedScholarship = SCHOLARSHIPS.find(s => s.id === selectedScholarshipId);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">F</div>
          <div className="logo-text">
            <h1>Scholar Mate</h1>
            <span>First-Gen Navigator</span>
          </div>
        </div>

        <div style={{
          padding: '0 24px 16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* Language Selector */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px', 
            background: 'var(--bg-secondary)', 
            padding: '4px 8px', 
            borderRadius: '6px', 
            border: '1px solid var(--border-color)',
            flex: 1
          }}>
            <Globe size={12} color="var(--text-secondary)" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                width: '100%',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
          </div>

          {/* Notification Button */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showNotifications ? 'var(--primary)' : 'var(--text-secondary)',
                backgroundColor: showNotifications ? 'var(--primary-light)' : 'var(--bg-secondary)'
              }}
              title="Alerts & Logs"
            >
              <Bell size={14} />
              {notifications.some(n => n.unread) && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '6px',
                  height: '6px',
                  background: 'var(--error)',
                  borderRadius: '50%'
                }}></span>
              )}
            </button>

            {/* Notification Dropdown inside Sidebar */}
            {showNotifications && (
              <div style={{
                position: 'fixed',
                left: '260px',
                top: '75px',
                width: '320px',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 999
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Alerts & Meta Logs
                  </span>
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                      setShowNotifications(false);
                    }}
                    style={{ border: 'none', background: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '20px 0' }}>
                      No alerts yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '8px',
                        background: n.unread ? 'rgba(2, 132, 199, 0.02)' : 'transparent',
                        borderRadius: '6px',
                        borderLeft: n.type === 'whatsapp' ? '3px solid #25D366' : '3px solid var(--primary)',
                        border: '1px solid var(--border-color)',
                        borderLeftWidth: '3px',
                        fontSize: '11px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          <span>{n.title}</span>
                          <span style={{ fontSize: '8px', color: 'var(--text-muted)', fontWeight: 400 }}>{n.time}</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '10.5px', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="nav-links">
            <li>
              <button 
                className={`nav-link-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavigate('dashboard')}
              >
                <Home size={18} /> {t('dashboard')}
              </button>
            </li>
            <li>
              <button 
                className={`nav-link-btn ${activeTab === 'scholarships' ? 'active' : ''}`}
                onClick={() => handleNavigate('scholarships')}
              >
                <Search size={18} /> {t('discover')}
              </button>
            </li>
            <li>
              <button 
                className={`nav-link-btn ${activeTab === 'tracker' ? 'active' : ''}`}
                onClick={() => handleNavigate('tracker')}
              >
                <ClipboardList size={18} /> {t('tracker')}
              </button>
            </li>
            <li>
              <button 
                className={`nav-link-btn ${activeTab === 'resources' ? 'active' : ''}`}
                onClick={() => handleNavigate('resources')}
              >
                <BookOpen size={18} /> {t('resources')}
              </button>
            </li>
            <li>
              <button 
                className={`nav-link-btn ${activeTab === 'mentor' ? 'active' : ''}`}
                onClick={() => handleNavigate('mentor')}
              >
                <MessageSquare size={18} /> {t('mentor')}
              </button>
            </li>
            <li>
              <button 
                className={`nav-link-btn ${activeTab === 'vault' ? 'active' : ''}`}
                onClick={() => handleNavigate('vault')}
              >
                <FolderLock size={18} /> {t('vault')}
              </button>
            </li>
            <li>
              <button 
                className={`nav-link-btn ${activeTab === 'ecolabs' ? 'active' : ''}`}
                onClick={() => handleNavigate('ecolabs')}
              >
                <Beaker size={18} /> EcoLabs (Beta)
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Profile Card footer */}
        <div className="sidebar-profile-summary">
          <div className="profile-avatar" onClick={openProfileEdit} style={{ cursor: 'pointer' }} title="Edit Profile">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info" style={{ flex: 1 }}>
            <div className="profile-name" onClick={openProfileEdit} style={{ cursor: 'pointer' }} title="Edit Profile">{profile.name}</div>
            <span className="profile-tag">{t('firstGenTag')}</span>
          </div>
          <button 
            onClick={handleResetApp} 
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Workspace content */}
      <main className="main-content">
        {!extensionActive && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>🔌</span>
              <div>
                <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.88rem', marginBottom: '2px' }}>
                  Enable 1-Click Autofill Portal Extension
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: '1.4' }}>
                  Install the ScholarMate Chrome Extension to automatically populate forms and upload documents on real portal sites.
                </span>
              </div>
            </div>
            <button 
              onClick={() => alert("To install:\n1. Open Chrome Menu -> Extensions -> Manage Extensions\n2. Turn on 'Developer mode' (top right)\n3. Click 'Load unpacked' and select the 'extension' directory in your project root!")}
              style={{
                background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                color: 'white',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 3px 8px rgba(14, 165, 233, 0.2)'
              }}
            >
              How to Install ⚙️
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard 
            profile={profile} 
            scholarships={SCHOLARSHIPS}
            savedScholarships={savedScholarships}
            applications={applications}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'scholarships' && (
          <ScholarshipListing 
            profile={profile}
            scholarships={SCHOLARSHIPS}
            savedScholarships={savedScholarships}
            onSaveToggle={handleSaveToggle}
            onOpenDetail={setSelectedScholarshipId}
          />
        )}

        {activeTab === 'tracker' && (
          <Tracker 
            scholarships={SCHOLARSHIPS}
            savedScholarships={savedScholarships}
            applications={applications}
            onStartApplication={handleStartApplication}
            onSubmitApplication={handleSubmitApplication}
            onOpenDetail={setSelectedScholarshipId}
            onRemoveSaved={handleRemoveSaved}
          />
        )}

        {activeTab === 'resources' && (
          <ResourceCenter 
            activeTerm={activeTerm}
            setActiveTerm={setActiveTerm}
          />
        )}

        {activeTab === 'mentor' && (
          <MentorChat 
            studentId={studentId}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeTab === 'vault' && (
          <DocumentVault 
            profile={profile}
            vaultDocs={vaultDocs}
            setVaultDocs={setVaultDocs}
            onOCRUpdate={handleOCRUpdate}
          />
        )}

        {activeTab === 'ecolabs' && (
          <EcoLabs 
            documents={vaultDocs}
            language={language}
            setLanguage={setLanguage}
            setActiveTab={setActiveTab}
          />
        )}
      </main>

      {/* Drawer Overlay for Scholarship Details */}
      {selectedScholarship && (
        <ScholarshipDetail 
          scholarship={selectedScholarship}
          profile={profile}
          application={applications[selectedScholarship.id]}
          onStartApplication={handleStartApplication}
          onToggleChecklistItem={handleToggleChecklistItem}
          onSaveEssay={handleSaveEssay}
          onSubmitApplication={handleSubmitApplication}
          onClose={() => setSelectedScholarshipId(null)}
          onOpenGlossaryTerm={handleOpenJargonTerm}
        />
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="onboarding-backdrop" onClick={() => setShowProfileModal(false)}>
          <form className="onboarding-card" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()} onSubmit={handleSaveProfile}>
            <div className="onboarding-header" style={{ padding: '24px' }}>
              <h2 style={{ fontSize: '20px' }}>Update Profile</h2>
              <p>Change your academic scores or income to see updated matching recommendations.</p>
            </div>
            <div className="onboarding-body" style={{ padding: '24px' }}>
              <div className="form-group">
                <label htmlFor="edit-name">Full Name</label>
                <input 
                  id="edit-name"
                  type="text" 
                  className="form-input" 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-score">Previous Class Score (CGPA out of 10 or %)</label>
                <input 
                  id="edit-score"
                  type="number" 
                  step="0.1"
                  min="0"
                  max="100"
                  className="form-input" 
                  value={editScore} 
                  onChange={(e) => setEditScore(e.target.value)} 
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-income">Annual Family Income Range</label>
                <select 
                  id="edit-income"
                  className="form-input" 
                  value={editIncome} 
                  onChange={(e) => setEditIncome(e.target.value)}
                  required
                >
                  <option value="250000">Under ₹2.5 Lakhs</option>
                  <option value="600000">₹2.5 Lakhs - ₹6 Lakhs</option>
                  <option value="800000">₹6 Lakhs - ₹8 Lakhs</option>
                  <option value="9999999">₹8 Lakhs+</option>
                </select>
              </div>
            </div>
            <div className="onboarding-footer" style={{ padding: '16px 24px' }}>
              <button type="button" className="btn-secondary" onClick={() => setShowProfileModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
