// OPSC OAS/OFS 2026-2027 Complete Exam Data
// Source: Official OPSC Notification (Advt. No. 05 of 2025–26)

export const OPSC_EXAM_INFO = {
  name: "Odisha Civil Services Examination (OCS / OAS / OFS Combined Competitive Exam)",
  shortName: "OPSC OAS / OFS 2026",
  conductingBody: "Odisha Public Service Commission (OPSC)",
  examCycles: ["2026", "2027"],
  stages: [
    { name: "Preliminary Examination", stage: "prelims" as const, type: "Screening" },
    { name: "Main Examination", stage: "mains" as const, type: "Descriptive" },
    { name: "Personality Test / Interview", stage: "interview" as const, type: "Final" },
  ],
  officialWebsite: "https://www.opsc.gov.in",
  advertisementsPage: "https://www.opsc.gov.in/Advertisements",
  notificationNumber: "Advt. No. 05 of 2025–26",
  notificationDate: "31 December 2025",
};

export const KEY_DATES = {
  notificationRelease: "31 December 2025",
  applicationStart: "20 January 2026",
  applicationEnd: "20 February 2026",
  lastDateFees: "27 February 2026",
  prelimsDate: "7 June 2026 (Sunday)",
  mainsDate: "To be announced",
  interviewDate: "To be announced",
  vacanciesReported: "314-465 (Refer official PDF for exact breakdown)",
  sourceNote: "Dates sourced from official notification and trusted portals. Always verify on opsc.gov.in",
};

export const ELIGIBILITY = {
  nationality: "Indian Citizen",
  educationalQualification: "Bachelor's degree in any discipline from a recognized university or equivalent",
  languageRequirement: "Working knowledge of Odia (passed Odia at prescribed levels or evidence of Odia competency as specified)",
  age: {
    minimum: 21,
    maximum: 38, // Some sources report 42 after cabinet decision
    maxNote: "Note: State cabinet decision may have raised upper age to 42 years. Verify exact clause from official notification PDF.",
    asOnDate: "01-Jan-2025",
    relaxations: [
      { category: "SC/ST of Odisha", years: 5 },
      { category: "OBC/SEBC of Odisha", years: 3 },
      { category: "Women (all categories)", years: 5 },
      { category: "Ex-Servicemen", years: "As per rules" },
      { category: "PwD", years: 10 },
    ],
  },
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
    description: "Merit Ranking Paper - Marks counted for shortlisting to Mains",
  },
  {
    paper: "Paper II - CSAT (Civil Services Aptitude Test)",
    code: "CSAT",
    marks: 200,
    questions: 80,
    duration: 120,
    negativeMarking: true,
    negativeValue: 0.33,
    isQualifying: true,
    qualifyingPercent: 33,
    description: "Qualifying only - Minimum 33% required for Paper I evaluation",
  },
];

export const MAINS_PATTERN = [
  { paper: "Paper I - Odia Language", marks: 250, isQualifying: true, description: "Qualifying - Must pass to qualify" },
  { paper: "Paper II - English Language", marks: 250, isQualifying: true, description: "Qualifying - Must pass to qualify" },
  { paper: "Paper III - Essay", marks: 250, isQualifying: false, description: "Merit Paper" },
  { paper: "Paper IV - General Studies I (History, Culture, Society)", marks: 250, isQualifying: false, description: "Merit Paper" },
  { paper: "Paper V - General Studies II (Polity, Governance, IR)", marks: 250, isQualifying: false, description: "Merit Paper" },
  { paper: "Paper VI - General Studies III (Economy, Sci-Tech, Env, Security)", marks: 250, isQualifying: false, description: "Merit Paper" },
  { paper: "Paper VII - General Studies IV (Ethics, Integrity & Aptitude)", marks: 250, isQualifying: false, description: "Merit Paper" },
  { paper: "Paper VIII - Optional Subject Paper I", marks: 250, isQualifying: false, description: "Merit Paper" },
  { paper: "Paper IX - Optional Subject Paper II", marks: 250, isQualifying: false, description: "Merit Paper" },
];

export const MAINS_TOTAL = {
  qualifyingTotal: 500,
  meritTotal: 1750,
  interviewMarks: 250,
  finalTotal: 2000,
  selectionFormula: "Mains Merit (1750) + Interview (250) = Final Merit (2000)",
};

export const INTERVIEW_FOCUS = [
  "Mental alertness & clarity of expression",
  "Assimilation of diverse information",
  "Balance of judgment & social cohesion",
  "Intellectual & moral integrity",
  "Leadership qualities",
  "General awareness & current affairs",
  "DAF (Detailed Application Form) based questions",
  "Optional subject depth & Indian applications",
  "Ethics & integrity - real cases, decision-making",
  "Personal motivations for public service",
];

