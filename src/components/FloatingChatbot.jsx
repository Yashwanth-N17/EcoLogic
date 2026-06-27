import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, MicOff, Volume2, VolumeX, Sparkles, AlertCircle, RotateCcw, Languages } from 'lucide-react';
import { api } from '../services/api';

const INITIAL_MESSAGES = {
  en: [
    { sender: 'mentor', text: "Namaste! I am Sarah, your AI College & Scholarship Mentor. Ask me any question about application documents, deadlines, or essay drafting!", time: new Date().toISOString() }
  ],
  hi: [
    { sender: 'mentor', text: "नमस्ते! मैं सारा हूँ, आपकी कॉलेज और स्कॉलरशिप मेंटॉर। मुझसे डाक्यूमेंट्स, डेडलाइन्स या निबंध ड्राफ्ट करने के बारे में कोई भी प्रश्न पूछें!", time: new Date().toISOString() }
  ],
  kn: [
    { sender: 'mentor', text: "ನಮಸ್ತೆ! ನಾನು ಸಾರಾ, ನಿಮ್ಮ ಕಾಲೇಜು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ ಮಾರ್ಗದರ್ಶಿ. ದಾಖಲೆಗಳು ಅಥವಾ ಪ್ರಬಂಧಗಳ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ!", time: new Date().toISOString() }
  ]
};

