/**
 * Scholarship Data — Static curated scholarship listings
 * Source: data/scholarships.js
 */
export const SCHOLARSHIPS = [
  {
    id: "nsp-post-matric-sc",
    title: "NSP Post-Matric Scholarship Scheme for SC Students",
    provider: "Ministry of Social Justice & Empowerment, Govt of India",
    partnerBadge: "National Portal",
    amount: 12000,
    amountFormatted: "₹12,000 / year",
    deadline: "2026-10-31",
    category: "Need-based",
    source: "Government",
    isLive: true,
    featured: true,
    applicationMode: "Official portal",
    lastUpdated: "Updated 2 days ago",
    tags: ["SC students", "Central scheme", "Post-matric", "DBT enabled"],
    requirementsDescription: "Central government scheme providing financial support to Scheduled Caste (SC) students pursuing studies post Class 10.",
    eligibilityCriteria: {
      gpaMin: 5.0,
      incomeMax: 250000,
      firstGenRequired: false,
      stateResidency: null,
      academicLevel: ["Class 12", "Undergrad", "Postgraduate", "Diploma"],
      casteRequired: ["SC"]
    },
    requirements: [
      { id: "caste_cert", name: "Caste Certificate (SC)", jargonTerm: "Caste Certificate", plainExplanation: "An official government document proving your caste category. It must be issued by a competent authority (Tehsildar/Sub-Divisional Officer).", mentorTip: "Make sure your Caste Certificate is digitally verified and matches the spelling on your Aadhaar card exactly!" },
      { id: "income_cert", name: "Income Certificate (< ₹2.5 Lakhs)", jargonTerm: "Tehsildar Income Certificate", plainExplanation: "A certificate proving your family's annual income is below ₹2.5 Lakhs, issued by a Tehsildar or Revenue Officer.", mentorTip: "Apply for this early at your local Aaple Sarkar or Seva Kendra portal. A salary slip or self-declaration is NOT accepted for government schemes!" },
      { id: "bonafide_cert", name: "College Bonafide Student Certificate", jargonTerm: "Bonafide Student Certificate", plainExplanation: "A certificate stamped and signed by your college Principal or Registrar confirming that you are enrolled for the current academic year.", mentorTip: "Go to your college administration office, show your fee receipt, and request a Bonafide Certificate specifically for NSP scholarship application." },
      { id: "aadhaar_seeding", name: "Aadhaar Card Bank Account Seeding", jargonTerm: "Aadhaar Seeding", plainExplanation: "The process of linking your 12-digit Aadhaar number with your bank account to receive direct scholarship money transfer.", mentorTip: "Visit your bank branch with an Aadhaar copy and submit the 'Aadhaar Seeding Consent Form'. You can verify the status on UIDAI portal." }
    ],
    details: "The Post-Matric Scholarship for Scheduled Caste students is designed to reduce student dropout rates after Class 10 by covering full compulsory course fees, book allowances, and monthly stipends.",
    essayPrompt: "Write a short personal statement detailing how this scholarship will enable you to continue your higher education, and describing any community service activities you plan to join during college.",
    officialUrl: "https://scholarships.gov.in"
  },
  {
    id: "pragati-girls",
    title: "Pragati Scholarship Scheme for Girl Students",
    provider: "AICTE (All India Council for Technical Education)",
    partnerBadge: "Popular with diploma students",
    amount: 50000,
    amountFormatted: "₹50,000 / year",
    deadline: "2026-11-30",
    category: "Merit-based",
    source: "Government",
    isLive: true,
    featured: true,
    applicationMode: "Official portal",
    lastUpdated: "Updated 5 days ago",
    tags: ["Girls only", "Technical education", "AICTE", "Higher amount"],
    requirementsDescription: "AICTE initiative supporting girl students admitted to technical degree or diploma courses in recognized colleges.",
    eligibilityCriteria: {
      gpaMin: 6.0,
      incomeMax: 800000,
      firstGenRequired: false,
      stateResidency: null,
      academicLevel: ["Undergrad", "Diploma"],
      genderRequired: "Female"
    },
    requirements: [
      { id: "admission_proof", name: "Technical Course Admission Letter", jargonTerm: "Admission Letter", plainExplanation: "Proof of your admission through the centralized allotment process (e.g. CAP / JEE counseling allotment).", mentorTip: "Upload the official allotment letter issued by the state cell, showing your roll number and the college name." },
      { id: "income_cert", name: "Income Certificate (< ₹8 Lakhs)", jargonTerm: "Tehsildar Income Certificate", plainExplanation: "Government issued income certificate showing family earnings under ₹8 Lakhs per year.", mentorTip: "This certificate must be valid for the current financial year. Ensure it is signed digitally by a Tehsildar or above." },
      { id: "bonafide_cert", name: "Bonafide Student Certificate", jargonTerm: "Bonafide Student Certificate", plainExplanation: "Official document issued by your college proving you are currently enrolled in a technical branch.", mentorTip: "Ask the college clerk to use the AICTE-prescribed format for the Pragati Scholarship Bonafide." }
    ],
    details: "Pragati is a key government fellowship providing ₹50,000 per annum to young women. The funds can be utilized to cover college tuition fees, purchasing computers, laptops, books, or paying hostel accommodation charges.",
    essayPrompt: "Describe why you selected a technical field (STEM) for your career and how this fellowship will help you break barriers as a woman in engineering or technology.",
    officialUrl: "https://scholarships.gov.in"
  },
  {
    id: "hdfc-badhte-kadam",
    title: "HDFC Bank Badhte Kadam Scholarship",
    provider: "HDFC Bank Initiative",
    partnerBadge: "Fast-moving private scholarship",
    amount: 30000,
    amountFormatted: "₹30,000",
    deadline: "2026-08-30",
    category: "Need-based",
    source: "Private",
    isLive: true,
    featured: true,
    applicationMode: "Buddy4Study listing",
    lastUpdated: "Updated today",
    tags: ["First-generation preference", "Financial need", "Private sponsor"],
    requirementsDescription: "Aims to help high-achieving students from low-income families continue their education, with priority for first-generation scholars.",
    eligibilityCriteria: {
      gpaMin: 6.0,
      incomeMax: 600000,
      firstGenRequired: true,
      stateResidency: null,
      academicLevel: ["Class 12", "Undergrad", "Diploma"]
    },
    requirements: [
      { id: "marksheet", name: "Class 10/12 Marksheet", jargonTerm: "Previous Marksheet", plainExplanation: "Your report card showing grades/marks from your previous year of study.", mentorTip: "Scan and upload the original marksheet. Do not upload pixelated screenshots of online result portals." },
      { id: "income_proof", name: "Income Certificate or ITR", jargonTerm: "Income Proof", plainExplanation: "Documents indicating family income, such as a salary slip, Tehsildar certificate, or Income Tax Return (ITR).", mentorTip: "If your parents are farmers or daily wage workers, get a certified Income Certificate from the local Panchayat or Tehsildar." },
      { id: "fee_receipt", name: "Current College Fee Receipt", jargonTerm: "Fee Receipt", plainExplanation: "A paid receipt showing you have deposited admission fees in your current school/college.", mentorTip: "Make sure the receipt clearly shows your name, roll number, course, and the amount paid." }
    ],
    details: "HDFC Badhte Kadam scholarship supports students who are going through financial distress (e.g. loss of earning parent, medical crisis). First-generation college students are highly preferred during shortlisting.",
    essayPrompt: "Describe any personal or financial crisis your family has experienced and how you have shown resilience to continue your education.",
    officialUrl: "https://www.buddy4study.com/page/hdfc-bank-scholarship"
  },
  {
    id: "kotak-kanya",
    title: "Kotak Kanya Scholarship",
    provider: "Kotak Education Foundation",
    partnerBadge: "Featured opportunity",
    amount: 75000,
    amountFormatted: "₹75,000 / year",
    deadline: "2026-09-15",
    category: "Need & Merit-based",
    source: "Private",
    isLive: true,
    featured: true,
    applicationMode: "Foundation portal",
    lastUpdated: "Updated 1 week ago",
    tags: ["Girls only", "Professional courses", "Top merit", "High value"],
    requirementsDescription: "Provides financial aid to meritorious girl students from low-income families to pursue professional graduation courses.",
    eligibilityCriteria: {
      gpaMin: 8.5,
      incomeMax: 600000,
      firstGenRequired: false,
      stateResidency: ["MH", "KA", "DL", "TN"],
      academicLevel: ["Undergrad"],
      genderRequired: "Female"
    },
    requirements: [
      { id: "marksheet_12", name: "Class 12 Board Marksheet (>= 85%)", jargonTerm: "Previous Marksheet", plainExplanation: "Your Class 12 board scorecard showing at least 85% marks.", mentorTip: "Ensure the scan is clear. High merit is a strict checklist item for Kotak shortlisting." },
      { id: "income_cert", name: "Tehsildar Income Certificate", jargonTerm: "Tehsildar Income Certificate", plainExplanation: "Official document showing family income below ₹6 Lakhs.", mentorTip: "Must be signed digitally. Keep the original document handy for physical verification steps." },
      { id: "recom", name: "Two Teacher Recommendation Letters", jargonTerm: "Letter of Recommendation (LoR)", plainExplanation: "Letters from your junior college or high school teachers explaining your academic dedication and character.", mentorTip: "Ask your Class 12 English, Math, or Science teachers. Print them on school letterhead with their signature and stamp!" }
    ],
    details: "The Kotak Kanya Scholarship funds professional degree courses like engineering, medicine, law, design, or architecture. It provides ₹75,000 annually until graduation, covering tuition, books, and laptops.",
    essayPrompt: "Share your professional goals. Why did you choose this career track, and how do you intend to give back to other first-generation girl students in your community?",
    officialUrl: "https://kotakeducation.org/kotak-kanya-scholarship/"
  },
  {
    id: "tata-pankh",
    title: "Tata Capital Pankh Scholarship",
    provider: "Tata Capital Ltd.",
    partnerBadge: "Closing soon",
    amount: 50000,
    amountFormatted: "₹50,000",
    deadline: "2026-08-15",
    category: "Need-based",
    source: "Private",
    isLive: true,
    featured: false,
    applicationMode: "Buddy4Study listing",
    lastUpdated: "Updated yesterday",
    tags: ["First-generation preference", "Undergrad support", "Urgent deadline"],
    requirementsDescription: "Supporting students belonging to economically weaker sections to complete their undergraduate studies.",
    eligibilityCriteria: {
      gpaMin: 6.0,
      incomeMax: 400000,
      firstGenRequired: true,
      stateResidency: null,
      academicLevel: ["Undergrad", "Diploma"]
    },
    requirements: [
      { id: "marksheet", name: "Previous Class Marksheet (>= 60%)", jargonTerm: "Previous Marksheet", plainExplanation: "Marksheet showing 60% or higher marks in the previous exam.", mentorTip: "Keep a digital copy of both Class 10 and 12 marksheets as they are commonly matched." },
      { id: "income_cert", name: "Income Certificate", jargonTerm: "Tehsildar Income Certificate", plainExplanation: "Income certificate proving family earnings under ₹4 Lakhs.", mentorTip: "Ensure it is issued by an authorized state revenue office." },
      { id: "bonafide_cert", name: "Bonafide Certificate", jargonTerm: "Bonafide Student Certificate", plainExplanation: "A certificate proving you are a full-time student in college.", mentorTip: "Get this from the college administrative office. It should have the official college seal." }
    ],
    details: "The Tata Capital Pankh Scholarship aims to support the educational expenses of students from lower-income backgrounds. It covers up to 80% of their college tuition fees.",
    essayPrompt: "Describe how you managed your education so far despite financial limitations, and what role your parents played in keeping you motivated.",
    officialUrl: "https://www.buddy4study.com/page/tata-capital-pankh-scholarship"
  },
  {
    id: "loreal-science",
    title: "L'Oréal India For Young Women In Science Scholarship",
    provider: "L'Oréal India Pvt. Ltd.",
    partnerBadge: "Upcoming intake",
    amount: 85000,
    amountFormatted: "₹85,000 / year",
    deadline: "2026-10-15",
    category: "Merit-based",
    source: "Private",
    isLive: false,
    featured: true,
    applicationMode: "Buddy4Study listing",
    lastUpdated: "Upcoming cycle announced",
    tags: ["Girls only", "Science careers", "Upcoming", "Premium award"],
    requirementsDescription: "Encouraging young women to pursue science education in colleges. Outstanding academic performance in Class 12 Science is required.",
    eligibilityCriteria: {
      gpaMin: 8.5,
      incomeMax: 600000,
      firstGenRequired: false,
      stateResidency: null,
      academicLevel: ["Undergrad"],
      genderRequired: "Female"
    },
    requirements: [
      { id: "marksheet_12", name: "Class 12 Science Marksheet (>= 85%)", jargonTerm: "Previous Marksheet", plainExplanation: "Marksheet showing 85%+ aggregate in Physics, Chemistry, and Math/Biology.", mentorTip: "Must be a regular science stream board result. Vocational/Correspondence classes are not eligible." },
      { id: "domicile", name: "Domicile Certificate of India", jargonTerm: "Domicile Certificate", plainExplanation: "Government certificate verifying your residency status in India.", mentorTip: "Request a Domicile Certificate from your local Tehsil office or state portal. It serves as permanent proof of state residence." },
      { id: "admission_proof", name: "College Admission Letter & Fee Receipt", jargonTerm: "Admission Letter", plainExplanation: "Proof of enrollment in a pure science or applied science degree program.", mentorTip: "Ensure it shows your course duration and active student credentials." }
    ],
    details: "L'Oréal India provides this scholarship to young girls who want to study pure sciences, engineering, or medical sciences. The award provides ₹85,000 per year, covering total tuition and lab fees.",
    essayPrompt: "Select a scientific topic or problem you want to research in the future, and explain why you want to devote your career to solving it.",
    officialUrl: "https://www.buddy4study.com/page/loreal-india-for-young-women-in-science-scholarship"
  }
];

