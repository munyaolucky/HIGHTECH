/**
 * HI-TECH College Institutional Data & Course Catalogue
 * Approved TVET Kenya Institutional Dataset
 */

import { CourseProgramme, NewsArticle } from '../types';

export interface CollegeInfo {
  name: string;
  shortName: string;
  tagline: string;
  motto: string;
  established: number;
  accreditation: string[];
  registrationNumber: string; // Institutional TVETA Reg
  headquarters: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
  };
  contacts: {
    mainPhone: string;
    admissionsPhone: string;
    studentSupportPhone: string;
    financePhone: string;
    email: string;
    admissionsEmail: string;
    supportEmail: string;
  };
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    youtube: string;
    instagram: string;
  };
  stats: {
    studentsEnrolled: number;
    graduatesPlaced: number;
    academicProgrammes: number;
    modernLabsCount: number;
    qualifiedFaculty: number;
    partnerIndustries: number;
    knecCdaccPassRate: number;
  };
  campuses: {
    name: string;
    type: string;
    address: string;
    phone: string;
    email: string;
  }[];
}

export const COLLEGE_INFO: CollegeInfo = {
  name: "HI-TECH College of Technology & Applied Sciences",
  shortName: "HI-TECH College",
  tagline: "Empowering Next-Generation Digital Innovators & Leaders",
  motto: "Excellence in Technology, Skill & Innovation",
  established: 2012,
  accreditation: [
    "TVETA / ACC / 0482 / 2026 (Fully Registered & Accredited)",
    "TVET CDACC Approved Assessment & CBT Examination Centre",
    "KNEC Examination Centre 2040182",
    "KASNEB Accredited Tuition & Computer Examination Centre",
    "NITA Registered Training Provider"
  ],
  registrationNumber: "TVETA/PUBLIC/0291/2026",
  headquarters: {
    address: "HI-TECH Academic Towers, Haile Selassie Avenue",
    city: "Nairobi",
    country: "Kenya",
    postalCode: "P.O. Box 48291 - 00100 GPO"
  },
  contacts: {
    mainPhone: "+254 (0) 20 780 1200",
    admissionsPhone: "+254 712 345 678",
    studentSupportPhone: "+254 798 112 233",
    financePhone: "+254 722 890 011",
    email: "info@hitech.ac.ke",
    admissionsEmail: "admissions@hitech.ac.ke",
    supportEmail: "studenthelp@hitech.ac.ke"
  },
  socialLinks: {
    facebook: "https://facebook.com/hitechcollegeke",
    twitter: "https://twitter.com/hitechcollege",
    linkedin: "https://linkedin.com/school/hitech-college-kenya",
    youtube: "https://youtube.com/c/HiTechCollegeOfficial",
    instagram: "https://instagram.com/hitechcollege"
  },
  stats: {
    studentsEnrolled: 4850,
    graduatesPlaced: 12400,
    academicProgrammes: 42,
    modernLabsCount: 38,
    qualifiedFaculty: 165,
    partnerIndustries: 180,
    knecCdaccPassRate: 98.4
  },
  campuses: [
    {
      name: "Nairobi Main Campus",
      type: "Main Academic & Research Centre",
      address: "HI-TECH Academic Towers, Haile Selassie Avenue, Nairobi CBD",
      phone: "+254 712 345 678",
      email: "nairobi@hitech.ac.ke"
    },
    {
      name: "Westlands Technology Park Campus",
      type: "AI & Innovation Hub",
      address: "Waiyaki Way, Next to Parklands Exchange, Westlands",
      phone: "+254 720 987 654",
      email: "westlands@hitech.ac.ke"
    },
    {
      name: "Eldoret Tech Campus",
      type: "Regional Campus",
      address: "Oginga Odinga Street, Zion Mall Commercial Complex, Eldoret",
      phone: "+254 733 456 789",
      email: "eldoret@hitech.ac.ke"
    },
    {
      name: "Mombasa Coastal Campus",
      type: "Maritime & Applied Computing",
      address: "Moi Avenue, Opposite Treasury Square, Mombasa",
      phone: "+254 722 334 455",
      email: "mombasa@hitech.ac.ke"
    }
  ]
};