// Complete Prelims Syllabus
export const PRELIMS_SYLLABUS = {
  "1. History (India + Odisha)": {
    description: "Indian and Odisha history from ancient to modern times",
    topics: [
      { 
        name: "Ancient India", 
        subtopics: [
          "Indus Valley Civilization - Town planning, trade, decline",
          "Vedic Period - Rig Vedic & Later Vedic society, economy, religion",
          "Mauryan Empire - Chandragupta, Ashoka, administration, Dhamma",
          "Gupta Age - Golden age, art, science, literature",
          "South Indian Dynasties - Cholas, Pallavas, Chalukyas"
        ] 
      },
      { 
        name: "Medieval India", 
        subtopics: [
          "Delhi Sultanate - Slave, Khilji, Tughlaq dynasties",
          "Regional Kingdoms - Vijayanagar, Bahmani",
          "Mughal Empire - Babur to Aurangzeb, administration, art, architecture",
          "Bhakti & Sufi Movements - Saints, philosophy, social impact"
        ] 
      },
      { 
        name: "Modern India", 
        subtopics: [
          "British Rule 1757-1857 - EIC expansion, economic policies",
          "Economic Impact - Drain of wealth, de-industrialization",
          "Social & Religious Reform Movements - Raja Ram Mohan Roy, Dayanand",
          "Modern Education - Macaulay, Wood's Despatch"
        ] 
      },
      { 
        name: "Freedom Movement", 
        subtopics: [
          "Early Nationalism - Moderate & Extremist phase",
          "Gandhi Era - Non-cooperation, Civil Disobedience, Quit India",
          "Revolutionary Movements - Bhagat Singh, Subhas Bose",
          "Partition & Independence - Mountbatten Plan, Integration of States"
        ] 
      },
      { 
        name: "History of Odisha", 
        subtopics: [
          "Ancient Odisha - Kalinga War, Kharavela, Bhauma-Kara dynasty",
          "Medieval Odisha - Somavamshi, Ganga, Gajapati dynasties",
          "Paika Rebellion 1817 - First war of independence in Odisha",
          "Freedom Movement in Odisha - Gopabandhu, Nabakrushna Choudhury",
          "Post-Independence Odisha - State formation, development"
        ] 
      },
    ],
  },
  "2. Art & Culture (India & Odisha)": {
    description: "Indian art forms, architecture, and cultural heritage with special focus on Odisha",
    topics: [
      { 
        name: "Indian Architecture", 
        subtopics: [
          "Indus Valley Architecture - Great Bath, granaries",
          "Buddhist Architecture - Stupas, Viharas, Chaityas",
          "Temple Architecture - Nagara, Dravida, Vesara styles",
          "Indo-Islamic Architecture - Sultanate & Mughal styles",
          "Colonial Architecture - Gothic, Indo-Saracenic"
        ] 
      },
      { 
        name: "Indian Art Forms", 
        subtopics: [
          "Sculpture - Mauryan, Gandhara, Mathura schools",
          "Painting - Ajanta, Mughal, Rajasthani miniatures",
          "Classical Dance - Bharatanatyam, Kathak, Odissi",
          "Classical Music - Hindustani, Carnatic traditions"
        ] 
      },
      { 
        name: "Odisha Art & Culture", 
        subtopics: [
          "Kalinga Architecture - Konark, Lingaraj, Jagannath temples",
          "Odissi Dance - Origin, evolution, Guru Kelucharan Mohapatra",
          "Pattachitra - Traditional cloth painting technique",
          "Tribal Arts - Saura, Santhal paintings",
          "Jagannath Culture - Rath Yatra, temple traditions",
          "Festivals of Odisha - Raja Parba, Nuakhai, Dola Purnima",
          "UNESCO Sites - Konark, proposed sites"
        ] 
      },
    ],
  },
  "3. Geography (World / India / Odisha)": {
    description: "Physical, human, and economic geography at all levels",
    topics: [
      { 
        name: "Physical Geography", 
        subtopics: [
          "Geomorphology - Earth's structure, plate tectonics, landforms",
          "Climatology - Atmospheric circulation, weather systems",
          "Oceanography - Ocean currents, tides, marine resources",
          "Biogeography - Ecosystem distribution, biomes"
        ] 
      },
      { 
        name: "Indian Geography", 
        subtopics: [
          "Physiographic Divisions - Himalayas, Plains, Peninsular plateau",
          "Climate of India - Monsoon mechanism, seasons",
          "River Systems - Himalayan & Peninsular rivers, interlinking",
          "Soils & Vegetation - Types, distribution, conservation",
          "Minerals & Energy - Coal, iron, petroleum distribution",
          "Agriculture - Cropping patterns, Green Revolution, irrigation",
          "Industries - Iron & steel, textiles, industrial corridors",
          "Population & Urbanization - Distribution, migration, smart cities"
        ] 
      },
      { 
        name: "Odisha Geography", 
        subtopics: [
          "Physical Features - Eastern Ghats, coastal plains, river basins",
          "River Network - Mahanadi, Brahmani, Baitarani, Subarnarekha",
          "Climate - Monsoon patterns, cyclone vulnerability",
          "Minerals - Iron ore, coal, bauxite, chromite belts",
          "Agriculture - Rice bowl, horticultural crops",
          "Industries - Steel, aluminum, ports, industrial zones",
          "Districts & Administrative Setup - 30 districts overview"
        ] 
      },
    ],
  },
  "4. Polity & Governance": {
    description: "Indian Constitution, political system, and governance mechanisms",
    topics: [
      { 
        name: "Indian Constitution", 
        subtopics: [
          "Historical Background - Making of Constitution, sources",
          "Preamble - Philosophy, amendments",
          "Fundamental Rights - Articles 14-35, restrictions, remedies",
          "Directive Principles - Classification, implementation",
          "Fundamental Duties - Article 51A, significance",
          "Amendment Procedure - Article 368, types",
          "Constitutional Bodies - UPSC, EC, CAG, Finance Commission"
        ] 
      },
      { 
        name: "Union Government", 
        subtopics: [
          "President - Election, powers, emergency provisions",
          "Prime Minister & Council of Ministers - Formation, powers",
          "Parliament - Lok Sabha, Rajya Sabha, legislative process",
          "Supreme Court - Composition, jurisdiction, judicial review"
        ] 
      },
      { 
        name: "State Government", 
        subtopics: [
          "Governor - Role, appointment, discretionary powers",
          "Chief Minister & Council - State executive",
          "State Legislature - Legislative Assembly, Council",
          "High Court - Powers, jurisdiction"
        ] 
      },
      { 
        name: "Local Government", 
        subtopics: [
          "Panchayati Raj - 73rd Amendment, three-tier system",
          "Urban Local Bodies - 74th Amendment, municipalities",
          "Devolution of Powers - Functions, finances, functionaries"
        ] 
      },
      { 
        name: "Governance & Public Administration", 
        subtopics: [
          "Civil Services - Role, training, reforms",
          "Administrative Reforms - ARC recommendations",
          "E-Governance - Digital India, citizen services",
          "RTI & Transparency - Right to Information Act, implementation"
        ] 
      },
    ],
  },
  "5. Economy & Budget (India & Odisha)": {
    description: "Indian economy structure, policies, and budgetary processes",
    topics: [
      { 
        name: "Indian Economy Basics", 
        subtopics: [
          "National Income - GDP, GNP, NNP, measurement issues",
          "Fiscal Policy - Government spending, taxation, deficit",
          "Monetary Policy - RBI tools, inflation targeting",
          "Planning in India - NITI Aayog, development strategies"
        ] 
      },
      { 
        name: "Sectors of Economy", 
        subtopics: [
          "Agriculture - Contribution, issues, policy reforms",
          "Industry - Manufacturing, Make in India, PLI schemes",
          "Services - IT, banking, healthcare, tourism"
        ] 
      },
      { 
        name: "Financial System", 
        subtopics: [
          "Banking - Commercial banks, PSBs, reforms, NPA crisis",
          "RBI - Functions, monetary policy tools",
          "Capital Markets - SEBI, stock exchanges, FPI/FDI",
          "NBFCs - Role, regulation, shadow banking",
          "Financial Inclusion - Jan Dhan, MUDRA, insurance penetration"
        ] 
      },
      { 
        name: "Public Finance", 
        subtopics: [
          "Union Budget - Process, key components",
          "Taxation - Direct, indirect, GST architecture",
          "Fiscal Deficit - Implications, FRBM Act",
          "Finance Commission - Role, devolution formula"
        ] 
      },
      { 
        name: "Odisha Economy", 
        subtopics: [
          "State Budget - Key features, revenue & capital",
          "Mining & Minerals - Revenue, DMF, environment issues",
          "Industrial Development - IPICOL, Make in Odisha",
          "Flagship Schemes - KALIA, Biju Swasthya Kalyan Yojana"
        ] 
      },
    ],
  },
  "6. Agriculture & Rural Development": {
    description: "Agricultural practices, policies, and rural development programs",
    topics: [
      { 
        name: "Agricultural Basics", 
        subtopics: [
          "Types of Farming - Subsistence, commercial, organic",
          "Cropping Patterns - Rabi, Kharif, Zaid crops",
          "Agricultural Inputs - Seeds, fertilizers, irrigation"
        ] 
      },
      { 
        name: "Agricultural Policies", 
        subtopics: [
          "Land Reforms - Zamindari abolition, ceiling, tenancy",
          "Green Revolution - Impact, second green revolution",
          "MSP & Procurement - CACP, food security",
          "Agricultural Marketing - APMC, e-NAM, reforms"
        ] 
      },
      { 
        name: "Allied Sectors", 
        subtopics: [
          "Animal Husbandry - Dairy, livestock development",
          "Fisheries - Blue revolution, marine & inland",
          "Forestry - Forest policy, community forestry"
        ] 
      },
      { 
        name: "Rural Development", 
        subtopics: [
          "MGNREGA - Implementation, impact, issues",
          "PMGSY - Rural connectivity",
          "Rural Housing - PMAY-G",
          "SHG & Microfinance - Livelihood programs"
        ] 
      },
    ],
  },
  "7. Environment, Ecology & Biodiversity": {
    description: "Environmental science, conservation, and sustainable development",
    topics: [
      { 
        name: "Ecology Basics", 
        subtopics: [
          "Ecosystems - Structure, function, types",
          "Food Chain & Web - Energy flow, trophic levels",
          "Biodiversity - Levels, hotspots, endemism",
          "Biogeochemical Cycles - Carbon, nitrogen, water"
        ] 
      },
      { 
        name: "Environmental Issues", 
        subtopics: [
          "Pollution - Air, water, soil, noise",
          "Climate Change - Causes, impacts, mitigation",
          "Deforestation - Causes, effects, solutions",
          "Waste Management - Solid, e-waste, hazardous"
        ] 
      },
      { 
        name: "Conservation & Laws", 
        subtopics: [
          "Wildlife Protection Act 1972 - Schedules, provisions",
          "Environment Protection Act 1986 - Framework law",
          "Forest Conservation Act - Diversion, compensatory afforestation",
          "Protected Areas - National parks, sanctuaries, reserves"
        ] 
      },
      { 
        name: "International Conventions", 
        subtopics: [
          "UNFCCC - Framework, COP meetings",
          "Paris Agreement - NDCs, goals, implementation",
          "CBD - Biodiversity convention, Nagoya Protocol",
          "CITES - Trade in endangered species"
        ] 
      },
      { 
        name: "Odisha Environment", 
        subtopics: [
          "Chilika Lake - Ramsar site, conservation challenges",
          "Simlipal Biosphere - Tiger reserve, tribal interface",
          "Bhitarkanika - Mangroves, crocodile sanctuary",
          "Olive Ridley Turtles - Gahirmatha, mass nesting",
          "Coastal Vulnerability - Erosion, cyclone impacts"
        ] 
      },
    ],
  },
  "8. Disaster Management": {
    description: "Natural and man-made disasters with focus on Odisha",
    topics: [
      { 
        name: "Natural Disasters", 
        subtopics: [
          "Cyclones - Formation, categories, impact mitigation",
          "Floods - Causes, management, early warning",
          "Earthquakes - Seismic zones, preparedness",
          "Droughts - Types, impact, relief measures"
        ] 
      },
      { 
        name: "Man-made Disasters", 
        subtopics: [
          "Industrial Disasters - Bhopal, prevention protocols",
          "Fire Disasters - Prevention, firefighting",
          "Nuclear & Radiological - Safety frameworks"
        ] 
      },
      { 
        name: "DM Framework", 
        subtopics: [
          "DM Act 2005 - Legal framework",
          "NDMA - National level coordination",
          "SDMA - State level machinery",
          "DM Cycle - Mitigation, preparedness, response, recovery"
        ] 
      },
      { 
        name: "Odisha Disaster Management", 
        subtopics: [
          "OSDMA - State agency, achievements",
          "Cyclone Preparedness - Super cyclone 1999 lessons",
          "Phailin, Fani Experience - Evacuation success stories",
          "Community Resilience - Task forces, training"
        ] 
      },
    ],
  },
  "9. Internal Security & Defence": {
    description: "Security challenges and defense preparedness",
    topics: [
      { 
        name: "Security Challenges", 
        subtopics: [
          "Terrorism - Types, cross-border, lone wolf",
          "Left Wing Extremism - Naxal movement, SAMADHAN",
          "Insurgency in NE - History, peace accords",
          "Communal Violence - Causes, prevention"
        ] 
      },
      { 
        name: "Border Management", 
        subtopics: [
          "Border Security Forces - BSF, ITBP, SSB",
          "Border Issues - LAC, LOC, international borders",
          "Coastal Security - Navy, Coast Guard"
        ] 
      },
      { 
        name: "Cyber Security", 
        subtopics: [
          "Cyber Threats - Types, state actors",
          "Cyber Laws - IT Act, CERT-In",
          "Critical Infrastructure Protection - Power grids, banking"
        ] 
      },
    ],
  },
  "10. Science & Technology": {
    description: "Scientific developments and technological advancements",
    topics: [
      { 
        name: "Basic Sciences", 
        subtopics: [
          "Physics in Everyday Life - Electricity, magnetism, optics",
          "Chemistry Basics - Elements, compounds, everyday chemicals",
          "Biology - Cell, genetics, human body systems"
        ] 
      },
      { 
        name: "Space Technology", 
        subtopics: [
          "ISRO Missions - Chandrayaan, Mangalyaan, Gaganyaan",
          "Satellite Applications - Communication, remote sensing, navigation",
          "Launch Vehicles - PSLV, GSLV, SSLV"
        ] 
      },
      { 
        name: "Biotechnology", 
        subtopics: [
          "Genetic Engineering - Gene editing, CRISPR",
          "Medical Biotechnology - Vaccines, diagnostics",
          "Agricultural Biotechnology - GM crops, Bt cotton"
        ] 
      },
      { 
        name: "IT & Emerging Tech", 
        subtopics: [
          "Artificial Intelligence - Applications, ethics",
          "Blockchain - Cryptocurrency, applications",
          "Internet of Things - Smart devices, applications"
        ] 
      },
      { 
        name: "Defence Technology", 
        subtopics: [
          "Indigenous Missiles - Agni, Prithvi, BrahMos",
          "DRDO Achievements - LCA Tejas, MBT Arjun",
          "Atmanirbhar Bharat in Defence - Self-reliance initiatives"
        ] 
      },
    ],
  },
  "11. Society & Social Issues": {
    description: "Indian society structure and contemporary social challenges",
    topics: [
      { 
        name: "Indian Society", 
        subtopics: [
          "Diversity - Religious, linguistic, ethnic",
          "Family & Kinship - Joint family, nuclear trends",
          "Social Stratification - Caste, class, tribe"
        ] 
      },
      { 
        name: "Social Issues", 
        subtopics: [
          "Women Issues - Gender inequality, crimes, empowerment",
          "Child Issues - Child labor, education, health",
          "Elderly & Disability - Welfare, accessibility"
        ] 
      },
      { 
        name: "Human Development", 
        subtopics: [
          "HDI - India's ranking, components",
          "Poverty - Measurement, trends, programs",
          "Health - Public health challenges, schemes",
          "Education - RTE, higher education reforms"
        ] 
      },
    ],
  },
  "12. Government Schemes": {
    description: "Central and state government flagship programs",
    topics: [
      { 
        name: "Central Schemes - Social Sector", 
        subtopics: [
          "PM Jan Dhan Yojana - Financial inclusion",
          "Ayushman Bharat - Health coverage",
          "PM Kisan Samman Nidhi - Direct income support",
          "Swachh Bharat Mission - Sanitation revolution"
        ] 
      },
      { 
        name: "Central Schemes - Infrastructure", 
        subtopics: [
          "PM Awas Yojana - Housing for all",
          "PM Gram Sadak Yojana - Rural roads",
          "Smart Cities Mission - Urban transformation",
          "Jal Jeevan Mission - Tap water to all"
        ] 
      },
      { 
        name: "Odisha State Schemes", 
        subtopics: [
          "KALIA - Farmer support scheme",
          "Biju Swasthya Kalyan Yojana - Health insurance",
          "Mission Shakti - Women SHGs",
          "Ama Hospital - Healthcare access"
        ] 
      },
    ],
  },
  "13. Current Affairs": {
    description: "National, international, and Odisha-specific current events",
    topics: [
      { 
        name: "National Affairs", 
        subtopics: [
          "Political Developments - Elections, governance",
          "Economic Policies - Budget, reforms",
          "Social Movements - Recent campaigns"
        ] 
      },
      { 
        name: "International Affairs", 
        subtopics: [
          "India's Foreign Policy - Neighbourhood, major powers",
          "Multilateral Forums - G20, BRICS, SCO, QUAD",
          "Global Conflicts - Geopolitical issues"
        ] 
      },
      { 
        name: "Science & Environment Current", 
        subtopics: [
          "Space Missions - Recent launches",
          "Climate Events - COP outcomes",
          "Tech Breakthroughs - AI, quantum"
        ] 
      },
    ],
  },
  "14. Miscellaneous GK": {
    description: "General knowledge essentials",
    topics: [
      { 
        name: "General Knowledge", 
        subtopics: [
          "Books & Authors - Recent important publications",
          "Awards & Honours - Padma, sports, literature awards",
          "Important Days - National, international",
          "Reports & Indices - HDI, GII, ease of doing business"
        ] 
      },
    ],
  },
};