export const GLOSSARY = [
  { term: "Tehsildar Income Certificate", definition: "An official certificate verifying your family's annual income. It is issued by the Tehsildar (a local government revenue officer) at the Taluka office. Self-declaration, salary slips, or private affidavits are not accepted for major government scholarships." },
  { term: "Bonafide Student Certificate", definition: "A document issued by the college Principal, Director, or Registrar certifying that you are a regular, full-time student of that institution. It must contain the college's official letterhead, round seal, and signing authority's stamp." },
  { term: "Domicile Certificate", definition: "A residency document issued by state authorities (typically Revenue Department) certifying that you have lived in that specific Indian state for a set number of years (often 10-15 years). Many state scholarships require this." },
  { term: "NSP", definition: "National Scholarship Portal (Govt of India). A single digital portal that hosts hundreds of scholarships offered by Central ministries (like Minority Affairs, Social Justice) and State governments." },
  { term: "Aadhaar Seeding", definition: "Linking your Aadhaar card number to your active bank account. The government uses Aadhaar seeding to send scholarship money directly to your account using Direct Benefit Transfer (DBT), preventing leakages." },
  { term: "EWS", definition: "Economically Weaker Section. An income-based category in India. Families with annual income below ₹8 Lakhs who do not belong to SC, ST, or OBC are classified as EWS and qualify for specific merit/need scholarships." },
  { term: "Caste Certificate", definition: "An official certificate issued by state revenue offices declaring that you belong to a scheduled caste (SC), scheduled tribe (ST), or other backward class (OBC). Highly important for reservation and caste-based fellowships." },
  { term: "Admission Letter", definition: "An official seat allotment letter issued by the college or the state entrance cell (e.g. DTE, CET) confirming your branch, registration roll number, and admission quotas." }
];