export const COURSES_CATALOGUE: CourseProgramme[] = [
  {
    id: "dict-001",
    code: "DICT-L6",
    title: "Diploma in Information Communication Technology (DICT)",
    department: "School of Computing & Informatics",
    level: "Diploma",
    duration: "2 Years (6 Trimesters)",
    intake: ["January", "May", "September"],
    mode: ["Full-time", "Part-time", "Evening"],
    minimumRequirements: "KCSE Mean Grade C- (Minus) or Certificate in ICT Level 5",
    examiningBody: "TVET CDACC",
    tuitionPerTerm: 24500,
    featured: true,
    overview: "Comprehensive competency-based qualification covering full-stack web and mobile development, database administration, networking infrastructure, cybersecurity fundamentals, and enterprise IT management.",
    careerOpportunities: [
      "Full-Stack Web Developer",
      "Network Administrator",
      "Database Administrator (DBA)",
      "IT Support Specialist",
      "Cloud Solutions Associate"
    ],
    keyModules: [
      "Object-Oriented Programming (Java & Python)",
      "Relational & Distributed Database Design (PostgreSQL/SQL)",
      "Computer Networks & Cisco Routing Essentials",
      "Web Applications Development (React & Node.js)",
      "Mobile Applications Development (Android/Kotlin)",
      "Industrial Attachment & Capstone Project"
    ]
  },
  {
    id: "cict-002",
    code: "CICT-L5",
    title: "Certificate in Information Communication Technology (CICT)",
    department: "School of Computing & Informatics",
    level: "Certificate",
    duration: "1 Year (3 Trimesters)",
    intake: ["January", "May", "September"],
    mode: ["Full-time", "Evening"],
    minimumRequirements: "KCSE Mean Grade D (Plain) or equivalent recognized qualification",
    examiningBody: "TVET CDACC",
    tuitionPerTerm: 18500,
    featured: true,
    overview: "Fast-track technical foundation equipping trainees with practical computer maintenance, hardware diagnostics, network cabling, responsive web design, and office IT systems administration.",
    careerOpportunities: [
      "ICT Technical Assistant",
      "Computer Hardware Technician",
      "Helpdesk & Service Support Officer",
      "Junior Front-End Web Designer"
    ],
    keyModules: [
      "Computer Hardware Maintenance & Troubleshooting",
      "Operating Systems Installation & Configuration",
      "Basic Computer Networking & Cabling",
      "Web Design Essentials (HTML5, CSS3, JavaScript)",
      "Business Communication & Digital Literacy"
    ]
  },
  {
    id: "aiml-003",
    code: "AIML-L6",
    title: "Diploma in Artificial Intelligence & Machine Learning",
    department: "School of Computing & Informatics",
    level: "Diploma",
    duration: "2 Years (6 Trimesters)",
    intake: ["January", "May", "September"],
    mode: ["Full-time", "Part-time", "Online"],
    minimumRequirements: "KCSE Mean Grade C (Plain) with C in Mathematics or Physics",
    examiningBody: "HI-TECH",
    tuitionPerTerm: 32000,
    featured: true,
    overview: "Pioneering industry curriculum focused on data science, deep neural networks, computer vision, natural language processing, predictive analytics, and enterprise model deployment using Python, PyTorch, and TensorFlow.",
    careerOpportunities: [
      "AI/ML Junior Engineer",
      "Data Analyst & Visualizer",
      "Machine Learning Operations (MLOps) Specialist",
      "Automation & Robotics Developer"
    ],
    keyModules: [
      "Applied Mathematics & Linear Algebra for Data Science",
      "Python Data Science Stack (NumPy, Pandas, Scikit-Learn)",
      "Deep Learning Architectures (TensorFlow & PyTorch)",
      "Computer Vision & Speech Processing",
      "Large Language Models & Generative AI Applications",
      "Applied AI Ethics, Governance & Final Thesis"
    ]
  },
  {
    id: "dbm-004",
    code: "DBM-L6",
    title: "Diploma in Business Management",
    department: "School of Business Studies",
    level: "Diploma",
    duration: "2 Years (6 Trimesters)",
    intake: ["January", "May", "September"],
    mode: ["Full-time", "Evening", "Online"],
    minimumRequirements: "KCSE Mean Grade C- (Minus) or Certificate in Business Management",
    examiningBody: "KNEC",
    tuitionPerTerm: 22000,
    featured: true,
    overview: "Dynamic management training focusing on modern strategic planning, supply chain logistics, organizational leadership, marketing strategy, entrepreneurship, and digital commerce operations.",
    careerOpportunities: [
      "Business Operations Executive",
      "Office Administrator",
      "Sales & Marketing Manager",
      "Supply Chain Coordinator",
      "Enterprise Consultant"
    ],
    keyModules: [
      "Principles & Practice of Modern Management",
      "Financial Accounting & Cost Analysis",
      "Strategic Marketing & Digital Channels",
      "Business Law & Commercial Contracts",
      "Operations & Supply Chain Logistics"
    ]
  },
  {
    id: "cpa-005",
    code: "CPA-PRO",
    title: "Accounting & Finance (KASNEB - CPA / ATD)",
    department: "School of Business Studies",
    level: "Professional",
    duration: "1.5 - 2 Years (Flexible modules)",
    intake: ["January", "July"],
    mode: ["Full-time", "Part-time", "Evening"],
    minimumRequirements: "KCSE Mean Grade C+ (Plus) with C+ in Mathematics & English",
    examiningBody: "KASNEB",
    tuitionPerTerm: 26000,
    featured: false,
    overview: "Rigorous professional accounting certification preparing candidates for high-level roles in auditing, corporate taxation, forensic accounting, investment appraisal, and statutory compliance.",
    careerOpportunities: [
      "Certified Public Accountant (CPA)",
      "Internal & External Auditor",
      "Tax Consultant & Compliance Officer",
      "Financial Controller",
      "Treasury Manager"
    ],
    keyModules: [
      "Financial Accounting & Reporting",
      "Management Accounting & Cost Control",
      "Taxation Law & Practice",
      "Auditing, Assurance & Ethics",
      "Advanced Corporate Finance"
    ]
  },
  {
    id: "pack-006",
    code: "COMP-F01",
    title: "Certificate in Computer Packages & Digital Literacy",
    department: "School of Computing & Informatics",
    level: "Short Course",
    duration: "6 Weeks (Intensive Hands-on)",
    intake: ["Monthly (Rolling Basis)"],
    mode: ["Full-time", "Part-time", "Evening"],
    minimumRequirements: "Open to all students, school leavers, and working professionals",
    examiningBody: "NITA",
    tuitionPerTerm: 6500,
    featured: false,
    overview: "Industry standard digital fluency programme covering modern office productivity suites, cloud computing, cybersecurity awareness, and AI workplace productivity tools.",
    careerOpportunities: [
      "Data Entry Specialist",
      "Administrative Assistant",
      "Front Office Executive",
      "Customer Service Representative"
    ],
    keyModules: [
      "Introduction to Operating Systems & File Management",
      "Advanced Word Processing (MS Word / Google Docs)",
      "Spreadsheet Analysis & Pivot Tables (MS Excel)",
      "Digital Presentations (PowerPoint)",
      "Internet Research, Email Etiquette & Cloud Storage",
      "AI Tools for Productivity & Workplace Automation"
    ]
  },
  {
    id: "cyber-007",
    code: "CYBER-L6",
    title: "Diploma in Cyber Security & Forensic Computing",
    department: "School of Computing & Informatics",
    level: "Diploma",
    duration: "2 Years (6 Trimesters)",
    intake: ["January", "May", "September"],
    mode: ["Full-time", "Evening"],
    minimumRequirements: "KCSE Mean Grade C (Plain) with C in Mathematics or Physics",
    examiningBody: "TVET CDACC",
    tuitionPerTerm: 28500,
    featured: false,
    overview: "Specialized defensive and offensive cybersecurity curriculum covering threat intelligence, vulnerability assessment, penetration testing, SIEM monitoring, and digital evidence handling.",
    careerOpportunities: [
      "Cybersecurity Analyst (SOC Tier 1 & 2)",
      "Penetration Tester / Ethical Hacker",
      "Digital Forensics Investigator",
      "Information Security Auditor"
    ],
    keyModules: [
      "Network Protocols, Routing & Packet Analysis",
      "Linux System Administration & Bash Scripting",
      "Vulnerability Scanning & Penetration Testing",
      "Cryptography & Secure Communications",
      "Security Incident & Event Management (SIEM)"
    ]
  },
  {
    id: "elec-008",
    code: "ELEC-L6",
    title: "Diploma in Electrical & Electronics Engineering (Power Option)",
    department: "School of Engineering",
    level: "Diploma",
    duration: "2.5 Years (7 Trimesters)",
    intake: ["January", "May"],
    mode: ["Full-time"],
    minimumRequirements: "KCSE Mean Grade C- (Minus) with C- in Mathematics & Physics",
    examiningBody: "KNEC",
    tuitionPerTerm: 25000,
    featured: false,
    overview: "Hands-on engineering programme training technicians in electrical power generation, transmission, industrial automation, programmable logic controllers (PLCs), and solar photovoltaic installations.",
    careerOpportunities: [
      "Electrical Maintenance Engineer",
      "Solar PV Certified Installer",
      "Industrial Automation Technician",
      "Power Distribution Inspector"
    ],
    keyModules: [
      "Electrical Circuit Analysis & Measurements",
      "Electrical Power Systems & High-Voltage Substations",
      "Industrial Machines & Control Circuits",
      "Programmable Logic Controllers (PLC) & SCADA",
      "Solar PV Design & Energy Efficiency Auditing"
    ]
  }
];

