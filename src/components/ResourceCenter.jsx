import React, { useState } from 'react';
import { GLOSSARY, FAQ } from '../data';
import { BookOpen, FileText, HelpCircle, Copy, Check } from 'lucide-react';

export default function ResourceCenter({ activeTerm, setActiveTerm }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState('');

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const emailTemplate = `Subject: Request for Letter of Recommendation - [Your Name] (Class 12 / Roll No. [Roll No])

Dear [Teacher's Name],

Hope you are doing well.

I am writing to request a Letter of Recommendation. I am applying for the [Scholarship Name] to support my undergraduate studies in [Your Major, e.g. Computer Engineering]. As I am a first-generation college student, securing this scholarship is critical for me to cover my college admission fees.

I thoroughly enjoyed learning [mention subject, e.g. Mathematics] in your class, particularly when we worked on [mention a project or favorite topic]. I would be highly grateful if you could write a recommendation supporting my academic dedication and character.

The deadline to upload the letter is [Date]. I have attached my Class 10/12 marksheets and a list of my co-curricular activities for your reference.

Thank you so much for your time and guidance!

Sincerely,
[Your Name]
[Contact Number]`;

  const bonafideTemplate = `To,
The Principal / Registrar,
[Name of College / School],
[City, State]

Subject: Application for Bonafide Student Certificate for Scholarship Portal

Respected Sir/Ma'am,

I, [Your Name], am a regular student of your college, currently studying in [Year, e.g. First Year B.Tech], Branch [Branch, e.g. Information Technology], Roll Number [Roll Number]. 

I am a first-generation college student and need to apply for the [Scholarship Name, e.g. AICTE Pragati Scholarship] on the National Scholarship Portal (NSP). For this application, I am required to upload an official Bonafide Student Certificate issued by the college.

I kindly request you to issue me a Bonafide Certificate at the earliest. I have attached my college ID card and recent fee receipt for verification.

Thank you.

Yours obediently,
[Your Name]
[Roll Number / Department]`;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(key);
    setTimeout(() => setCopiedTemplate(''), 2000);
  };

  return (
    <div className="resource-center-view page-shell">
      {/* Clean Header */}
      <div className="dashboard-header-clean">
        <div className="header-greeting">
          <h2>Resource Center</h2>
          <p>Guides, letter templates, and answers to common queries for Indian scholarship portals.</p>
        </div>
      </div>

      <div className="resources-grid-clean">
        
        {/* Dictionary Panel */}
        <div className="jargon-dictionary-clean">
          <div className="dictionary-header-clean">
            <h3>
              <BookOpen size={18} /> Plain-English Dictionary
            </h3>
            <p>
              Govt portals use complex terms. Click a word below to read its explanation.
            </p>
          </div>

          <div className="glossary-terms-list-clean">
            {GLOSSARY.map((item, index) => {
              const isActive = activeTerm === item.term;
              return (
                <div key={index} className="glossary-term-item-clean">
                  <h4 
                    className={`glossary-term-name-clean ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTerm(isActive ? null : item.term)}
                  >
                    {item.term} <span>{isActive ? '▼' : '►'}</span>
                  </h4>
                  {isActive && (
                    <p className="glossary-term-definition-clean">
                      {item.definition}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Guides & Templates Panel */}
        <div className="templates-column-clean">
          
          {/* LoR Template Guide */}
          <div className="clean-section">
            <div className="clean-section-header">
              <h3>
                <FileText size={18} /> Recommendation Request Template
              </h3>
            </div>
            <p className="section-desc-clean">
              Copy and customize this email template to request a letter of recommendation.
            </p>

            <div className="template-box-clean">
              <pre className="template-pre-clean">
                {emailTemplate}
              </pre>
              <button 
                onClick={() => copyToClipboard(emailTemplate, 'lor')}
                className="btn-copy-clean"
                title="Copy Template"
              >
                {copiedTemplate === 'lor' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Bonafide Request Template */}
          <div className="clean-section">
            <div className="clean-section-header">
              <h3>
                <FileText size={18} /> College Bonafide Letter
              </h3>
            </div>
            <p className="section-desc-clean">
              Submit this letter to your college administration department to request a Bonafide Certificate.
            </p>

            <div className="template-box-clean">
              <pre className="template-pre-clean">
                {bonafideTemplate}
              </pre>
              <button 
                onClick={() => copyToClipboard(bonafideTemplate, 'bonafide')}
                className="btn-copy-clean"
                title="Copy Template"
              >
                {copiedTemplate === 'bonafide' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="clean-section">
            <div className="clean-section-header">
              <h3>
                <HelpCircle size={18} /> FAQs for Scholars
              </h3>
            </div>
            
            <div className="faq-list-clean">
              {FAQ.map((faq, idx) => (
                <div key={idx} className="faq-item-clean">
                  <button 
                    className="faq-question-clean"
                    onClick={() => toggleFaq(idx)}
                  >
                    <span>{faq.q}</span>
                    <span className="arrow">{openFaq === idx ? '▲' : '▼'}</span>
                  </button>
                  {openFaq === idx && (
                    <div className="faq-answer-clean">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