export const FAQ = [
  { q: "What does it mean to be a 'first-generation' college student in India?", a: "In India, you are a first-generation student if neither of your parents went to college or completed a degree. If your parents only attended school up to Class 10 or 12, you are a first-gen student! Having elder siblings in college does not affect your first-gen status." },
  { q: "How can I apply for an Income Certificate?", a: "You can apply online through your state's digital services portal (e.g., Mahaonline/MahaDBT in Maharashtra, Seva Sindhu in Karnataka, e-District in UP/Delhi) or visit a local CSC (Common Service Centre) / Maha e-Seva Kendra. You will need land records, a ration card, an Aadhaar card, and self-declarations." },
  { q: "Is an income certificate from my parents' office valid for NSP?", a: "Generally, no. Government portals like NSP or state DBTs strictly require a certificate issued by a Revenue Authority (not below the rank of Tehsildar/Naib Tehsildar). Private salary slips are only accepted for private corporate scholarships (like Kotak or HDFC)." },
  { q: "What is Aadhaar-enabled Direct Benefit Transfer (DBT)?", a: "It is a government system where scholarship money is directly deposited into your bank account. For this to work, you must link your Aadhaar number to your bank account (Aadhaar Seeding) and ensure your bank account is active (KYC completed)." }
];

export const MOCK_MENTOR_CHAT = [
  { sender: "mentor", time: "2026-06-25T10:15:00Z", text: "Namaste! I am Sarah, your College & Scholarship Mentor. I am here to help you get your certificates, write essays, or navigate government portals like NSP. How is your application process going?" },
  { sender: "student", time: "2026-06-25T14:30:00Z", text: "Hello ma'am! I am preparing my application for the HDFC Badhte Kadam Scholarship, but I don't have a Tehsildar income certificate yet." },
  { sender: "mentor", time: "2026-06-25T14:35:00Z", text: "Don't worry! For HDFC (which is a private scholarship), you can initially upload your father's salary slip, a farmer declaration, or even a local Panchayat certificate. However, I highly recommend applying for a Tehsildar Income Certificate immediately because government schemes like NSP will strictly require it. Do you know where your nearest e-Seva Kendra is?" }
];