export const CSAT_SYLLABUS = {
  "Comprehension": {
    description: "Reading comprehension and analytical passages",
    topics: [
      { name: "Reading Comprehension", subtopics: ["English Passages - Understanding, inference", "Decision Making Passages - Case-based comprehension"] },
    ],
  },
  "Logical Reasoning": {
    description: "Verbal and non-verbal reasoning abilities",
    topics: [
      { name: "Verbal Reasoning", subtopics: ["Analogies - Word relationships", "Series - Number, letter, mixed", "Classification - Odd one out", "Syllogism - Logical deductions", "Coding-Decoding - Pattern recognition"] },
      { name: "Non-Verbal Reasoning", subtopics: ["Pattern Recognition - Visual patterns", "Figure Completion - Missing piece", "Mirror & Water Images", "Paper Folding & Cutting"] },
    ],
  },
  "Analytical Ability": {
    description: "Data interpretation and problem analysis",
    topics: [
      { name: "Data Interpretation", subtopics: ["Tables - Data extraction, calculations", "Bar & Line Charts - Trend analysis", "Pie Charts - Percentage calculations", "Mixed DI - Complex presentations"] },
      { name: "Data Sufficiency", subtopics: ["Statement Analysis - Single/combined adequacy", "Decision Making - Case-based decisions"] },
    ],
  },
  "Quantitative Aptitude": {
    description: "Basic numeracy up to Class X level",
    topics: [
      { name: "Number System", subtopics: ["HCF/LCM - Calculations, word problems", "Divisibility Rules", "Remainders - Cyclic patterns"] },
      { name: "Arithmetic", subtopics: ["Percentage - Applications", "Ratio & Proportion", "Time & Work - Pipes, efficiency", "Time & Distance - Relative motion", "Profit & Loss", "Simple & Compound Interest"] },
      { name: "Basic Mathematics", subtopics: ["Algebra - Equations, inequalities", "Geometry - Triangles, circles, coordinate", "Mensuration - Area, volume"] },
    ],
  },
  "English Language": {
    description: "Basic English grammar and usage",
    topics: [
      { name: "Grammar", subtopics: ["Error Correction - Identify errors", "Fill in Blanks - Vocabulary, grammar", "Sentence Improvement", "Para Jumbles - Logical ordering"] },
    ],
  },
};

