import React from 'react';
import { GraduationCap, Award, ClipboardList, BookOpen, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';

export default function WelcomeScreen({ onStart }) {
  const highlights = [
    {
      icon: <Award size={24} className="welcome-feature-icon" style={{ color: '#0ea5e9' }} />,
      title: "Smart Matching",
      desc: "Get matched to scholarships based on your academic score, category caste, domicile state, and family income."
    },
    {
      icon: <ClipboardList size={24} className="welcome-feature-icon" style={{ color: '#0284c7' }} />,
      title: "Task-by-Task Tracker",
      desc: "Never miss a deadline. Break down applications into a checklist of documents, essays, and references."
    },
    {
      icon: <BookOpen size={24} className="welcome-feature-icon" style={{ color: '#0ea5e9' }} />,
      title: "Plain-English Glossary",
      desc: "No more confusing administrative jargon. Understand terms like Bonafide Stamps and Tehsildar Certificates instantly."
    },
    {
      icon: <MessageSquare size={24} className="welcome-feature-icon" style={{ color: '#0369a1' }} />,
      title: "Mentor Advisor",
      desc: "Receive guidance, request letter templates, and get your essay drafts reviewed by a college advisor."
    }
  ];

  return (
    <div className="onboarding-backdrop welcome-screen-bg">
      <div className="welcome-bg-container">
        {/* Animated Floating Background Shapes */}
        <div className="floating-bubble bubble-1"></div>
        <div className="floating-bubble bubble-2"></div>
        <div className="floating-bubble bubble-3"></div>
        <div className="floating-bubble bubble-4"></div>

        {/* Rising Sparkle Particles */}
        <div className="sparkle-particle sparkle-1"></div>
        <div className="sparkle-particle sparkle-2"></div>
        <div className="sparkle-particle sparkle-3"></div>
        <div className="sparkle-particle sparkle-4"></div>
        <div className="sparkle-particle sparkle-5"></div>
        <div className="sparkle-particle sparkle-6"></div>
      </div>

      <div className="welcome-screen-card">
        <div className="welcome-screen-header">
          <div className="welcome-logo-glow">
            <GraduationCap size={44} color="white" />
          </div>
          <h1 className="animate-fade-in-up">Scholar Mate</h1>
          <p className="welcome-subtitle animate-fade-in-up-delayed">
            <Sparkles size={14} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
            The First-Gen College Scholar Navigator (India)
          </p>
        </div>

        <div className="welcome-screen-body">
          <p className="welcome-intro-text animate-fade-in-up-delayed-2">
            Paving the path to higher education can be confusing when you are doing it for the first time in your family. 
            We are here to explain the rules, organize your documents, and guide you through every application step.
          </p>

          <div className="welcome-features-grid">
            {highlights.map((item, idx) => (
              <div 
                key={idx} 
                className={`welcome-feature-card animate-cascade-${idx + 1}`}
              >
                <div className="welcome-feature-icon-wrapper">
                  {item.icon}
                </div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="welcome-screen-footer animate-fade-in-up-delayed-3">
          <button className="btn-primary welcome-cta-btn" onClick={onStart}>
            Get Started
            <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </div>
    </div>
  );
}
