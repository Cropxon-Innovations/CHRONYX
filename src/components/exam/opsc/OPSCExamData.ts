// OPSC OAS/OFS 2026-2027 Complete Exam Data

export const OPSC_EXAM_INFO = {
  name: "Odisha Civil Services Examination (OAS / OFS)",
  conductingBody: "Odisha Public Service Commission (OPSC)",
  examCycles: ["2026", "2027"],
  stages: [
    { name: "Preliminary Examination", stage: "prelims" as const },
    { name: "Main Examination", stage: "mains" as const },
    { name: "Interview / Personality Test", stage: "interview" as const },
  ],
  officialWebsite: "https://www.opsc.gov.in",
};

export const PRELIMS_PATTERN = [
  {
    paper: "Paper I - General Studies",
    code: "GS",
    marks: 200,
    questions: 100,
    duration: 120,
    negativeMarking: true,
    negativeValue: 0.33,
    isQualifying: false,
  },
  {
    paper: "Paper II - CSAT",
    code: "CSAT",
    marks: 200,
    questions: 80,
    duration: 120,
    negativeMarking: true,
    negativeValue: 0.33,
    isQualifying: true,
    qualifyingPercent: 33,
  },
];

export const MAINS_PATTERN = [
  { paper: "Odia Language", marks: 250, isQualifying: true },
  { paper: "English Language", marks: 250, isQualifying: true },
  { paper: "Essay", marks: 250, isQualifying: false },
  { paper: "General Studies I", marks: 250, isQualifying: false },
  { paper: "General Studies II", marks: 250, isQualifying: false },
  { paper: "General Studies III", marks: 250, isQualifying: false },
  { paper: "General Studies IV (Ethics)", marks: 250, isQualifying: false },
  { paper: "Optional Paper I", marks: 250, isQualifying: false },
  { paper: "Optional Paper II", marks: 250, isQualifying: false },
];

export const MAINS_TOTAL = {
  meritTotal: 1750,
  interviewMarks: 250,
  finalTotal: 2000,
};