export default function FloatingChatbot({ studentId, language = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  
  // Multilingual & Translation states
  const [chatLanguage, setChatLanguage] = useState(language);
  const [activeTranslateMenuIdx, setActiveTranslateMenuIdx] = useState(null);
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync chatLanguage if global language prop changes
  useEffect(() => {
    setChatLanguage(language);
  }, [language]);

  // Initialize/update messages based on selected chatLanguage
  useEffect(() => {
    const hasUserMessages = messages.some(m => m.sender === 'student');
    if (!hasUserMessages) {
      const initial = INITIAL_MESSAGES[chatLanguage] || INITIAL_MESSAGES['en'];
      setMessages(initial.map(m => ({ ...m, time: new Date().toISOString() })));
    }
  }, [chatLanguage]);

  const handleReload = () => {
    window.speechSynthesis?.cancel();
    setSpeakingId(null);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    const initial = INITIAL_MESSAGES[chatLanguage] || INITIAL_MESSAGES['en'];
    setMessages(initial.map(m => ({ ...m, time: new Date().toISOString() })));
  };

  const handleTranslate = async (messageIdx, targetLang) => {
    const msgToTranslate = messages[messageIdx];
    if (!msgToTranslate) return;
    try {
      const translatedText = await api.translateMessage(msgToTranslate.text, targetLang);
      if (translatedText) {
        setMessages(prev => prev.map((m, idx) => 
          idx === messageIdx ? { ...m, text: translatedText } : m
        ));
      }
    } catch (err) {
      console.error("Translation failed:", err);
    }
  };

  // Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setInputText(prev => prev + (prev ? ' ' : '') + transcript);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      
      recognitionRef.current = rec;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, messages, isTyping]);

  useEffect(() => {
    if (recognitionRef.current) {
      const locales = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
      recognitionRef.current.lang = locales[chatLanguage] || 'en-IN';
    }
  }, [chatLanguage]);

  const toggleListening = () => {
    if (!speechSupported) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      recognitionRef.current.start();
    }
  };

  const speakMessage = (text, idx) => {
    if (!window.speechSynthesis) return;
    if (speakingId === idx) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const locales = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };
    utterance.lang = locales[chatLanguage] || 'en-IN';
    
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    
    setSpeakingId(idx);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText.trim();
    setInputText('');
    
    // Add student message
    const updatedMessages = [...messages, { sender: 'student', text: userMsg, time: new Date().toISOString() }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Call backend FastAPI endpoint which processes queries via Gemini API
      const response = await api.askChatbot(studentId, userMsg);
      setIsTyping(false);
      
      let replyText = response?.reply || response?.response;
      
      if (!replyText) {
        // Fallback local heuristic chatbot logic when backend is offline or fails
        const lowerText = userMsg.toLowerCase().trim();
        const words = lowerText.replace(/[!?,.]/g, '').split(/\s+/);
        const isGreetingOnly = words.length <= 3 && words.some(w => ['hello', 'hi', 'hey', 'namaste', 'नमस्ते', 'ನಮಸ್ತೆ'].includes(w));

        if (isGreetingOnly) {
          if (words.includes('ನಮಸ್ತೆ') || chatLanguage === 'kn') {
            replyText = "ನಮಸ್ತೆ! ನಾನು ಸಾರಾ, ನಿಮ್ಮ ಕಾಲೇಜು ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ ಮಾರ್ಗದರ್ಶಿ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?";
          } else if (words.includes('नमस्ते') || chatLanguage === 'hi') {
            replyText = "नमस्ते! मैं सारा हूँ, आपकी कॉलेज और स्कॉलरशिप मेंटॉर। मैं आपकी क्या मदद कर सकती हूँ?";
          } else {
            replyText = "Hello! I am Sarah, your AI College & Scholarship Mentor. How can I help you today?";
          }
        } else if (lowerText.includes('essay') || lowerText.includes('draft') || lowerText.includes('review')) {
          if (userMsg.split(/\s+/).length > 20) {
            replyText = "Wow, what a powerful draft! I love how you shared your personal story and family motivation. To make it even stronger: 1. Clearly explain how the scholarship funds will cover your B.Tech/B.Sc expenses (like fees or hostel). 2. Make sure to double check that you mention your goals for helping your community. This is an excellent draft!";
          } else {
            replyText = "I would be happy to review your scholarship statement! Please paste your draft essay here. I'll read it and give you suggestions on structure, opening hook, and wording.";
          }
        } else if (lowerText.includes('income') || lowerText.includes('tehsildar') || lowerText.includes('certificate')) {
          replyText = "To get an official Income Certificate, you must apply through your state's online portal (like Mahaonline in Maharashtra, e-District in Delhi/UP, Seva Sindhu in Karnataka) or visit your nearest Maha e-Seva Kendra / Common Service Centre (CSC). You will need your parents' Aadhaar card, ration card, land record details, or a salary declaration signed by the local Panchayat head/Tahsildar.";
        } else if (lowerText.includes('aadhaar') || lowerText.includes('seeding') || lowerText.includes('link') || lowerText.includes('dbt')) {
          replyText = "Aadhaar Seeding links your bank account to your 12-digit Aadhaar card so that DBT (Direct Benefit Transfer) funds arrive securely. To do this, download the 'Aadhaar Seeding Form', fill it out, and submit it at your bank branch. Ask them to verify it on their NPCI mapper portal. You can check the status on the UIDAI portal under 'Aadhaar Bank Seeding Status'.";
        } else if (lowerText.includes('bonafide') || lowerText.includes('stamp') || lowerText.includes('college')) {
          replyText = "A Bonafide Certificate is issued by your college administrative department. Write a simple request letter (we have a copy-paste template in the Resource Center!), attach your college ID and admission fee receipt, and submit it at the clerk's counter. It usually takes 2-3 working days to get signed by the Principal/Registrar.";
        } else if (lowerText.includes('nsp') || lowerText.includes('portal') || lowerText.includes('national')) {
          replyText = "The National Scholarship Portal (NSP) is the central government portal. You need to register as a 'New Student', input your details (Aadhaar, bank IFSC, domicile), and select the scheme you qualify for. Make sure to double check your bank details—an error there can stop your scholarship payments!";
        } else if (['best', 'recommend', 'match', 'eligible', 'which', 'find'].some(kw => lowerText.includes(kw))) {
          replyText = "To find the best scholarships, please complete your student profile on the dashboard. Our system automatically matches your CGPA/grades, state of residence, family income, and category to show you exact matches you qualify for. Navigate to the main dashboard to see your eligible scholarships list!";
        } else if (['step', 'how to apply', 'process', 'procedure', 'how do i', 'how can i apply', 'guideline'].some(kw => lowerText.includes(kw))) {
          replyText = "Here is how to apply step-by-step:\n1. Find matching schemes in the 'Scholarships' tab.\n2. Read the eligibility rules (GPA, caste, and income limits).\n3. Gather your documents (Income certificate, Bonafide letter, bank statement).\n4. Ensure your bank account is seeded with Aadhaar for DBT transfer.\n5. Apply on the official NSP/provider portal before the closing date.";
        } else if (['deadline', 'closing date', 'last date', 'due date', 'when to apply'].some(kw => lowerText.includes(kw))) {
          replyText = "You can find the closing date/deadline for each scheme listed in the 'Scholarships' tab. It is highly recommended to submit your application and upload verified certificates at least a week before the deadline to prevent issues from portal traffic congestion.";
        } else {
          replyText = "I'm here to help you navigate your college and scholarship applications! You can ask me questions like:\n- \"How do I link my **Aadhaar** to my bank account?\"\n- \"What are the steps to get an **Income Certificate**?\"\n- \"How can I request a **Bonafide Certificate** from my college?\"\n- \"Which scholarship is the **best scholarship** for me?\"\n- \"What are the **steps to apply**?\"\nOr paste your draft essay here and I'll review it for you!";
        }
      }
      
      setMessages(prev => [...prev, { sender: 'mentor', text: replyText, time: new Date().toISOString() }]);
    } catch (err) {
      console.error("Backend query failed:", err);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        sender: 'mentor',
        text: "Sorry, I had trouble connecting to the backend server. Please make sure FastAPI is running.",
        time: new Date().toISOString()
      }]);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: "'Inter', sans-serif" }}>
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(14, 165, 233, 0.45)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.08) translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(14, 165, 233, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(14, 165, 233, 0.45)';
          }}
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div style={{
          width: '380px',
          height: '520px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          
          {/* Header strip */}
          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>S</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>Sarah Jenkins</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  AI Mentor online
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Language Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <select
                  value={chatLanguage}
                  onChange={(e) => setChatLanguage(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.75rem',
                    padding: '4px 8px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  <option value="en" style={{ background: '#1e293b', color: '#fff' }}>English</option>
                  <option value="hi" style={{ background: '#1e293b', color: '#fff' }}>हिन्दी</option>
                  <option value="kn" style={{ background: '#1e293b', color: '#fff' }}>ಕನ್ನಡ</option>
                </select>
              </div>

              {/* Reload Button */}
              <button 
                onClick={handleReload}
                title="Reset conversation"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff', 
                  cursor: 'pointer', 
                  opacity: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
              >
                <RotateCcw size={16} />
              </button>

              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            
            {/* Conversation list */}
            <div style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {messages.map((msg, idx) => {
                const isMentor = msg.sender === 'mentor';
                const isSpeaking = speakingId === idx;
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: isMentor ? 'flex-start' : 'flex-end',
                    alignItems: 'flex-end',
                    gap: '6px'
                  }}>
                    {isMentor && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>S</div>
                    )}
                    <div style={{
                      maxWidth: '80%',
                      background: isMentor ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                      border: isMentor ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      borderRadius: isMentor ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                      padding: '0.65rem 0.85rem',
                      position: 'relative'
                    }}>
                      <div style={{ color: '#fff', fontSize: '0.8rem', lineHeight: '1.4', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '8px' }}>
                        <span style={{ fontSize: '0.62rem', color: isMentor ? '#475569' : 'rgba(255,255,255,0.7)' }}>
                          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMentor && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
                            <button 
                              onClick={() => speakMessage(msg.text, idx)}
                              title="Read aloud"
                              style={{
                                background: isSpeaking ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                                border: 'none',
                                color: isSpeaking ? '#0ea5e9' : '#475569',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {isSpeaking ? <VolumeX size={10} /> : <Volume2 size={10} />}
                            </button>

                            <button
                              onClick={() => setActiveTranslateMenuIdx(activeTranslateMenuIdx === idx ? null : idx)}
                              title="Translate message"
                              style={{
                                background: activeTranslateMenuIdx === idx ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                                border: 'none',
                                color: activeTranslateMenuIdx === idx ? '#0ea5e9' : '#475569',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Languages size={10} />
                            </button>

                            {activeTranslateMenuIdx === idx && (
                              <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                right: '0',
                                background: '#1e293b',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                padding: '4px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                zIndex: 1000,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                minWidth: '80px'
                              }}>
                                <button
                                  onClick={() => {
                                    handleTranslate(idx, 'en');
                                    setActiveTranslateMenuIdx(null);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    padding: '4px 6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    borderRadius: '4px',
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  English
                                </button>
                                <button
                                  onClick={() => {
                                    handleTranslate(idx, 'hi');
                                    setActiveTranslateMenuIdx(null);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    padding: '4px 6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    borderRadius: '4px',
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  हिन्दी
                                </button>
                                <button
                                  onClick={() => {
                                    handleTranslate(idx, 'kn');
                                    setActiveTranslateMenuIdx(null);
                                  }}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.7rem',
                                    padding: '4px 6px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    borderRadius: '4px',
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  ಕನ್ನಡ
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>S</div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px 16px 16px 4px', padding: '0.6rem 0.8rem', color: '#475569', fontSize: '0.75rem' }}>
                    typing...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input strip */}
            <div style={{
              padding: '0.75rem 1rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {speechSupported && (
                <button
                  onClick={toggleListening}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isListening ? '#ef4444' : 'rgba(255,255,255,0.05)',
                    color: isListening ? '#fff' : '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isListening ? '0 0 8px #ef4444' : 'none'
                  }}
                >
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              )}
              <input
                type="text"
                placeholder={isListening ? "Listening..." : "Ask Sarah a question..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isListening}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  borderRadius: '10px',
                  border: isListening ? '1.5px solid #ef4444' : '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: 'none',
                  background: inputText.trim() ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: inputText.trim() ? 1 : 0.4
                }}
              >
                <Send size={14} />
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
