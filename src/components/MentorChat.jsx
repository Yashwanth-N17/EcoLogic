import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { MOCK_MENTOR_CHAT } from '../data';
import { api } from '../services/api';

export default function MentorChat({ studentId, messages, onSendMessage }) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Indian context fast suggestions
  const suggestions = [
    "How to get a Tehsildar Income Certificate?",
    "What is Aadhaar Bank Account Seeding?",
    "How to request a Bonafide Certificate?",
    "Can you review my Pragati scholarship essay?"
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Send user message
    onSendMessage({
      sender: 'student',
      time: new Date().toISOString(),
      text: textToSend
    });
    
    setInputText('');
    setIsTyping(true);

    try {
      const response = await api.askChatbot(studentId, textToSend);
      setIsTyping(false);
      onSendMessage({
        sender: 'mentor',
        time: new Date().toISOString(),
        text: response.reply
      });
    } catch (err) {
      console.error("FastAPI Chatbot query failed, falling back to local heuristics", err);
      // Trigger mock response after a small delay
      setTimeout(() => {
        setIsTyping(false);
        
        const lowerText = textToSend.toLowerCase();
        let reply = "That is a great query! Navigating government portals and revenue offices can be confusing, but you're doing an amazing job. Tell me more, or check the Resource Center for definitions!";

        if (lowerText.includes('essay') || lowerText.includes('draft') || lowerText.includes('review')) {
          if (textToSend.split(/\s+/).length > 20) {
            reply = "Wow, what a powerful draft! I love how you shared your personal story and family motivation. To make it even stronger: 1. Clearly explain how the scholarship funds will cover your B.Tech/B.Sc expenses (like fees or hostel). 2. Make sure to double check that you mention your goals for helping your community. This is an excellent draft!";
          } else {
            reply = "I would be happy to review your scholarship statement! Please paste your draft essay here. I'll read it and give you suggestions on structure, opening hook, and wording.";
          }
        } else if (lowerText.includes('income') || lowerText.includes('tehsildar') || lowerText.includes('certificate')) {
          reply = "To get an official Income Certificate, you must apply through your state's online portal (like Mahaonline in Maharashtra, e-District in Delhi/UP, Seva Sindhu in Karnataka) or visit your nearest Maha e-Seva Kendra / Common Service Centre (CSC). You will need your parents' Aadhaar card, ration card, land record details, or a salary declaration signed by the local Panchayat head/Tahsildar.";
        } else if (lowerText.includes('aadhaar') || lowerText.includes('seeding') || lowerText.includes('link') || lowerText.includes('dbt')) {
          reply = "Aadhaar Seeding links your bank account to your 12-digit Aadhaar card so that DBT (Direct Benefit Transfer) funds arrive securely. To do this, download the 'Aadhaar Seeding Form', fill it out, and submit it at your bank branch. Ask them to verify it on their NPCI mapper portal. You can check the status on the UIDAI portal under 'Aadhaar Bank Seeding Status'.";
        } else if (lowerText.includes('bonafide') || lowerText.includes('stamp') || lowerText.includes('college')) {
          reply = "A Bonafide Certificate is issued by your college administrative department. Write a simple request letter (we have a copy-paste template in the Resource Center!), attach your college ID and admission fee receipt, and submit it at the clerk's counter. It usually takes 2-3 working days to get signed by the Principal/Registrar.";
        } else if (lowerText.includes('nsp') || lowerText.includes('portal') || lowerText.includes('national')) {
          reply = "The National Scholarship Portal (NSP) is the central government portal. You need to register as a 'New Student', input your details (Aadhaar, bank IFSC, domicile), and select the scheme you qualify for. Make sure to double check your bank details—an error there can stop your scholarship payments!";
        }

        onSendMessage({
          sender: 'mentor',
          time: new Date().toISOString(),
          text: reply
        });
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend(inputText);
    }
  };

  return (
    <div className="mentor-chat-view page-shell">
      {/* Clean Header */}
      <div className="dashboard-header-clean">
        <div className="header-greeting">
          <h2>Mentor Support</h2>
          <p>Ask Sarah Jenkins questions about application documents or paste your statement drafts for review.</p>
        </div>
      </div>

      <div className="chat-container-clean">
        
        {/* Sidebar contacts list */}
        <div className="chat-contacts-clean">
          <div className="chat-contacts-header-clean">Advisors</div>
          <div className="contact-item-clean active">
            <div className="contact-avatar-clean">
              S
              <div className="online-indicator-clean"></div>
            </div>
            <div className="contact-info-clean">
              <span className="contact-name-clean">Sarah Jenkins</span>
              <span className="contact-role-clean">First-Gen Advisor</span>
            </div>
          </div>
        </div>

        {/* Main conversation pane */}
        <div className="chat-main-clean">
          
          <div className="chat-header-clean">
            <div className="contact-avatar-clean">S</div>
            <div className="chat-header-meta-clean">
              <strong>Sarah Jenkins</strong>
              <span>Active Now &bull; Advisor</span>
            </div>
          </div>

          <div className="chat-messages-clean">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message-bubble-clean ${msg.sender}`}
              >
                <div className="bubble-text">{msg.text}</div>
                <div className="message-time-clean">
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-bubble-clean mentor typing">
                <span>Sarah is typing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="chat-suggestions-clean">
            {suggestions.map((sug, idx) => (
              <button 
                key={idx} 
                className="chat-suggestion-chip-clean"
                onClick={() => handleSend(sug)}
              >
                {sug}
              </button>
            ))}
          </div>

          <div className="chat-input-area-clean">
            <input
              type="text"
              className="chat-input-clean"
              placeholder="Ask Sarah a question or paste your drafts..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button 
              className="btn-send-clean"
              onClick={() => handleSend(inputText)}
            >
              <Send size={16} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
