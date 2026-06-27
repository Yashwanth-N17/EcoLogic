import React, { useState } from 'react';
import { GraduationCap, IndianRupee, MapPin, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi (NCT)", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman & Nicobar Islands", "Lakshadweep", "Dadra & Nagar Haveli", "Other"
];

const ACADEMIC_LEVELS = [
  { id: 'class11', label: 'Class 11', emoji: '📗', desc: 'Currently in 11th Standard' },
  { id: 'class12', label: 'Class 12', emoji: '📘', desc: 'Currently in 12th / Appeared' },
  { id: 'diploma', label: 'Diploma / ITI', emoji: '🔧', desc: 'Polytechnic or ITI Course' },
  { id: 'ug1', label: 'UG — 1st Year', emoji: '🎓', desc: 'B.Tech / B.Sc / B.A / B.Com etc.' },
  { id: 'ug2', label: 'UG — 2nd Year', emoji: '🎓', desc: 'B.Tech / B.Sc / B.A / B.Com etc.' },
  { id: 'ug3', label: 'UG — 3rd Year', emoji: '🎓', desc: 'B.Tech / B.Sc / B.A / B.Com etc.' },
  { id: 'ug4', label: 'UG — 4th Year', emoji: '🎓', desc: 'B.Tech / B.E (4-year programs)' },
  { id: 'pg1', label: 'PG — 1st Year', emoji: '🏅', desc: 'M.Tech / M.Sc / MBA / M.A etc.' },
  { id: 'pg2', label: 'PG — 2nd Year', emoji: '🏅', desc: 'M.Tech / M.Sc / MBA / M.A etc.' },
];

const INCOME_RANGES = [
  { value: '100000', label: 'Under ₹1 Lakh', sub: 'BPL / Very Low Income' },
  { value: '250000', label: '₹1L – ₹2.5 Lakhs', sub: 'NSP eligible range' },
  { value: '450000', label: '₹2.5L – ₹4.5 Lakhs', sub: 'Most state DBT range' },
  { value: '600000', label: '₹4.5L – ₹6 Lakhs', sub: 'EWS / Merit schemes' },
  { value: '800000', label: '₹6L – ₹8 Lakhs', sub: 'Private CSR fellowships' },
  { value: '9999999', label: 'Above ₹8 Lakhs', sub: 'Merit-only scholarships' },
];