export const NEWS_AND_EVENTS: NewsArticle[] = [
  {
    id: "news-001",
    title: "HI-TECH College Signs National Digital Talent Pipeline Partnership with TVETA",
    summary: "New industry initiative will fund 500 scholarships for high-demand AI, Cloud, and Cybersecurity diploma programmes across all four campuses.",
    content: "The Technical and Vocational Education and Training Authority (TVETA) has formally accredited and partnered with HI-TECH College to spearhead the 2026 National Digital Talent Initiative. Under this memorandum of understanding, industry partners will co-fund practical training labs, certification vouchers, and 6-month guaranteed paid internships for eligible students.",
    category: "Academics",
    publishedDate: "2026-10-24",
    author: "Registrar of Academic Affairs",
    readTime: "4 min read",
    isImportant: true
  },
  {
    id: "news-002",
    title: "May 2026 Intake Applications Now Open: Early Bird Registration & Portal Access",
    summary: "Prospective applicants can submit credentials online, receive an instant admission reference, and activate their student portal within 24 hours.",
    content: "Applications for the upcoming May 2026 intake across all TVET CDACC, KNEC, and KASNEB courses are officially open. Students who apply online via the website will receive their official Admission Offer letter and automatic student registration number generation for immediate portal access.",
    category: "Admissions",
    publishedDate: "2026-10-18",
    author: "Admissions Directorate",
    readTime: "3 min read",
    isImportant: true
  },
  {
    id: "news-003",
    title: "HI-TECH Robotics & AI Club Wins East Africa University Innovation Challenge",
    summary: "Students designed an autonomous agricultural drone equipped with computer vision for crop disease detection and soil moisture mapping.",
    content: "A multidisciplinary team of diploma students from the School of Computing and School of Engineering clinched 1st Place at the East Africa Tech Expo held at KICC Nairobi. The prototype utilizes edge AI and IoT sensors to monitor crop health in real-time.",
    category: "Research",
    publishedDate: "2026-09-30",
    author: "Student Affairs & Innovation Hub",
    readTime: "5 min read",
    isImportant: false
  },
  {
    id: "news-004",
    title: "Official 14th Graduation Ceremony Scheduled for December 4th, 2026",
    summary: "Graduands are advised to verify their academic clearance status and fee balances via the Student Portal before the November 15th deadline.",
    content: "The Senate of HI-TECH College wishes to notify all eligible candidates for the 14th Congregation for the Award of Diplomas and Certificates that the ceremony will be held at the Main Sports Grounds, Nairobi Main Campus. All clearance is strictly handled digitally through the Student Portal.",
    category: "Events",
    publishedDate: "2026-09-12",
    author: "Academic Registrar",
    readTime: "3 min read",
    isImportant: true
  }
];