export const PRELIMS_SYLLABUS = {
  "History": {
    topics: [
      { name: "Ancient History", subtopics: ["Indus Valley Civilization", "Vedic Period", "Mauryan Empire", "Gupta Empire", "South Indian Dynasties"] },
      { name: "Medieval History", subtopics: ["Delhi Sultanate", "Mughal Empire", "Bhakti & Sufi Movements", "Regional Kingdoms"] },
      { name: "Modern History", subtopics: ["British Rule", "Social & Religious Reforms", "Economic Impact of British Rule", "Modern Education"] },
      { name: "Freedom Movement", subtopics: ["Early Nationalism", "Gandhi Era", "Revolutionary Movements", "Partition & Independence"] },
      { name: "Odisha History", subtopics: ["Ancient Odisha (Kalinga)", "Medieval Odisha", "Paika Rebellion", "Freedom Movement in Odisha", "Post-Independence Odisha"] },
    ],
  },
  "Art & Culture": {
    topics: [
      { name: "Indian Art", subtopics: ["Architecture", "Sculpture", "Painting", "Performing Arts"] },
      { name: "Odisha Art & Culture", subtopics: ["Temple Architecture", "Odissi Dance", "Pattachitra", "Festivals & Fairs", "Literature"] },
    ],
  },
  "Geography": {
    topics: [
      { name: "Physical Geography", subtopics: ["Geomorphology", "Climatology", "Oceanography", "Biogeography"] },
      { name: "Indian Geography", subtopics: ["Physical Features", "Climate", "Natural Resources", "Agriculture", "Industries", "Population"] },
      { name: "World Geography", subtopics: ["Continents & Countries", "Climate Zones", "Global Issues"] },
      { name: "Odisha Geography", subtopics: ["Physical Features", "Rivers & Drainage", "Climate", "Agriculture", "Minerals & Industries", "Districts & Regions"] },
    ],
  },
  "Polity & Governance": {
    topics: [
      { name: "Indian Constitution", subtopics: ["Preamble", "Fundamental Rights", "DPSP", "Fundamental Duties", "Constitutional Bodies"] },
      { name: "Union Government", subtopics: ["Executive", "Legislature", "Judiciary"] },
      { name: "State Government", subtopics: ["Governor", "CM & Council", "State Legislature"] },
      { name: "Local Government", subtopics: ["Panchayati Raj", "Urban Local Bodies"] },
      { name: "Public Administration", subtopics: ["Civil Services", "Administrative Reforms", "E-Governance"] },
    ],
  },
  "Economy": {
    topics: [
      { name: "Indian Economy Basics", subtopics: ["National Income", "Planning", "Poverty & Unemployment"] },
      { name: "Sectors", subtopics: ["Agriculture", "Industry", "Services"] },
      { name: "Financial System", subtopics: ["Banking", "Capital Markets", "Insurance", "RBI & Monetary Policy"] },
      { name: "Public Finance", subtopics: ["Budget", "Taxation", "Fiscal Policy"] },
      { name: "External Sector", subtopics: ["Foreign Trade", "Balance of Payments", "International Organizations"] },
    ],
  },
  "Agriculture": {
    topics: [
      { name: "Agricultural Basics", subtopics: ["Types of Farming", "Cropping Patterns", "Agricultural Inputs"] },
      { name: "Agricultural Policies", subtopics: ["Land Reforms", "Green Revolution", "MSP & Procurement"] },
      { name: "Current Issues", subtopics: ["Farm Distress", "Agricultural Marketing", "Organic Farming"] },
    ],
  },
  "Environment & Ecology": {
    topics: [
      { name: "Ecology Basics", subtopics: ["Ecosystems", "Biodiversity", "Species & Conservation"] },
      { name: "Environmental Issues", subtopics: ["Pollution", "Climate Change", "Deforestation"] },
      { name: "Conservation", subtopics: ["Wildlife Protection", "Protected Areas", "Environmental Laws"] },
      { name: "Odisha Environment", subtopics: ["Chilika Lake", "Simlipal", "Bhitarkanika", "Olive Ridley Turtles"] },
    ],
  },
  "Disaster Management": {
    topics: [
      { name: "Natural Disasters", subtopics: ["Cyclones", "Floods", "Earthquakes", "Droughts"] },
      { name: "Man-made Disasters", subtopics: ["Industrial Disasters", "Fire", "Nuclear"] },
      { name: "DM Framework", subtopics: ["NDMA", "SDMA", "Mitigation Strategies"] },
      { name: "Odisha DM", subtopics: ["Cyclone Preparedness", "OSDMA", "Community Resilience"] },
    ],
  },
  "Internal Security": {
    topics: [
      { name: "Security Challenges", subtopics: ["Terrorism", "Left Wing Extremism", "Insurgency"] },
      { name: "Border Management", subtopics: ["Border Security Forces", "Cross-border Issues"] },
      { name: "Cyber Security", subtopics: ["Cyber Threats", "Cyber Laws", "Critical Infrastructure"] },
    ],
  },
  "Science & Technology": {
    topics: [
      { name: "Basic Sciences", subtopics: ["Physics", "Chemistry", "Biology"] },
      { name: "Space Technology", subtopics: ["ISRO Missions", "Satellites", "Space Applications"] },
      { name: "Biotechnology", subtopics: ["Genetic Engineering", "Medical Biotechnology", "Agricultural Biotech"] },
      { name: "IT & Computers", subtopics: ["AI & ML", "Blockchain", "Internet Technologies"] },
      { name: "Defence Technology", subtopics: ["Missiles", "Indigenous Defence", "DRDO"] },
    ],
  },
  "Society & Social Issues": {
    topics: [
      { name: "Indian Society", subtopics: ["Diversity", "Family & Kinship", "Social Stratification"] },
      { name: "Social Issues", subtopics: ["Women Issues", "Child Issues", "Elderly & Disability"] },
      { name: "Social Welfare", subtopics: ["Welfare Schemes", "NGOs", "Social Movements"] },
    ],
  },
  "Odisha GK": {
    topics: [
      { name: "Odisha at a Glance", subtopics: ["State Symbols", "Demographics", "Administrative Setup"] },
      { name: "Economy of Odisha", subtopics: ["Agriculture", "Industries", "Mining", "Tourism"] },
      { name: "Governance", subtopics: ["State Schemes", "Flagship Programs", "Awards & Recognition"] },
      { name: "Important Personalities", subtopics: ["Freedom Fighters", "Poets & Writers", "Social Reformers"] },
    ],
  },
  "Government Schemes": {
    topics: [
      { name: "Central Schemes", subtopics: ["Social Sector", "Economic Sector", "Infrastructure"] },
      { name: "State Schemes", subtopics: ["Odisha Specific Schemes", "Welfare Programs"] },
    ],
  },
  "Current Affairs": {
    topics: [
      { name: "National Affairs", subtopics: ["Politics", "Economy", "Society"] },
      { name: "International Affairs", subtopics: ["Bilateral Relations", "Multilateral Forums", "Global Issues"] },
      { name: "Science & Environment", subtopics: ["Discoveries", "Environmental Events"] },
      { name: "Sports & Culture", subtopics: ["Sports Events", "Cultural Events", "Awards"] },
    ],
  },
  "Miscellaneous GK": {
    topics: [
      { name: "General Knowledge", subtopics: ["Books & Authors", "Important Days", "Organizations"] },
    ],
  },
};

