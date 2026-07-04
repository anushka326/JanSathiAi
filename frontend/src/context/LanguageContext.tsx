import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "hi" | "mr";

export const LANGUAGE_STORAGE_KEY = "preferred_language";

const supportedLanguages: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
};

const translations = {
  en: {
    common: {
      nav: {
        home: "Home",
        schemes: "Browse Schemes",
        dashboard: "Dashboard",
        eligibility: "Eligibility Wizard",
        admin: "Admin Console",
        login: "Sign In",
        register: "Register",
      },
      language: "Language",
      theme: "Theme",
      logout: "Logout",
      loading: "Loading...",
      back: "Back",
      yes: "Yes",
      no: "No",
      userType: {
        admin: "Administrator",
        citizen: "Citizen",
      },
      genderOptions: {
        female: "Female",
        male: "Male",
        other: "Other",
        prefer_not_to_say: "Prefer not to say",
      },
      employmentOptions: {
        employed: "Employed",
        self_employed: "Self-employed",
        unemployed: "Unemployed",
        student: "Student",
        retired: "Retired",
      },
      schemeFilters: {
        all: "All Schemes",
        eligible: "Eligible Only",
        ineligible: "Ineligible Only",
      },
    },
    landing: {
      heroTitle: "Discover Government Schemes with Grounded AI & Audited Rules",
      heroSubtitle:
        "JanSathi AI bridges the gap between citizens and benefits. We combine a rule-based eligibility engine with RAG-grounded Gemini explanations for 100% auditable results.",
      startButton: "Start eligibility check",
      browseButton: "Browse Scheme Directory",
      whyTitle: "Why JanSathi AI?",
      whySubtitle: "How our architecture solves the problems found in typical scheme discovery apps.",
      categoriesTitle: "Explore Scheme Categories",
      categoriesSubtitle: "Comprehensive benefits tailored for the primary pillars of Indian society.",
      workflowTitle: "The JanSathi AI Workflow",
      workflowSubtitle: "From profile setup to claiming benefits, we ensure a seamless and private experience.",
      ctaTitle: "Ready to find your eligible benefits?",
      ctaSubtitle: "Sign up today to discover, save, and learn about government schemes with absolute privacy.",
      registerButton: "Register Citizen Profile",
      loginButton: "Citizen Sign In",
    },
    auth: {
      loginTitle: "Citizen Login",
      loginDescription: "Enter your credentials to access your saved schemes and history.",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      signInButton: "Sign In",
      noAccount: "Don't have an account?",
      registerLink: "Register here",
      demoCredentials: "Demo credentials",
      registerTitle: "Citizen Registration",
      registerDescription: "Create an account for personalized scheme recommendation.",
      fullNameLabel: "Full Name",
      stateLabel: "State of Residence",
      createAccountButton: "Register Citizen Profile",
      alreadyRegistered: "Already registered?",
      signInHere: "Sign in here",
      consentError: "You must consent to data processing for eligibility checks.",
      validationError: "All fields are required.",
      loginValidationError: "Email and password are required.",
      loginSuccess: "Login successful.",
      loginFailed: "Login failed.",
      loginFailedFallback: "Invalid email or password.",
      emailPlaceholder: "name@example.gov.in",
      passwordPlaceholder: "••••••••",
      registrationSuccess: "Your citizen profile has been created successfully.",
      registrationFailed: "Could not register account. Please try again.",
    },
    dashboard: {
      portalTitle: "Citizen Service Portal",
      welcome: "Welcome back, {{name}}",
      activeState: "Your citizen profile is active for state of {{state}}.",
      adminPanel: "Admin Panel",
      startWizard: "Start eligibility wizard",
      totalRecommendations: "Total Recommendations",
      savedSchemes: "Saved Schemes",
      securityProtection: "Security Protection",
      personalLibrary: "Personal Scheme Library",
      personalLibraryDesc: "Schemes you bookmarked for quick access and tracking.",
      noSavedSchemes: "You have not saved any schemes yet. Browse schemes to save.",
      browseDirectory: "Browse Directory",
      recommendedSchemes: "Recommended Schemes",
      recommendedDesc: "Personalized matches derived from your saved profile and deterministic eligibility rules.",
      noRecommendations: "Complete your profile to receive better recommendations.",
      removeScheme: "Scheme removed",
      profileSummaryTitle: "Profile Summary",
      profileSummaryDescription: "Your current demographic parameters.",
      profileFieldName: "Name",
      profileFieldEmail: "Email",
      profileFieldState: "State of Residence",
      profileFieldAge: "Age",
      profileFieldGender: "Gender",
      profileFieldOccupation: "Occupation",
      profileFieldIncome: "Annual Income",
      profileFieldCategory: "Category",
      profileFieldDisability: "Disability Flag",
      completeProfileNotice: "Complete your profile to receive better recommendations.",
      schemeSource: "Central/State scheme",
      updateProfileButton: "Update Profile Data",
    },
    schemes: {
      pageTitle: "Scheme Directory",
      pageSubtitle: "Browse and query central and state benefits using semantic smart search.",
      searchPlaceholder: "Search by name, benefit, state, keywords...",
      noResultsTitle: "No schemes match your filter or search query.",
      noResultsDesc: "Try refining your search terms or clearing the active category tab.",
      clearFilters: "Clear Search & Filters",
      explain: "Explain with AI",
      officialPortal: "Official Portal",
      allSchemes: "All Schemes",
      categoryTabs: {
        all: "All Schemes",
        farmer: "Farmers",
        student: "Students",
        women: "Women Welfare",
        worker: "Workers",
        senior: "Senior Citizens",
        divyang: "Divyang",
        health: "Health",
        housing: "Housing",
        employment: "Employment",
      },
      loadErrorTitle: "Unable to load schemes",
      loadErrorDescription: "Please verify the backend is running and try again.",
      decisionCard: {
        eligible: "Eligible",
        ineligible: "Ineligible",
        matchBadge: "{{percentage}}% Match",
        matchingCriteria: "Matching Criteria",
        recommendationExplanation: "Recommendation Explanation",
        evaluationReasons: "Evaluation Reasons",
        schemeBenefit: "Scheme Benefit",
        requiredDocuments: "Required Documents",
        noDocumentsListed: "No documents listed",
        saveScheme: "Save Scheme",
        removeFromSaved: "Remove from Saved",
        authenticationRequiredTitle: "Authentication Required",
        authenticationRequiredDescription: "Please log in or register to save schemes to your personal library.",
        schemeSaved: "Scheme Saved",
        schemeUnsaved: "Scheme Unsaved",
        actionFailed: "Action Failed",
        explainWithAI: "Explain with AI",
        officialPortal: "Official Portal",
        profileOverlap: "Recommended because: {{reasons}}",
        eligibilityMismatch: "Not recommended because: {{reasons}}",
      },
    },
    eligibility: {
      pageTitle: "Eligibility Results Mapping",
      pageSubtitle: "Audit-ready outcomes from deterministic profile matching.",
      pageBannerTitle: "Privacy Agreement",
      pageBannerText:
        "JanSathi only uses the demographic details you provide to match schemes. No documents are stored permanently.",
      formTitle: "Eligibility Profile Wizard",
      formDescription: "Deterministic matching engine validation.",
      uploadTitle: "Auto-fill via Identity Document (OCR)",
      uploadText: "Upload Aadhaar card or Marksheet. Masking is applied in-memory.",
      uploadButton: "Upload Document",
      uploadScanning: "Scanning Document...",
      nameLabel: "Citizen Name",
      ageLabel: "Age",
      incomeLabel: "Annual Income (INR)",
      genderLabel: "Gender",
      categoryLabel: "Category",
      occupationLabel: "Occupation",
      stateLabel: "State of Residence",
      employmentLabel: "Employment Status",
      studentStatus: "Student Flag",
      farmerStatus: "Farmer Flag",
      disabilityStatus: "Disabled Flag",
      ruralResident: "Rural Resident",
      puccaHouse: "Owns Pucca House",
      bankAccount: "Has Bank Account",
      demographicFlags: "Demographic Flags",
      consentLabel: "I verify that my parameters are accurate. I consent to JanSathi processing this profile data to determine matching schemes.",
      welcomeBannerTitle: "Privacy Agreement",
      welcomeBannerDescription: "No files are stored permanently on server disks. Sensitive identifiers are masked in-memory and deterministic criteria are evaluated securely.",
      stepTitle: "Step {{step}}",
      stepOne: "Fill your personal and demographic details accurately.",
      stepTwo: "Upload Aadhaar/ID for instant OCR-assisted entry.",
      stepThree: "Review eligible schemes and follow official application guidance.",
      stepFour: "Use the explanation drawer for scheme-specific AI guidance.",
      profileSnapshotTitle: "Profile Snapshot",
      quickResultsTitle: "Quick Results",
      filterViewTitle: "Filter View",
      eligibleSchemesLabel: "Eligible schemes",
      ineligibleSchemesLabel: "Ineligible schemes",
      outcomeHeading: "Outcome summary",
      outcomeCopy: "Based on your submitted profile, the eligibility engine has mapped {{eligible}} eligible schemes and {{ineligible}} ineligible schemes.",
      noEligibleSchemes: "No eligible schemes matched this demographic profile.",
      updateProfileButton: "Update Profile Data",
      browseDirectory: "Browse Scheme Directory",
      resultsSummary: "Based on your submitted profile, the eligibility engine has mapped {{eligible}} eligible schemes and {{ineligible}} ineligible schemes.",
      highPriorityHint: "Start with high-priority eligible benefits.",
      reviewProfileHint: "Review the profile inputs and try again.",
    },
    explain: {
      aiAssistant: "AI Assistant Explanation",
      groundedContextTitle: "Grounded Context",
      groundedContextBody:
        "This breakdown is compiled dynamically using verified parameters from the Ministry database and generated securely by Gemini.",
      closeDrawer: "Close Drawer",
      drawerSubtitle: "AI-generated explanation with source-aware context.",
    },
    footer: {
      aboutTitle: "About JanSathi AI",
      aboutText: "A secure GovtTech platform for citizens to discover, save, and understand scheme eligibility.",
      quickLinks: "Quick Links",
      contactTitle: "Support",
      contactEmail: "support@jansathi.gov.in",
      legal: "© 2026 JanSathi AI. All rights reserved.",
      platformLabel: "Government Scheme Discovery Platform",
      developedBy: "Developed By",
      technologyUsed: "Technology Used",
      copyright:
        "© 2026 JanSathi AI. Built for the Build for Good National Hackathon. Made using AI for Social Good. All Government Scheme information belongs to their respective Government Departments.",
      creatorRole: "Frontend, AI workflow and product experience",
      github: "GitHub",
      linkedin: "LinkedIn",
      email: "Email",
      links: {
        home: "Home",
        schemes: "Schemes",
        dashboard: "Dashboard",
        eligibility: "Eligibility",
      },
      resourcesTitle: "Government Resources",
      resources: "National Portal, Digital India, MyGov",
    },
    admin: {
      header: "GovTech Control Console",
      description: "Analyze usage metrics, audit data accesses, and modify the scheme database.",
      returnDashboard: "Return to Dashboard",
      accessDenied: "Admin rights required.",
    },
  },
  hi: {
    common: {
      nav: {
        home: "मुख्य पृष्ठ",
        schemes: "योजनाएँ",
        dashboard: "डैशबोर्ड",
        eligibility: "पात्रता विज़ार्ड",
        admin: "व्यवस्थापक कंसोल",
        login: "साइन इन",
        register: "रजिस्टर करें",
      },
      language: "भाषा",
      theme: "थीम",
      logout: "लॉग आउट",
      loading: "लोड हो रहा है...",
      back: "वापस",
      yes: "हाँ",
      no: "नहीं",
      userType: {
        admin: "प्रशासक",
        citizen: "नागरिक",
      },
      genderOptions: {
        female: "महिला",
        male: "पुरुष",
        other: "अन्य",
        prefer_not_to_say: "कहना पसंद नहीं",
      },
      employmentOptions: {
        employed: "नियोजित",
        self_employed: "स्वयंरोजगार",
        unemployed: "बेरोज़गार",
        student: "छात्र",
        retired: "सेवानिवृत्त",
      },
      schemeFilters: {
        all: "सभी योजनाएँ",
        eligible: "केवल पात्र",
        ineligible: "अयोग्य केवल",
      },
    },
    landing: {
      heroTitle: "सशक्त AI और सत्यापित नियमों के साथ सरकारी योजनाएँ खोजें",
      heroSubtitle:
        "JanSathi AI नागरिकों और लाभों के बीच की दूरी कम करता है। हम रूल-आधारित पात्रता इंजन को RAG-आधारित Gemini व्याख्याओं के साथ जोड़ते हैं।",
      startButton: "पात्रता जांच शुरू करें",
      browseButton: "योजना निर्देशिका देखें",
      whyTitle: "क्यों JanSathi AI?",
      whySubtitle: "हमारे आर्किटेक्चर से सामान्य योजना खोज ऐप में किस समस्या का समाधान होता है।",
      categoriesTitle: "योजना श्रेणियाँ खोजें",
      categoriesSubtitle: "भारतीय समाज के मुख्य स्तंभों के लिए लाभ।",
      workflowTitle: "JanSathi AI कार्यप्रणाली",
      workflowSubtitle: "प्रोफ़ाइल सेटअप से दावे तक, हम सुरक्षित और सरल अनुभव सुनिश्चित करते हैं।",
      ctaTitle: "अपने पात्र लाभ खोजने के लिए तैयार?",
      ctaSubtitle: "आज ही साइन अप करें और गोपनीयता के साथ योजनाएँ खोजें।",
      registerButton: "नागरिक पंजीकरण करें",
      loginButton: "नागरिक साइन इन",
    },
    auth: {
      loginTitle: "नागरिक लॉगिन",
      loginDescription: "अपनी सहेजी योजनाओं और इतिहास तक पहुंच के लिए अपना प्रमाण दर्ज करें।",
      emailLabel: "ईमेल पता",
      passwordLabel: "पासवर्ड",
      signInButton: "साइन इन",
      noAccount: "खाता नहीं है?",
      registerLink: "यहाँ रजिस्टर करें",
      demoCredentials: "डेमो क्रेडेंशियल",
      registerTitle: "नागरिक पंजीकरण",
      registerDescription: "व्यक्तिगत योजना सिफ़ारिश के लिए एक खाता बनाएँ।",
      fullNameLabel: "पूरा नाम",
      stateLabel: "निवास राज्य",
      createAccountButton: "नागरिक पंजीकरण करें",
      alreadyRegistered: "पहले से पंजीकृत हैं?",
      signInHere: "यहाँ साइन इन करें",
      consentError: "पात्रता जांच के लिए डेटा प्रोसेसिंग की सहमति आवश्यक है।",
      validationError: "सभी फ़ील्ड आवश्यक हैं।",
      registrationSuccess: "आपकी नागरिक प्रोफ़ाइल सफलतापूर्वक बनाई गई है।",
      registrationFailed: "खाता पंजीकृत नहीं किया जा सका। कृपया पुनः प्रयास करें।",
    },
    dashboard: {
      portalTitle: "नागरिक सेवा पोर्टल",
      welcome: "फिर से स्वागत है, {{name}}",
      activeState: "आपकी नागरिक प्रोफ़ाइल {{state}} राज्य के लिए सक्रिय है।",
      adminPanel: "एडमिन पैनल",
      startWizard: "पात्रता विज़ार्ड शुरू करें",
      totalRecommendations: "कुल सिफ़ारिशें",
      savedSchemes: "सहेजी गई योजनाएँ",
      securityProtection: "सुरक्षा संरक्षण",
      personalLibrary: "व्यक्तिगत योजना पुस्तकालय",
      personalLibraryDesc: "त्वरित पहुंच और ट्रैकिंग के लिए आपकी बुकमार्क की गई योजनाएँ।",
      noSavedSchemes: "आपने अभी तक कोई योजना सहेजी नहीं है। निर्देशिका देखें।",
      browseDirectory: "निर्देशिका देखें",
      recommendedSchemes: "अनुशंसित योजनाएँ",
      recommendedDesc: "आपकी प्रोफ़ाइल और नियम आधारित मैच से व्यक्तिगत सिफ़ारिशें।",
      noRecommendations: "बेहतर सिफ़ारिशों के लिए अपनी प्रोफ़ाइल पूरी करें।",
      removeScheme: "योजना हटाई गई",
    },
    schemes: {
      pageTitle: "योजना निर्देशिका",
      pageSubtitle: "स्मार्ट सर्च के साथ केंद्रीय और राज्य लाभ ब्राउज़ करें।",
      searchPlaceholder: "नाम, लाभ, राज्य, कीवर्ड से खोजें...",
      noResultsTitle: "कोई योजना आपके फ़िल्टर या खोज के अनुरूप नहीं है।",
      noResultsDesc: "खोज शब्दों को परिष्कृत करें या सक्रिय श्रेणी साफ़ करें।",
      clearFilters: "खोज और फ़िल्टर साफ़ करें",
      explain: "AI से व्याख्या करें",
      officialPortal: "आधिकारिक पोर्टल",
      allSchemes: "सभी योजनाएँ",
    },
    eligibility: {
      pageTitle: "पात्रता परिणाम मैपिंग",
      pageSubtitle: "नियमित प्रोफ़ाइल मिलान से ऑडिट-तैयार परिणाम।",
      pageBannerTitle: "गोपनीयता समझौता",
      pageBannerText: "JanSathi केवल आपके द्वारा दी गई जनसांख्यिकीय जानकारी का उपयोग योजनाओं से मेल करने के लिए करता है। कोई दस्तावेज़ स्थायी रूप से संग्रहीत नहीं होते।",
      formTitle: "पात्रता प्रोफ़ाइल विज़ार्ड",
      formDescription: "नियतात्मक मिलान इंजन सत्यापन।",
      uploadTitle: "पहचान दस्तावेज़ (OCR) के माध्यम से स्वचालित फ़िल",
      uploadText: "आधार कार्ड या मार्कशीट अपलोड करें। इन-मेमोरी में मास्किंग की जाती है।",
      uploadButton: "दस्तावेज़ अपलोड करें",
      uploadScanning: "दस्तावेज़ स्कैन किया जा रहा है...",
      nameLabel: "नागरिक नाम",
      ageLabel: "आयु",
      incomeLabel: "वार्षिक आय (INR)",
      genderLabel: "लैंगिकता",
      occupationLabel: "पेशा",
      stateLabel: "निवास राज्य",
      employmentLabel: "रोज़गार स्थिति",
      studentStatus: "छात्र फ्लैग",
      farmerStatus: "किसान फ्लैग",
      disabilityStatus: "विकलांग फ्लैग",
      ruralResident: "ग्रामीण निवासी",
      puccaHouse: "कच्चा घर",
      bankAccount: "बैंक खाता है",
      demographicFlags: "जनसांख्यिकीय फ़्लैग",
      consentLabel: "मैं सत्यापित करता हूँ कि मेरी जानकारी सही है। मैं JanSathi को इस डेटा को प्रोसेस करने की अनुमति देता हूँ।",
      welcomeBannerTitle: "गोपनीयता समझौता",
      welcomeBannerDescription: "कोई फ़ाइलें सर्वर डिस्क पर स्थायी रूप से संग्रहीत नहीं की जाती हैं। संवेदनशील पहचानकर्ता इन-मेमोरी में मास्क किए जाते हैं और नियम आधारित मानदंड सुरक्षित रूप से मूल्यांकित किए जाते हैं।",
      stepTitle: "चरण {{step}}",
      stepOne: "अपनी व्यक्तिगत और जनसांख्यिकीय जानकारी सटीक रूप से भरें।",
      stepTwo: "तुरंत OCR-सहायता के लिए आधार/ID अपलोड करें।",
      stepThree: "पात्र योजनाओं की समीक्षा करें और आधिकारिक मार्गदर्शन का पालन करें।",
      stepFour: "योजना-विशिष्ट AI मार्गदर्शन के लिए स्पष्टीकरण ड्रॉअर का उपयोग करें।",
      profileSnapshotTitle: "प्रोफ़ाइल स्नैपशॉट",
      quickResultsTitle: "त्वरित परिणाम",
      filterViewTitle: "फ़िल्टर व्यू",
      eligibleSchemesLabel: "पात्र योजनाएँ",
      ineligibleSchemesLabel: "अयोग्य योजनाएँ",
      outcomeHeading: "परिणाम सारांश",
      outcomeCopy: "आपके प्रस्तुत प्रोफ़ाइल के आधार पर, पात्रता इंजन ने {{eligible}} पात्र योजनाएँ और {{ineligible}} अयोग्य योजनाएँ मैप की हैं।",
      noEligibleSchemes: "इस जनसांख्यिकीय प्रोफ़ाइल से कोई पात्र योजना मेल नहीं खाती है।",
      updateProfileButton: "प्रोफ़ाइल डेटा अपडेट करें",
      browseDirectory: "योजना निर्देशिका देखें",
    },
    explain: {
      aiAssistant: "AI सहायक व्याख्या",
      groundedContextTitle: "संदर्भित संदर्भ",
      groundedContextBody:
        "यह विश्लेषण मंत्रालय डेटाबेस के सत्यापित मानदंडों के आधार पर सुरक्षित रूप से Gemini द्वारा जेनरेट किया गया है।",
      closeDrawer: "ड्रावर बंद करें",
      drawerSubtitle: "स्रोत-सचेत संदर्भ के साथ AI-जनित व्याख्या।",
    },
    footer: {
      aboutTitle: "JanSathi AI के बारे में",
      aboutText: "नागरिकों के लिए योजनाओं को खोजने, सहेजने और समझने के लिए सुरक्षित GovtTech प्लेटफ़ॉर्म।",
      quickLinks: "त्वरित लिंक",
      contactTitle: "सहायता",
      contactEmail: "support@jansathi.gov.in",
      legal: "© 2026 JanSathi AI। सर्वाधिकार सुरक्षित।",
      links: {
        home: "मुख्य पृष्ठ",
        schemes: "योजनाएँ",
        dashboard: "डैशबोर्ड",
        eligibility: "पात्रता",
      },
      resourcesTitle: "सरकारी संसाधन",
      resources: ["राष्ट्रीय पोर्टल", "Digital India", "MyGov"],
    },
    admin: {
      header: "GovTech कंट्रोल कंसोल",
      description: "उपयोग मेट्रिक्स, ऑडिट लॉग और योजना डेटाबेस संशोधन देखें।",
      returnDashboard: "डैशबोर्ड पर वापस जाएं",
      accessDenied: "एडमिन अधिकार आवश्यक हैं।",
    },
  },
  mr: {
    common: {
      nav: {
        home: "मुख्य पृष्ठ",
        schemes: "योजना",
        dashboard: "डॅशबोर्ड",
        eligibility: "पात्रता विज़ार्ड",
        admin: "प्रशासक कन्सोल",
        login: "साइन इन",
        register: "नोंदणी",
      },
      language: "भाषा",
      theme: "थीम",
      logout: "लॉग आउट",
      loading: "लोड होत आहे...",
      back: "मागे",
      yes: "होय",
      no: "नाही",
    },
    landing: {
      heroTitle: "शासकीय योजनांचे AI सह शोध आणि सत्यापित नियमांसह उपयोग",
      heroSubtitle:
        "JanSathi AI नागरिक आणि फायदे यांच्यातील अंतर कमी करते. आम्ही नियम-आधारित पात्रता इंजिन आणि RAG-आधारित Gemini स्पष्टीकरण एकत्र करतो.",
      startButton: "पात्रता तपासणी सुरू करा",
      browseButton: "योजना निर्देशिका पहा",
      whyTitle: "का JanSathi AI?",
      whySubtitle: "आमचे आर्किटेक्चर पारंपारिक योजना शोध अॅपमधील समस्या कशा सोडवते.",
      categoriesTitle: "योजना श्रेण्या शोधा",
      categoriesSubtitle: "भारतीय समाजाच्या प्रमुख स्तंभांसाठी व्यापक फायदे.",
      workflowTitle: "JanSathi AI कार्यप्रणाली",
      workflowSubtitle: "प्रोफाइल सेटअपपासून दावा करण्यापर्यंत, आम्ही सुरक्षित आणि सुलभ अनुभव सुनिश्चित करतो.",
      ctaTitle: "पात्र लाभ शोधण्यासाठी तयार आहात?",
      ctaSubtitle: "आजच साइन अप करा आणि गोपनीयतेसह योजना शोधा.",
      registerButton: "नागरिक नोंदणी करा",
      loginButton: "नागरिक साइन इन",
    },
    auth: {
      loginTitle: "नागरिक लॉगिन",
      loginDescription: "तुमच्या साठवलेल्या योजना आणि इतिहासासाठी प्रवेश करण्यासाठी तुमचा प्रमाणपत्र भरा.",
      emailLabel: "ईमेल पत्ता",
      passwordLabel: "संकेतशब्द",
      signInButton: "साइन इन",
      noAccount: "खाते नाही का?",
      registerLink: "इथे नोंदणी करा",
      demoCredentials: "डेमो क्रेडेन्शियल",
      registerTitle: "नागरिक नोंदणी",
      registerDescription: "वैयक्तिकृत योजना शिफारशींसाठी खाते तयार करा.",
      fullNameLabel: "पूर्ण नाव",
      stateLabel: "निवास राज्य",
      createAccountButton: "नागरिक नोंदणी करा",
      alreadyRegistered: "अगोदर नोंदणी केली आहे?",
      signInHere: "इथे साइन इन करा",
      consentError: "पात्रता तपासणीसाठी डेटा प्रक्रियेची संमती आवश्यक आहे.",
      validationError: "सर्व फील्ड आवश्यक आहेत.",
      loginValidationError: "ईमेल आणि पासवर्ड आवश्यक आहेत.",
      loginSuccess: "लॉगिन यशस्वी.",
      loginFailed: "लॉगिन अयशस्वी.",
      loginFailedFallback: "अवैध ईमेल किंवा पासवर्ड.",
      emailPlaceholder: "name@example.gov.in",
      passwordPlaceholder: "••••••••",
    },
    dashboard: {
      portalTitle: "नागरिक सेवा पोर्टल",
      welcome: "परत स्वागत आहे, {{name}}",
      activeState: "तुमची नागरिक प्रोफाइल {{state}} राज्यासाठी सक्रिय आहे.",
      adminPanel: "प्रशासक पॅनल",
      startWizard: "पात्रता विज़ार्ड सुरू करा",
      totalRecommendations: "एकूण शिफारसी",
      savedSchemes: "जतन केलेल्या योजना",
      securityProtection: "सुरक्षा संरक्षण",
      personalLibrary: "वैयक्तिक योजना पुस्तकालय",
      personalLibraryDesc: "जलद प्रवेश आणि ट्रॅकिंगसाठी तुमच्या बुकमार्क केलेल्या योजना.",
      noSavedSchemes: "तुम्ही अजून कोणतीही योजना जतन केलेली नाही. निर्देशिका पहा.",
      browseDirectory: "निर्देशिका पहा",
      recommendedSchemes: "शिफारस केलेल्या योजना",
      recommendedDesc: "तुमच्या प्रोफाइल आणि नियमाधारित जुळणीवरून वैयक्तिकृत शिफारसी.",
      noRecommendations: "चांगल्या शिफारसीसाठी तुमची प्रोफाइल पूर्ण करा.",
      removeScheme: "योजना काढली गेली",
      profileSummaryTitle: "प्रोफाइल सारांश",
      profileSummaryDescription: "तुमचे वर्तमान लोकसंख्याशास्त्र पॅरामीटर.",
      profileFieldName: "नाव",
      profileFieldEmail: "ईमेल",
      profileFieldState: "निवास राज्य",
      profileFieldAge: "वय",
      profileFieldGender: "लैंगिकता",
      profileFieldOccupation: "व्यवसाय",
      profileFieldIncome: "वार्षिक उत्पन्न",
      profileFieldCategory: "श्रेणी",
      profileFieldDisability: "अपंग स्थिती",
      completeProfileNotice: "चांगल्या शिफारसीसाठी आपली प्रोफाइल पूर्ण करा.",
      schemeSource: "केंद्रीय/राज्य योजना",
      updateProfileButton: "प्रोफाइल डेटा अद्यतनित करा",
    },
    schemes: {
      pageTitle: "योजना निर्देशिका",
      pageSubtitle: "स्मार्ट शोध वापरून केंद्रीय आणि राज्य फायदे ब्राउझ करा.",
      searchPlaceholder: "नाव, लाभ, राज्य, कीवर्डद्वारे शोधा...",
      noResultsTitle: "कोणतीही योजना तुमच्या फिल्टर किंवा शोधाशी जुळत नाही.",
      noResultsDesc: "शोध शब्द परिष्कृत करा किंवा सक्रिय श्रेणी साफ करा.",
      clearFilters: "शोध आणि फिल्टर साफ करा",
      explain: "AI शी स्पष्ट करा",
      officialPortal: "अधिकृत पोर्टल",
      allSchemes: "सर्व योजना",
    },
    eligibility: {
      pageTitle: "पात्रता निकाल नकाशा",
      pageSubtitle: "नियत प्रोफाइल जुळणीपासून ऑडिट-तैयार परिणाम.",
      pageBannerTitle: "गोपनीयता करार",
      pageBannerText: "JanSathi फक्त तुम्ही दिलेल्या लोकसंख्याशास्त्रीय माहितीचा उपयोग योजनांशी जुळणीसाठी करतो. कोणतीही कागदपत्रे कायमस्वरूपी संचयित केली जात नाहीत.",
      formTitle: "पात्रता प्रोफाइल विज़ार्ड",
      formDescription: "नियतात्मक जुळणी इंजिन पडताळणी.",
      uploadTitle: "ओसीआरद्वारे ओळख दस्तऐवजाने ऑटो-फिल",
      uploadText: "आधार कार्ड किंवा मार्कशीट अपलोड करा. इन-मेमरीमध्ये मास्किंग केले जाते.",
      uploadButton: "दस्तऐवज अपलोड करा",
      uploadScanning: "दस्तऐवज स्कॅन केले जात आहे...",
      nameLabel: "नागरिक नाव",
      ageLabel: "वय",
      incomeLabel: "वार्षिक उत्पन्न (INR)",
      genderLabel: "लैंगिकता",
      occupationLabel: "व्यवसाय",
      stateLabel: "निवास राज्य",
      employmentLabel: "नोकरी स्थिती",
      studentStatus: "विद्यार्थी स्थिती",
      farmerStatus: "शेतकरी स्थिती",
      disabilityStatus: "अपंग स्थिती",
      ruralResident: "ग्रामीण रहिवासी",
      puccaHouse: "पक्का घर आहे",
      bankAccount: "बँक खाते आहे",
      demographicFlags: "लोकसंख्याशास्त्रीय ध्वज",
      consentLabel: "मी माझी माहिती बरोबर असल्याचे सत्यापित करतो. मी JanSathi ला ही माहिती प्रक्रिया करण्याची परवानगी देतो.",
      submitButton: "पात्र योजना तपासा",
      submitLoading: "जुळणी गणना केली जात आहे...",
    },
    explain: {
      aiAssistant: "AI सहाय्यक स्पष्टीकरण",
      groundedContextTitle: "संदर्भित संदर्भ",
      groundedContextBody:
        "हे विश्लेषण मंत्रालय डेटाबेसच्या सत्यापित निकषांवर आधारित सुरक्षितपणे Gemini द्वारा तयार केलेले आहे.",
      closeDrawer: "ड्रॉवर बंद करा",
      drawerSubtitle: "स्रोत-जागरूक संदर्भासह AI-निर्मित स्पष्टीकरण.",
    },
    footer: {
      aboutTitle: "JanSathi AI बद्दल",
      aboutText: "नागरिकांसाठी योजना शोधण्यासाठी, जतन करण्यासाठी आणि समजण्यासाठी सुरक्षित GovtTech प्लॅटफॉर्म.",
      quickLinks: "झटपट दुवे",
      contactTitle: "सपोर्ट",
      contactEmail: "support@jansathi.gov.in",
      legal: "© 2026 JanSathi AI. सर्व हक्क राखीव.",
      links: {
        home: "मुख्य पृष्ठ",
        schemes: "योजना",
        dashboard: "डॅशबोर्ड",
        eligibility: "पात्रता",
      },
      resourcesTitle: "शासकीय संसाधने",
      resources: ["राष्ट्रीय पोर्टल", "Digital India", "MyGov"],
    },
    admin: {
      header: "GovTech कंट्रोल कन्सोल",
      description: "वापर मेट्रिक्स, ऑडिट लॉग आणि योजना डेटाबेस सुधारणा पहा.",
      returnDashboard: "डॅशबोर्डवर परत जा",
      accessDenied: "प्रशासक अधिकार आवश्यक आहेत.",
    },
  },
} as const;

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languageLabel: string;
  supportedLanguages: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

function resolveTranslation(key: string, language: Language): string {
  const keys = key.split(".");
  let current: any = translations[language] || translations.en;

  for (const segment of keys) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      current = undefined;
      break;
    }
  }

  if (Array.isArray(current)) {
    return current.join(", ");
  }

  if (typeof current === "string") {
    return current;
  }

  if (language !== "en") {
    return resolveTranslation(key, "en");
  }

  return key;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "hi" || stored === "mr") {
      return stored;
    }
    const browserLang = window.navigator.language.toLowerCase();
    if (browserLang.startsWith("hi")) return "hi";
    if (browserLang.startsWith("mr")) return "mr";
    return "en";
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next: Language) => setLanguageState(next),
      t: (key: string, vars?: Record<string, string | number>) => {
        let text = resolveTranslation(key, language);
        if (vars) {
          for (const [name, value] of Object.entries(vars)) {
            text = text.replace(`{{${name}}}`, String(value));
          }
        }
        return text;
      },
      languageLabel: supportedLanguages[language],
      supportedLanguages,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return value;
}