export const FAQS_LIST = [
  {
    question: "How do I access and log into the Student Portal?",
    answer: "Every admitted student at HI-TECH College receives an authentic Student Registration Number (e.g. HCA/STU/2026/001). To access your portal: 1) Click the 'Student Portal' button in the top navigation bar of this website; 2) Enter your Registration Number and password; 3) Instantly access your registered units, semester timetables, fee balances with M-Pesa STK push, digital library books, and exam transcripts."
  },
  {
    question: "How do I get my Student Registration Number if I am a new student?",
    answer: "When you apply online via the website or at our Admissions Office, our Central Registration Number Generator automatically assigns your official institutional number (e.g., HCA/STU/2026/001). This number is printed on your official Letter of Admission and sent via SMS and email alongside your default portal PIN."
  },
  {
    question: "What are the entry requirements for Diploma and Certificate courses?",
    answer: "For Diploma courses examined by TVET CDACC / KNEC, the general minimum requirement is KCSE C- (Minus) or a relevant Level 5 Certificate. For Certificate courses, the minimum requirement is KCSE D (Plain) or D- (Minus). Short courses such as Computer Packages are open to all students."
  },
  {
    question: "How can I pay my college tuition and examination fees?",
    answer: "All fee payments are integrated with our automated Finance Portal. You can initiate an M-Pesa STK push directly inside the Student Portal or pay via Paybill 400222 (Account: Your Student Reg No, e.g. HCA/STU/2026/001). Receipts are generated automatically and reflect on your portal account within seconds."
  },
  {
    question: "Are HI-TECH College certificates recognized by government and employers?",
    answer: "Yes, 100%. HI-TECH College is fully accredited by the Technical and Vocational Education and Training Authority (TVETA). Our programmes are examined by national statutory bodies including TVET CDACC, KNEC, KASNEB, and NITA, making all graduates eligible for public and private sector employment."
  },
  {
    question: "Can I study online or in the evening while working?",
    answer: "Yes. We offer flexible study schedules including full-time weekday classes, evening sessions (5:30 PM - 8:00 PM), Saturday executive classes, and blended distance learning supported by our 24/7 Digital LMS Portal."
  }
];

