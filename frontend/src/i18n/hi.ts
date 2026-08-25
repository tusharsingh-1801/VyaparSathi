import type { TranslationDictionary } from "./en";

const hi: TranslationDictionary = {
  appName: "एंटरप्राइज़ इंटेलिजेंस",
  appTagline: "ग्रामीण एवं अर्ध-शहरी व्यवसाय निर्णय सहायता",

  nav: {
    dashboard: "डैशबोर्ड",
    discovery: "व्यवसाय खोज",
    market: "बाज़ार जानकारी",
    financial: "वित्तीय योजनाकार",
    schemes: "सरकारी योजनाएं",
    stress: "स्ट्रेस सिम्युलेटर",
    report: "व्यवहार्यता रिपोर्ट",
    advisor: "एआई सलाहकार",
    profile: "व्यवसाय प्रोफ़ाइल",
  },

  topbar: {
    language: "भाषा",
    notifications: "सूचनाएं",
    settings: "सेटिंग्स",
    switchProfile: "प्रोफ़ाइल बदलें",
    logout: "लॉग आउट",
  },

  common: {
    loading: "लोड हो रहा है...",
    retry: "पुनः प्रयास करें",
    viewDetails: "विवरण देखें",
    close: "बंद करें",
    submit: "जमा करें",
    cancel: "रद्द करें",
    save: "सहेजें",
    edit: "संपादित करें",
    comingSoon: "जल्द आ रहा है",
    insufficientData: "अपर्याप्त डेटा",
    verified: "सत्यापित",
    estimated: "अनुमानित",
    userProvided: "उपयोगकर्ता द्वारा प्रदत्त",
    source: "स्रोत",
    status: "स्थिति",
  },

  dashboard: {
    title: "आपकी एंटरप्राइज़ इंटेलिजेंस",
    welcome: "वापसी पर स्वागत है",
    subtitle: "डेटा → विश्लेषण → निर्णय → कार्रवाई",
    opportunityScore: "अवसर स्कोर",
    financialHealth: "वित्तीय स्वास्थ्य स्कोर",
    recommendedProject: "अनुशंसित परियोजना लागत",
    recommendedLoan: "अनुशंसित वित्तपोषण",
    recommendedScheme: "अनुशंसित योजना",
    riskLevel: "जोखिम स्तर",
    dataConfidence: "डेटा विश्वसनीयता",
    cta: "मेरे सर्वश्रेष्ठ व्यावसायिक अवसर देखें",
    noProfileYet: "अपनी एंटरप्राइज़ इंटेलिजेंस यहां देखने के लिए व्यवसाय खोज चलाएं।",
    recentReports: "हाल की रिपोर्ट",
    quickActions: "त्वरित कार्रवाई",
  },

  discovery: {
    title: "व्यवसाय खोज",
    subtitle: "मुझे कौन-सा व्यवसाय शुरू करना चाहिए?",
    searchCta: "सर्वश्रेष्ठ-उपयुक्त व्यवसाय खोजें",
    rank: "रैंक",
    overallScore: "अवसर स्कोर",
    whyRecommended: "यह स्कोर क्यों?",
    getFinancialPlan: "इस व्यवसाय के लिए पूर्ण वित्तीय योजना प्राप्त करें",
  },

  market: {
    title: "बाज़ार जानकारी",
    subtitle: "आपके क्षेत्र के लिए स्थानीय डेटा",
    population: "जनसंख्या",
    households: "परिवार",
    literates: "साक्षर",
    amenities: "स्थानीय सुविधाएं",
    hasBank: "नज़दीकी बैंक",
    hasAtm: "नज़दीकी एटीएम",
    hasMandi: "नज़दीकी मंडी",
    hasPuccaRoad: "पक्की सड़क",
    hasPower: "घरेलू बिजली",
    nearestTown: "निकटतम कस्बा",
    purchasingPower: "क्रय शक्ति",
    perCapitaIncome: "प्रति व्यक्ति आय",
    affordabilityIndex: "वहनीयता सूचकांक",
    priceSignals: "वस्तु कीमतें",
    competitors: "प्रतिस्पर्धी",
    enterpriseCounts: "पंजीकृत उद्यम",
    districtGrowth: "जिला वार्षिक वृद्धि दर",
    improveAnalysis: "मेरे विश्लेषण को बेहतर बनाएं",
    improveAnalysisDesc: "अपनी डेटा विश्वसनीयता बढ़ाने के लिए स्थानीय अवलोकनों के बारे में कुछ प्रश्नों के उत्तर दें।",
    confidenceBefore: "पहले विश्वसनीयता",
    confidenceAfter: "बाद में विश्वसनीयता",
  },

  financial: {
    title: "वित्तीय योजनाकार",
    subtitle: "सुरक्षित ऋण आकार और नकदी प्रवाह योजना",
    marginCapital: "उपलब्ध मार्जिन पूंजी (₹)",
    expectedRevenue: "अपेक्षित मासिक राजस्व (₹)",
    operatingExpenses: "मासिक परिचालन व्यय (₹)",
    calculate: "वित्तीय योजना की गणना करें",
    maxLoan: "अधिकतम संभावित ऋण",
    safeLoan: "अनुशंसित सुरक्षित ऋण",
    cashFlow: "12-माह नकदी प्रवाह अनुमान",
    breakEven: "ब्रेक-ईवन माह",
    emiCoverage: "ईएमआई कवरेज अनुपात",
  },

  schemes: {
    title: "सरकारी योजनाएं",
    subtitle: "उपलब्ध वित्तपोषण योजनाएं देखें",
    likelyEligible: "संभवतः पात्र",
    needsVerification: "सत्यापन आवश्यक",
    interest: "ब्याज",
    tenure: "अवधि",
    moratorium: "स्थगन अवधि",
    maxLoan: "अधिकतम ऋण",
  },

  comingSoon: {
    stress: {
      title: "स्ट्रेस सिम्युलेटर",
      body: "अपनी वित्तीय योजना के विरुद्ध राजस्व गिरावट, लागत वृद्धि और मांग झटकों का अनुकरण करें। अगले संस्करण में उपलब्ध होगा।",
    },
    report: {
      title: "व्यवहार्यता रिपोर्ट",
      body: "इस प्लेटफ़ॉर्म के हर भाग को मिलाकर एक डाउनलोड योग्य, संरचित व्यवहार्यता रिपोर्ट। तब तक आपकी सहेजी गई विश्लेषण रिपोर्ट इतिहास में उपलब्ध हैं।",
    },
    advisor: {
      title: "एआई सलाहकार",
      body: "एक समर्पित संवादात्मक सलाहकार इंटरफ़ेस। एआई-जनित विश्लेषण आज पहले से ही वित्तीय योजनाकार परिणामों में उपलब्ध है।",
    },
  },
};

export default hi;