export const MAINS_SYLLABUS = {
  "Paper III - Essay": {
    description: "Essay writing on diverse themes (250 marks)",
    topics: [
      { 
        name: "Essay Writing Techniques", 
        subtopics: [
          "Structure - Introduction, body paragraphs, conclusion",
          "Argumentation - Building logical arguments with evidence",
          "Case Studies - Using examples effectively",
          "Word Management - 300-1200 word essays as per question"
        ] 
      },
      { 
        name: "Essay Themes", 
        subtopics: [
          "Governance & Public Policy - Administrative reforms, e-governance",
          "Social Issues - Gender, caste, education, health",
          "Economy & Development - Growth vs development, inclusion",
          "Ethics & Leadership - Moral dilemmas, public service values",
          "Science, Technology & Society - Digital divide, AI ethics",
          "Environment & Climate - Sustainable development",
          "Abstract Topics - Philosophical, quotation-based",
          "Odisha/Regional Issues - State-specific challenges"
        ] 
      },
    ],
  },
  "Paper IV - GS I (History, Culture, Society)": {
    description: "Indian Heritage, Culture, History and Geography (250 marks)",
    topics: [
      { name: "Art & Culture", subtopics: ["Indian Art Forms - Classical, folk, tribal", "Architecture - Temple, Islamic, colonial", "Literature - Sanskrit, regional, modern", "Music & Dance - Classical traditions"] },
      { name: "History", subtopics: ["Ancient India - Detailed study", "Medieval India - Sultanate, Mughals", "Modern India - Colonial period, independence", "World History - Revolutions, World Wars, decolonization"] },
      { name: "Society", subtopics: ["Salient Features of Indian Society", "Role of Women & Women's Organizations", "Population & Associated Issues", "Urbanization - Problems and remedies", "Communalism, Regionalism & Secularism"] },
      { name: "Geography", subtopics: ["Physical Geography of India", "Human Geography", "Economic Geography - Resources, industries"] },
    ],
  },
  "Paper V - GS II (Governance, Polity, IR)": {
    description: "Governance, Constitution, Polity, Social Justice and International Relations (250 marks)",
    topics: [
      { name: "Constitution & Polity", subtopics: ["Constitutional Framework - Features, amendments, basic structure", "Executive - President, PM, Governor, CM", "Legislature - Parliament, state legislatures, anti-defection", "Judiciary - SC, HC, judicial review, PIL, judicial activism"] },
      { name: "Governance", subtopics: ["Role of Civil Services in Democracy", "E-Governance - Applications, models, limitations", "Transparency & Accountability - RTI, citizen charters, social audit", "Development Processes - Role of NGOs, SHGs"] },
      { name: "Social Justice", subtopics: ["Welfare Schemes - Vulnerable sections", "Health & Education - Issues, policies", "Social Sector Development", "Poverty & Hunger - Measurement, programs"] },
      { name: "International Relations", subtopics: ["India's Foreign Policy Evolution", "India and Neighbors - Pakistan, China, Nepal, Bangladesh, Sri Lanka", "India and Major Powers - USA, Russia, EU, Japan", "International Organizations - UN, WTO, IMF, World Bank", "Regional Groupings - ASEAN, SAARC, BIMSTEC, SCO"] },
    ],
  },
  "Paper VI - GS III (Economy, Tech, Environment, Security)": {
    description: "Technology, Economic Development, Biodiversity, Environment, Security and Disaster Management (250 marks)",
    topics: [
      { name: "Economy", subtopics: ["Economic Development - Growth, employment, poverty", "Inclusive Growth - Financial inclusion, DBT", "Budgeting & Fiscal Policy - Union, state budgets", "Agriculture - Food security, technology, marketing", "Industrial Policy - Make in India, MSMEs"] },
      { name: "Science & Technology", subtopics: ["S&T Developments - Recent achievements", "Indigenization of Technology - Atmanirbhar Bharat", "Applications - IT, space, defense, biotech", "Awareness in S&T - Scientific temper"] },
      { name: "Environment", subtopics: ["Conservation & Pollution - Air, water, soil", "Environmental Impact Assessment", "Disaster Management - DM Act, NDMA/SDMA", "Climate Change - Mitigation, adaptation, NAPCC"] },
      { name: "Internal Security", subtopics: ["Internal Security Challenges - LWE, terrorism, insurgency", "Security Forces - Role, challenges, reforms", "Border Security - Infrastructure, smart fencing", "Cyber Security - Framework, CERT-In", "Money Laundering - Prevention, enforcement"] },
    ],
  },
  "Paper VII - GS IV (Ethics, Integrity, Aptitude)": {
    description: "Ethics, Integrity and Aptitude (250 marks)",
    topics: [
      { name: "Ethics & Morality", subtopics: ["Ethics & Human Interface - Essence, determinants", "Moral Concepts - Conscience, values, attitude", "Private & Public Relationships - Ethics in life"] },
      { name: "Attitude", subtopics: ["Content, Structure, Function", "Moral & Political Attitudes", "Social Influence & Persuasion"] },
      { name: "Emotional Intelligence", subtopics: ["Concepts, Application in Administration", "Emotional Quotient vs IQ"] },
      { name: "Civil Service Values", subtopics: ["Foundational Values - Integrity, impartiality, non-partisanship", "Aptitude - Civil service aptitude", "Ethical Dilemmas - Resolution frameworks"] },
      { name: "Probity in Governance", subtopics: ["Code of Conduct & Ethics - Administrative values", "Work Culture - Transformation approaches", "Information Sharing & Transparency", "Anti-Corruption Measures - RTI, whistleblower, Lokpal"] },
      { name: "Thinkers & Ethics", subtopics: ["Indian Thinkers - Gandhi, Vivekananda, Ambedkar", "Western Thinkers - Kant, Mill, Rawls"] },
      { name: "Case Studies", subtopics: ["Administrative Case Studies", "Ethical Dilemma Cases", "Decision Making Scenarios"] },
    ],
  },
};