export const DOWNLOADABLE_RESOURCES = [
  {
    id: "res-00",
    title: "Master Feature Blueprint & Architectural Catalogue (REF: HCA/SPEC/2026/DOC-001)",
    category: "Institutional Governance",
    fileType: "PDF",
    size: "6.4 MB",
    description: "Complete 47 functional modules, 63 CBT question types, 32 RBAC roles, 22 phases, and KES 400K valuation breakdown."
  },
  {
    id: "res-01",
    title: "HI-TECH College Complete Prospectus 2026/2027",
    category: "Admissions",
    fileType: "PDF",
    size: "4.8 MB",
    description: "Detailed course directory, entry qualifications, fee schedules, and campus facilities."
  },
  {
    id: "res-02",
    title: "2026 Academic Calendar & Trimester Timetables",
    category: "Academic Operations",
    fileType: "PDF",
    size: "1.2 MB",
    description: "Official schedule of semester dates, exam weeks, graduation deadlines, and recess."
  },
  {
    id: "res-03",
    title: "Student Handbook & Code of Conduct",
    category: "Student Services",
    fileType: "PDF",
    size: "2.1 MB",
    description: "Institutional regulations, examination rules, library access policies, and student rights."
  },
  {
    id: "res-04",
    title: "Fee Payment Structure & Bank Account Matrix",
    category: "Finance",
    fileType: "PDF",
    size: "890 KB",
    description: "Tuition breakdowns per trimester, statutory fees, M-Pesa paybill details, and instalment policies."
  },
  {
    id: "res-05",
    title: "Course Registration Form (CRF-2026)",
    category: "Registrar",
    fileType: "PDF",
    size: "620 KB",
    description: "Manual course add/drop verification sheet for offline departmental records."
  }
];