const CATEGORIES = [
  { value: 'SC', label: 'SC', full: 'Scheduled Caste', color: '#f59e0b' },
  { value: 'ST', label: 'ST', full: 'Scheduled Tribe', color: '#10b981' },
  { value: 'OBC', label: 'OBC', full: 'Other Backward Class', color: '#6366f1' },
  { value: 'EWS', label: 'EWS', full: 'Economically Weaker Section', color: '#ec4899' },
  { value: 'General', label: 'General', full: 'General / Open Category', color: '#64748b' },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    academicLevel: '',
    score: '',
    income: '',
    category: '',
    state: '',
    gender: '',
  });

  const set = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const isValid = () => {
    if (step === 1) return formData.academicLevel !== '' && formData.score !== '' && parseFloat(formData.score) >= 0;
    if (step === 2) return formData.income !== '' && formData.category !== '';
    if (step === 3) return formData.state !== '' && formData.gender !== '';
    return false;
  };

  const next = () => {
    if (step < 3) setStep(s => s + 1);
    else onComplete({
      ...formData,
      firstGen: 'yes', // default for first-gen platform
      academicLevel: formData.academicLevel,
      name: 'Student',
    });
  };

  const back = () => setStep(s => s - 1);

  // Count how many scholarships roughly match (shown on step 3 as encouragement)
  const estimatedMatches = () => {
    let base = 18;
    if (parseFloat(formData.score) >= 80) base += 5;
    if (parseFloat(formData.income) <= 250000) base += 8;
    if (formData.category === 'SC' || formData.category === 'ST') base += 6;
    if (formData.gender === 'Female') base += 4;
    return Math.min(base, 38);
  };

  const stepTitles = [
    { icon: <GraduationCap size={20} />, label: 'Academic Background' },
    { icon: <IndianRupee size={20} />, label: 'Income & Category' },
    { icon: <MapPin size={20} />, label: 'Location & Identity' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
          padding: '1.5rem 2rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Sparkles size={18} color="rgba(255,255,255,0.9)" />
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Scholar Mate · EcoLogic
            </span>
          </div>
          <h2 style={{ color: '#fff', margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: '700' }}>
            {stepTitles[step - 1].label}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0', fontSize: '0.85rem' }}>
            Step {step} of 3 — We'll match scholarships instantly
          </p>

          {/* Progress Bar */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: '4px', borderRadius: '4px',
                background: i <= step ? '#fff' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.3s ease'
              }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '1.75rem 2rem' }}>

          {/* STEP 1: Academic Level + Marks */}
          {step === 1 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                📚 Select your current academic level and enter your last examination marks.
              </p>

              {/* Academic Level Grid */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Current Academic Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {ACADEMIC_LEVELS.map(level => (
                    <div
                      key={level.id}
                      onClick={() => set('academicLevel', level.id)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '10px',
                        border: `1px solid ${formData.academicLevel === level.id ? '#0ea5e9' : 'rgba(255,255,255,0.08)'}`,
                        background: formData.academicLevel === level.id ? 'rgba(14, 165, 233, 0.12)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{level.emoji}</span>
                      <div>
                        <div style={{ color: formData.academicLevel === level.id ? '#0ea5e9' : '#e2e8f0', fontWeight: '600', fontSize: '0.8rem' }}>
                          {level.label}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{level.desc}</div>
                      </div>
                      {formData.academicLevel === level.id && (
                        <Check size={14} color="#0ea5e9" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Marks Input */}
              <div>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Previous Exam Score
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.score}
                    onChange={e => set('score', e.target.value)}
                    placeholder="e.g. 85 or 8.5"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: `1px solid ${formData.score ? '#0ea5e9' : 'rgba(255,255,255,0.1)'}`,
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  Enter percentage (e.g. 85%) or CGPA out of 10 (e.g. 8.5). Both are accepted.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Income + Category */}
          {step === 2 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                💰 This helps us find need-based government schemes and your reservation benefits.
              </p>

              {/* Income Ranges */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Annual Family Income (Gross)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {INCOME_RANGES.map(range => (
                    <div
                      key={range.value}
                      onClick={() => set('income', range.value)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: `1px solid ${formData.income === range.value ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                        background: formData.income === range.value ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ color: formData.income === range.value ? '#10b981' : '#e2e8f0', fontWeight: '600', fontSize: '0.82rem' }}>
                        {range.label}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>{range.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Category */}
              <div>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Social Category (Reservation / Caste Certificate)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {CATEGORIES.map(cat => (
                    <div
                      key={cat.value}
                      onClick={() => set('category', cat.value)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: `1px solid ${formData.category === cat.value ? cat.color : 'rgba(255,255,255,0.08)'}`,
                        background: formData.category === cat.value ? `${cat.color}18` : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          background: cat.color,
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                        }}>{cat.label}</span>
                        <span style={{ color: '#cbd5e1', fontSize: '0.83rem' }}>{cat.full}</span>
                      </div>
                      {formData.category === cat.value && <Check size={16} color={cat.color} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: State + Gender */}
          {step === 3 && (
            <div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                🗺️ State-specific DBT schemes and gender-based scholarships like Pragati, Saksham, and Vigyan Jyoti will be matched.
              </p>

              {/* State */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Home State (Domicile / Native State)
                </label>
                <select
                  value={formData.state}
                  onChange={e => set('state', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: `1px solid ${formData.state ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                    background: 'rgba(15,23,42,0.8)',
                    color: '#e2e8f0',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Select your State / UT --</option>
                  {STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                  Gender
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {['Female', 'Male', 'Other'].map(g => (
                    <div
                      key={g}
                      onClick={() => set('gender', g)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        border: `1px solid ${formData.gender === g ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                        background: formData.gender === g ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: formData.gender === g ? '#818cf8' : '#94a3b8',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {g === 'Female' ? '👩 ' : g === 'Male' ? '👨 ' : '🧑 '}{g}
                    </div>
                  ))}
                </div>
              </div>

              {/* Estimated matches preview */}
              {formData.state && formData.gender && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}>
                  <Sparkles size={20} color="#10b981" />
                  <div>
                    <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1rem' }}>
                      ~{estimatedMatches()} Scholarships Found!
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                      Tap "Show My Scholarships" to see your personalized list.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 2rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {step > 1 ? (
            <button
              onClick={back}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                color: '#94a3b8', padding: '0.65rem 1.2rem', borderRadius: '8px',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
              }}
            >
              <ArrowLeft size={15} /> Back
            </button>
          ) : <div />}

          <button
            onClick={next}
            disabled={!isValid()}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: isValid() ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'rgba(255,255,255,0.05)',
              color: isValid() ? '#fff' : '#475569',
              border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px',
              cursor: isValid() ? 'pointer' : 'not-allowed',
              fontWeight: '700', fontSize: '0.9rem',
              transition: 'all 0.2s',
              boxShadow: isValid() ? '0 4px 15px rgba(14, 165, 233, 0.3)' : 'none',
            }}
          >
            {step === 3 ? '✨ Show My Scholarships' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
