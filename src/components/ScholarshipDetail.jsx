import React, { useState } from 'react';
import { X, CheckCircle, XCircle, BookOpen, Check, Info } from 'lucide-react';

export default function ScholarshipDetail({ 
  scholarship, 
  profile, 
  application, 
  onStartApplication, 
  onToggleChecklistItem, 
  onSaveEssay, 
  onSubmitApplication, 
  onClose,
  onOpenGlossaryTerm,
  onOpenInAppBrowser
}) {
  const [activeTab, setActiveTab] = useState('eligibility');
  const [essayText, setEssayText] = useState(application?.essay || '');
  const [showExtensionGuide, setShowExtensionGuide] = useState(false);

  const criteria = scholarship.eligibilityCriteria;
  
  // Normalize user score to 10-point scale
  const userScore = parseFloat(profile.score);
  const userGpa = userScore > 10 ? userScore / 10 : userScore; // 85% becomes 8.5
  
  const checks = {
    gpa: criteria.gpaMin ? userGpa >= criteria.gpaMin : true,
    firstGen: criteria.firstGenRequired ? profile.firstGen === 'yes' : true,
    income: criteria.incomeMax ? (profile.income === '' ? false : parseFloat(profile.income) <= criteria.incomeMax) : true,
    caste: criteria.casteRequired ? criteria.casteRequired.includes(profile.category) : true,
    gender: criteria.genderRequired ? criteria.genderRequired === profile.gender : true,
    residency: criteria.stateResidency ? criteria.stateResidency.includes(profile.state) : true,
    academicLevel: criteria.academicLevel ? criteria.academicLevel.some(lvl => profile.academicLevel.includes(lvl.split(" ")[0])) : true
  };

  const status = application?.status || 'Not Started';
  const checklist = application?.checklist || {};

  const handleEssayChange = (e) => {
    const text = e.target.value;
    setEssayText(text);
    onSaveEssay(scholarship.id, text);
  };

  const getWordCount = (text) => {
    return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  };

  // Plain jargon explainer triggers
  const renderJargonLink = (term) => {
    return (
      <span 
        className="plain-jargon-link" 
        onClick={() => onOpenGlossaryTerm(term)}
      >
        {term}
      </span>
    );
  };

  // Steps completed calculations
  const totalSteps = scholarship.requirements.length;
  const completedSteps = Object.keys(checklist).filter(id => checklist[id]).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        
        <div className="drawer-header">
          <button className="close-btn" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--primary)' }}>
            {scholarship.provider}
          </span>
          <h2 style={{ fontSize: '22px', marginTop: '4px', paddingRight: '40px' }}>{scholarship.title}</h2>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span><strong>Amount:</strong> <span style={{ color: 'var(--primary)', fontWeight: '750' }}>{scholarship.amountFormatted}</span></span>
            <span><strong>Deadline:</strong> {new Date(scholarship.deadline).toLocaleDateString('en-IN')}</span>
            <span><strong>Status:</strong> <span style={{ 
              fontWeight: '700', 
              color: status === 'Submitted' ? 'var(--success)' : status === 'In Progress' ? 'var(--warning)' : 'var(--text-muted)' 
            }}>{status}</span></span>
          </div>
        </div>

        <div className="drawer-tabs" style={{ padding: '0 32px' }}>
          <button 
            className={`drawer-tab ${activeTab === 'eligibility' ? 'active' : ''}`}
            onClick={() => setActiveTab('eligibility')}
          >
            Eligibility Checker
          </button>
          <button 
            className={`drawer-tab ${activeTab === 'checklist' ? 'active' : ''}`}
            onClick={() => setActiveTab('checklist')}
            disabled={status === 'Not Started'}
            style={{ opacity: status === 'Not Started' ? 0.5 : 1, cursor: status === 'Not Started' ? 'not-allowed' : 'pointer' }}
            title={status === 'Not Started' ? "Start application to unlock checklist" : ""}
          >
            Checklist ({completedSteps}/{totalSteps})
          </button>
          <button 
            className={`drawer-tab ${activeTab === 'essay' ? 'active' : ''}`}
            onClick={() => setActiveTab('essay')}
            disabled={status === 'Not Started'}
            style={{ opacity: status === 'Not Started' ? 0.5 : 1, cursor: status === 'Not Started' ? 'not-allowed' : 'pointer' }}
            title={status === 'Not Started' ? "Start application to unlock essay builder" : ""}
          >
            Essay Workspace
          </button>
        </div>

        <div className="drawer-body">
          {activeTab === 'eligibility' && (
            <div>
              <div className="eligibility-checker">
                <h4>
                  <BookOpen size={18} color="var(--primary)" /> Instant Eligibility Verification
                </h4>
                <div className="eligibility-list">
                  {/* GPA */}
                  {criteria.gpaMin && (
                    <div className="eligibility-item">
                      <div className={`eligibility-icon-wrapper ${checks.gpa ? 'success' : 'error'}`}>
                        {checks.gpa ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="eligibility-item-text">
                        <strong>Marks Requirement: Equivalent to {criteria.gpaMin * 10}% / {criteria.gpaMin} CGPA</strong>
                        Your profile score is {profile.score}. {checks.gpa ? "You meet the academic eligibility threshold!" : "Your current score is below the cut-off for this scholarship."}
                      </div>
                    </div>
                  )}

                  {/* Caste Category */}
                  {criteria.casteRequired && (
                    <div className="eligibility-item">
                      <div className={`eligibility-icon-wrapper ${checks.caste ? 'success' : 'error'}`}>
                        {checks.caste ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="eligibility-item-text">
                        <strong>Category Required: {criteria.casteRequired.join(', ')}</strong>
                        Your category is {profile.category}. {checks.caste ? "Matches category guidelines!" : `This scheme has reservation benefits specifically for ${criteria.casteRequired.join(', ')} students.`}
                      </div>
                    </div>
                  )}

                  {/* Gender */}
                  {criteria.genderRequired && (
                    <div className="eligibility-item">
                      <div className={`eligibility-icon-wrapper ${checks.gender ? 'success' : 'error'}`}>
                        {checks.gender ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="eligibility-item-text">
                        <strong>Gender Rule: {criteria.genderRequired} students</strong>
                        You identify as {profile.gender}. {checks.gender ? "Matches scheme gender target!" : `This program is exclusively designed for ${criteria.genderRequired} students.`}
                      </div>
                    </div>
                  )}

                  {/* First-Gen */}
                  {criteria.firstGenRequired && (
                    <div className="eligibility-item">
                      <div className={`eligibility-icon-wrapper ${checks.firstGen ? 'success' : 'error'}`}>
                        {checks.firstGen ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="eligibility-item-text">
                        <strong>First-Generation Student Status Preferred/Required</strong>
                        {checks.firstGen 
                          ? "Matches! You are marked as a first-generation college student." 
                          : "Preference is given to students whose parents did not finish a Bachelor's degree."}
                      </div>
                    </div>
                  )}

                  {/* Income */}
                  {criteria.incomeMax && (
                    <div className="eligibility-item">
                      <div className={`eligibility-icon-wrapper ${checks.income ? 'success' : 'error'}`}>
                        {checks.income ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="eligibility-item-text">
                        <strong>Income Threshold: Max ₹{(criteria.incomeMax / 100000).toFixed(1)} Lakhs / yr</strong>
                        {checks.income 
                          ? "Matches! Your family income falls within the eligible bracket." 
                          : `Your income exceeds the maximum limit of ₹${(criteria.incomeMax / 100000).toFixed(1)} Lakhs.`}
                      </div>
                    </div>
                  )}

                  {/* Domicile State */}
                  {criteria.stateResidency && (
                    <div className="eligibility-item">
                      <div className={`eligibility-icon-wrapper ${checks.residency ? 'success' : 'error'}`}>
                        {checks.residency ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="eligibility-item-text">
                        <strong>Domicile Residency: {criteria.stateResidency.join(', ')}</strong>
                        {checks.residency 
                          ? `Matches! You have domicile residency in state: ${profile.state}.` 
                          : `Eligible states: ${criteria.stateResidency.join(', ')}. Your state: ${profile.state}`}
                      </div>
                    </div>
                  )}

                  {/* Academic Level */}
                  {criteria.academicLevel && (
                    <div className="eligibility-item">
                      <div className={`eligibility-icon-wrapper ${checks.academicLevel ? 'success' : 'error'}`}>
                        {checks.academicLevel ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </div>
                      <div className="eligibility-item-text">
                        <strong>Study Level: {criteria.academicLevel.join(', ')}</strong>
                        {checks.academicLevel 
                          ? `Matches! Your level (${profile.academicLevel}) is eligible.` 
                          : `Eligible levels: ${criteria.academicLevel.join(', ')}. Your level: ${profile.academicLevel}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <h4 style={{ fontSize: '15px', marginBottom: '10px' }}>Scheme Details</h4>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  {scholarship.details}
                </p>
              </div>

              {scholarship.officialUrl && (
                <div className="official-portal-card" style={{ 
                  marginBottom: '28px', 
                  padding: '16px 20px', 
                  backgroundColor: 'var(--primary-light)', 
                  border: '1.5px dashed var(--border-focus)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: '14px', color: 'var(--primary-dark)', fontWeight: '700', marginBottom: '4px' }}>Official Application Platform</h5>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                      Submit your application directly on the provider's official website.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => {
                        window.open(scholarship.officialUrl || 'https://scholarships.gov.in', '_blank');
                        setShowExtensionGuide(true);
                        if (status === 'Not Started') {
                          onStartApplication(scholarship.id);
                        }
                      }}
                      className="btn-primary"
                      style={{ 
                        fontSize: '13.5px', 
                        padding: '11px 18px', 
                        whiteSpace: 'nowrap',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
                      }}
                    >
                      🚀 Autofill via Chrome Extension
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px' }}>
                {status === 'Not Started' ? (
                  <button 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '12px' }}
                    onClick={() => {
                      onStartApplication(scholarship.id);
                      setActiveTab('checklist');
                    }}
                  >
                    Start Tracker Workflow
                  </button>
                ) : status === 'In Progress' ? (
                  <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <button 
                      className="btn-secondary" 
                      style={{ flex: 1 }}
                      onClick={() => setActiveTab('checklist')}
                    >
                      View Checklist
                    </button>
                    <button 
                      className="btn-primary" 
                      style={{ flex: 1, backgroundColor: 'var(--success)' }}
                      onClick={() => onSubmitApplication(scholarship.id)}
                      disabled={progressPercent < 100}
                      title={progressPercent < 100 ? "Complete all checklist items to submit!" : ""}
                    >
                      Submit Application
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '100%', textAlign: 'center', padding: '12px', backgroundColor: 'var(--success-light)', color: 'var(--success-dark)', borderRadius: '8px', fontWeight: '600' }}>
                    ✓ Application Submitted on {new Date(application.submittedAt || new Date()).toLocaleDateString('en-IN')}
                  </div>
                )}
              </div>
              
              {status === 'In Progress' && progressPercent < 100 && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
                  * Finish all {totalSteps} tasks in the "Checklist" tab to unlock the submit button.
                </p>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="checklist-section">
              <div>
                <div style={{ display: 'flex', justifyContent: 'between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
                  <span>Tasks Completed</span>
                  <span style={{ marginLeft: 'auto' }}>{progressPercent}%</span>
                </div>
                <div className="checklist-progress-bar">
                  <div className="checklist-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              {scholarship.requirements.map(req => {
                const isItemCompleted = !!checklist[req.id];
                return (
                  <div key={req.id} className="checklist-item">
                    <div className="checklist-item-header">
                      <div 
                        className={`checkbox-custom ${isItemCompleted ? 'checked' : ''}`}
                        onClick={() => onToggleChecklistItem(scholarship.id, req.id)}
                      >
                        {isItemCompleted && <Check size={14} />}
                      </div>
                      <span className={`checklist-item-title ${isItemCompleted ? 'completed' : ''}`}>
                        {req.name}
                      </span>
                    </div>

                    <div className="checklist-item-details">
                      <p>{req.plainExplanation}</p>
                      
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Document jargon helper: {renderJargonLink(req.jargonTerm)}
                      </div>

                      <div className="mentor-tip-box">
                        <Info size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                          <strong>First-Gen Tip:</strong> {req.mentorTip}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {status === 'In Progress' && (
                <button 
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--text-muted)', cursor: progressPercent === 100 ? 'pointer' : 'not-allowed' }}
                  disabled={progressPercent < 100}
                  onClick={() => {
                    onSubmitApplication(scholarship.id);
                    setActiveTab('eligibility');
                  }}
                >
                  Mark Application as Submitted
                </button>
              )}
            </div>
          )}

          {activeTab === 'essay' && (
            <div className="essay-builder-container">
              <div className="essay-prompt-box">
                <strong>📝 Personal Statement Prompt:</strong>
                <p style={{ marginTop: '6px', fontWeight: '500' }}>{scholarship.essayPrompt}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Draft Your Statement</label>
                <textarea
                  className="essay-editor"
                  placeholder="Start typing your story in English or local language..."
                  value={essayText}
                  onChange={handleEssayChange}
                ></textarea>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Outline: 1. Your family background. 2. Educational challenges. 3. Future career target.
                  </span>
                  <span className="word-counter">
                    {getWordCount(essayText)} words
                  </span>
                </div>
              </div>

              <div className="firstgen-explainer" style={{ marginTop: '0', background: 'linear-gradient(135deg, #fef3c7, #fef08a)', borderColor: 'var(--warning)', color: 'var(--warning-dark)' }}>
                <strong>💡 Get Advisor Feedback!</strong>
                Copy your draft and send it to your advisor in the <strong>Mentor Chat</strong> tab. Sarah will read it and suggest changes!
              </div>
            </div>
          )}
        </div>

        </div>

      </div>

      {showExtensionGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '2rem',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              background: 'rgba(14, 165, 233, 0.1)',
              color: 'var(--primary)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem'
            }}>
              🔌
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
              Portal Opened in New Tab!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: '0 0 1.5rem 0' }}>
              We have loaded the official application portal for <strong>{scholarship.title}</strong> in a new browser tab.
            </p>

            <div style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem'
            }}>
              <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                How to Autofill:
              </h5>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.83rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Switch to the newly opened tab.</li>
                <li>Click the puzzle piece icon (Extensions) in the top-right toolbar of Chrome.</li>
                <li>Select the <strong>EcoLogic ScholarMate Autofill</strong> extension.</li>
                <li>Click <strong>⚡ Autofill This Portal Form</strong> to instantly populate all details!</li>
              </ol>
            </div>

            <button 
              onClick={() => setShowExtensionGuide(false)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--primary), #6366f1)'
              }}
            >
              Got it, continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