export const CSAT_SYLLABUS = {
  "Comprehension": {
    topics: [
      { name: "Reading Comprehension", subtopics: ["English Passages", "Decision Making Passages"] },
    ],
  },
  "Logical Reasoning": {
    topics: [
      { name: "Verbal Reasoning", subtopics: ["Analogies", "Series", "Classification", "Syllogism"] },
      { name: "Non-Verbal Reasoning", subtopics: ["Patterns", "Figures", "Spatial Reasoning"] },
    ],
  },
  "Analytical Ability": {
    topics: [
      { name: "Data Interpretation", subtopics: ["Tables", "Charts", "Graphs"] },
      { name: "Data Sufficiency", subtopics: ["Problem Solving", "Decision Making"] },
    ],
  },
  "Quantitative Aptitude": {
    topics: [
      { name: "Number System", subtopics: ["HCF/LCM", "Divisibility", "Remainders"] },
      { name: "Arithmetic", subtopics: ["Percentage", "Ratio", "Time & Work", "Time & Distance"] },
      { name: "Basic Mathematics", subtopics: ["Algebra", "Geometry", "Mensuration"] },
    ],
  },
  "English Language": {
    topics: [
      { name: "Grammar", subtopics: ["Error Correction", "Fill in Blanks", "Sentence Improvement"] },
    ],
  },
};

export const MAINS_SYLLABUS = {
  "Essay": {
    topics: [
      { name: "Essay Writing", subtopics: ["Social Issues", "Economic Issues", "Political Issues", "International Issues", "Abstract Topics"] },
    ],
  },
  "GS I - Indian Heritage & Culture": {
    topics: [
      { name: "Art & Culture", subtopics: ["Indian Art Forms", "Architecture", "Literature", "Music & Dance"] },
      { name: "History", subtopics: ["Ancient India", "Medieval India", "Modern India", "World History"] },
      { name: "Society", subtopics: ["Salient Features", "Women & Society", "Population", "Urbanization"] },
      { name: "Geography", subtopics: ["Physical Geography", "Human Geography", "Economic Geography"] },
    ],
  },
  "GS II - Governance, Constitution, Polity": {
    topics: [
      { name: "Constitution & Polity", subtopics: ["Constitutional Framework", "Executive", "Legislature", "Judiciary"] },
      { name: "Governance", subtopics: ["Role of Civil Services", "E-Governance", "Transparency & Accountability"] },
      { name: "Social Justice", subtopics: ["Welfare Schemes", "Health", "Education", "Development"] },
      { name: "International Relations", subtopics: ["India's Foreign Policy", "Bilateral Relations", "International Organizations"] },
    ],
  },
  "GS III - Technology, Economic Development, Environment": {
    topics: [
      { name: "Economy", subtopics: ["Economic Development", "Inclusive Growth", "Budgeting", "Agriculture"] },
      { name: "Science & Technology", subtopics: ["S&T Developments", "Applications", "Indigenization"] },
      { name: "Environment", subtopics: ["Conservation", "Pollution", "Disaster Management"] },
      { name: "Security", subtopics: ["Internal Security", "External Security", "Cyber Security"] },
    ],
  },
  "GS IV - Ethics, Integrity, Aptitude": {
    topics: [
      { name: "Ethics & Morality", subtopics: ["Moral Concepts", "Ethics in Administration", "Ethical Dilemmas"] },
      { name: "Aptitude", subtopics: ["Attitude", "Emotional Intelligence", "Civil Service Values"] },
      { name: "Case Studies", subtopics: ["Administrative Case Studies", "Ethical Case Studies"] },
    ],
  },
};

export const OPTIONAL_SUBJECTS = [
  "Agriculture",
  "Anthropology",
  "Botany",
  "Chemistry",
  "Civil Engineering",
  "Commerce & Accountancy",
  "Economics",
  "Electrical Engineering",
  "Geography",
  "Geology",
  "History",
  "Law",
  "Management",
  "Mathematics",
  "Mechanical Engineering",
  "Odia Language",
  "Philosophy",
  "Physics",
  "Political Science & IR",
  "Psychology",
  "Public Administration",
  "Sociology",
  "Statistics",
  "Zoology",
];

export const SAMPLE_TOPPERS = [
  { year: 2024, rank: 1, name: "Sample Topper 1", optional: "Public Administration", attempts: 2 },
  { year: 2024, rank: 2, name: "Sample Topper 2", optional: "Geography", attempts: 1 },
  { year: 2024, rank: 3, name: "Sample Topper 3", optional: "History", attempts: 3 },
];

export const SAMPLE_CUTOFFS = {
  2024: {
    prelims: { general: 92, sc: 82, st: 75, obc: 85 },
    mains: { general: 450, sc: 400, st: 380, obc: 420 },
    final: { general: 750, sc: 680, st: 650, obc: 710 },
  },
  2023: {
    prelims: { general: 90, sc: 80, st: 73, obc: 83 },
    mains: { general: 445, sc: 395, st: 375, obc: 415 },
    final: { general: 745, sc: 675, st: 645, obc: 705 },
  },
};