export const OPTIONAL_PUBLIC_ADMINISTRATION = {
  "Paper I - Administrative Theory": {
    description: "Theoretical foundations of public administration",
    topics: [
      { name: "Introduction", subtopics: ["Meaning, scope, and significance", "Wilson's Vision of Public Administration", "Evolution of the discipline"] },
      { name: "Administrative Thought", subtopics: ["Scientific Management - Taylor, Fayol", "Bureaucratic Theory - Weber", "Human Relations - Elton Mayo", "Behavioral Approach - Simon, Chester Barnard", "Modern Approaches - New Public Administration, NPM"] },
      { name: "Organization Theory", subtopics: ["Classical theory", "Formal & informal organizations", "Hierarchy, span of control, unity of command", "Line, staff, and auxiliary agencies"] },
      { name: "Organizational Behavior", subtopics: ["Motivation theories - Maslow, Herzberg, McGregor", "Leadership - Styles, approaches", "Communication - Formal, informal channels"] },
      { name: "Personnel Administration", subtopics: ["Recruitment - Methods, civil services", "Training - Induction, in-service", "Career Development - Promotion, transfers", "Performance Appraisal - Methods, challenges"] },
      { name: "Financial Administration", subtopics: ["Budgeting - Types, processes", "Accounting & Audit - Comptroller, Auditor General", "Parliamentary control over finance"] },
      { name: "Accountability & Control", subtopics: ["Legislative control - Committees, questions", "Judicial control - Judicial review, tribunals", "Ombudsman & Citizens' Charters", "Citizen Participation"] },
      { name: "Comparative Administration", subtopics: ["Comparative methodology", "Riggs' Prismatic Model", "Development Administration"] },
    ],
  },
  "Paper II - Indian Administration": {
    description: "Indian administrative system and governance",
    topics: [
      { name: "Evolution of Indian Administration", subtopics: ["Kautilyan Administration", "Mughal Administration", "British legacy - Civil services, district administration", "Post-independence evolution"] },
      { name: "Union Administration", subtopics: ["President, Prime Minister, Council of Ministers", "Cabinet Secretariat, PMO", "Central Ministries & Departments", "Central-State Relations - Constitutional, administrative, financial"] },
      { name: "State Administration", subtopics: ["Governor, Chief Minister, Council of Ministers", "Secretariat - Organization, functioning", "Directorates - Field organization", "State & Union Territories - Special status states"] },
      { name: "District Administration", subtopics: ["District Collector - Role, challenges", "Changing role of Collector", "District & Sub-district Administration", "Panchayati Raj Institutions"] },
      { name: "Civil Services", subtopics: ["Constitutional provisions - UPSC, State PSCs", "All India Services - IAS, IPS, IFS", "State Civil Services", "Training of Civil Servants - LBSNAA, academies", "Reforms - 2nd ARC, lateral entry"] },
      { name: "Public Policy", subtopics: ["Policy formulation process", "Implementation machinery", "Evaluation mechanisms", "Role of media, pressure groups"] },
      { name: "Administrative Reforms", subtopics: ["Major reform commissions - 1st & 2nd ARC", "Administrative Reforms since 1991", "E-Governance initiatives", "Citizen centric administration"] },
      { name: "Financial Administration", subtopics: ["Union Budget process", "Finance Commission - Role, recent recommendations", "Goods and Services Tax", "Fiscal Federalism"] },
      { name: "Odisha Administration", subtopics: ["State administrative structure", "District administration in Odisha", "Panchayati Raj implementation", "State specific reforms", "5T Framework - Transparency, Technology, Teamwork, Time, Transformation"] },
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
  "Odia Language & Literature",
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
  { year: 2024, rank: 1, name: "To be updated from merit list", optional: "Public Administration", attempts: 2 },
  { year: 2024, rank: 2, name: "To be updated from merit list", optional: "Geography", attempts: 1 },
  { year: 2024, rank: 3, name: "To be updated from merit list", optional: "History", attempts: 3 },
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

export const USEFUL_LINKS = [
  { label: "OPSC Official Website", url: "https://www.opsc.gov.in", type: "official" },
  { label: "OPSC Advertisements", url: "https://www.opsc.gov.in/Advertisements", type: "official" },
  { label: "Testbook - OPSC", url: "https://testbook.com/opsc", type: "study" },
  { label: "StudyIQ - OPSC", url: "https://www.studyiq.com/opsc", type: "study" },
  { label: "Adda247 - OPSC", url: "https://www.adda247.com/opsc", type: "study" },
];

export const HOW_TO_USE = `
**How to use the OPSC 2026 Workspace:**

1. **Read the Exam Overview** and click the Official Notification link to verify eligibility details.
2. **In the Syllabus tab**, expand topics and attach your notes / PDFs to each node.
3. **Use 'Add to Timetable'** on any topic to schedule in your Study Calendar or Daily Tasks.
4. **Do PYQ practice** after finishing each major topic; tag weak questions for revision.
5. **Use 'Quick Revise' pages** for last-minute review (1-2 page summaries).
6. **For interview prep**, complete the Mock Interview checklist and upload your DAF.
7. **Ask NOVA Study** for concept explanations, MCQs, and answer structures.
`;
