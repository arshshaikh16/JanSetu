export type OccupationType =
  | 'farmer'
  | 'street_vendor'
  | 'daily_worker'
  | 'student'
  | 'senior_citizen'
  | 'woman_entrepreneur'
  | 'small_business'
  | 'homemaker';

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'bn' | 'te';

export interface CitizenProfile {
  name: string;
  age: number;
  occupation: OccupationType;
  annualIncomeINR: number;
  state: string;
  hasRationCard: boolean;
  hasBankAccount: boolean;
  isRural: boolean;
}

export interface GovernmentScheme {
  id: string;
  title: string;
  localizedTitle: Record<SupportedLanguage, string>;
  ministry: string;
  annualBenefitINR: number;
  benefitSummary: string;
  plainSummary: Record<SupportedLanguage, string>;
  targetOccupations: OccupationType[];
  maxAnnualIncomeINR: number;
  minAge?: number;
  maxAge?: number;
  requiresRural?: boolean;
  documentsRequired: string[];
  applicationPortalUrl: string;
  statutoryCitation: string;
  stepsToApply: string[];
}

export interface EligibilityMatch {
  scheme: GovernmentScheme;
  isEligible: boolean;
  matchScore: number;
  matchedReasons: string[];
  missingRequirements: string[];
  estimatedAnnualBenefitINR: number;
}

export type IssueCategory =
  | 'open_live_wire'
  | 'water_contamination'
  | 'road_cave_in'
  | 'sewage_overflow'
  | 'garbage_dump'
  | 'street_light_outage'
  | 'hospital_supply_shortage';

export interface GrievanceTriageInput {
  category: IssueCategory;
  description: string;
  precipitationMm: number;
  aqi: number;
  temperatureC: number;
  nearSchoolOrHospital: boolean;
  affectedHouseholdsEstimate: number;
}

export interface GrievanceTriageResult {
  severityScore: number;
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
  slaHours: number;
  assignedDepartment: string;
  statutoryActReference: string;
  environmentalMultiplierReason: string;
  recommendedImmediateAction: string;
}

export interface CivicGrievanceRecord {
  id: string;
  trackingId: string;
  title: string;
  description: string;
  category: IssueCategory;
  city: string;
  ward: string;
  coordinates: { lat: number; lon: number };
  severityScore: number;
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'STANDARD';
  slaHours: number;
  assignedDepartment: string;
  statutoryActReference: string;
  environmentalContext: {
    temperatureC: number;
    precipitationMm: number;
    aqi: number;
    multiplierNote: string;
  };
  aiVisualAuditSummary?: string;
  status: 'LOGGED' | 'IN_PROGRESS' | 'ESCALATED_RTI' | 'RESOLVED';
  createdAt: string;
  ledgerHash: string;
  imagePreview?: string;
}

export interface HeuristicAuditResult {
  suspicionScore: number;
  flags: string[];
  hasOfficialGovDomain: boolean;
  hasUrgencyBait: boolean;
  hasUnverifiedCashPromise: boolean;
  preliminaryVerdict: 'HIGH_RISK_SCAM_OR_RUMOR' | 'NEEDS_OFFICIAL_CROSS_CHECK' | 'CONTAINS_OFFICIAL_REFERENCE';
}

export const REAL_GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'pm-kisan-samman',
    title: 'PM-KISAN Samman Nidhi Yojana',
    localizedTitle: {
      en: 'PM-KISAN Farmer Income Support (₹6,000/yr)',
      hi: 'पीएम-किसान सम्मान निधि (₹6,000 प्रति वर्ष)',
      ta: 'பிஎம்-கிசான் விவசாயிகள் நிதி உதவி (₹6,000/ஆண்டு)',
      bn: 'পিএম-কিষাণ সম্মান নিধি (বার্ষিক ₹৬,০০০)',
      te: 'పీఎం-కిసాన్ సమ్మాన్ నిధి (ఏడాదికి ₹6,000)',
    },
    ministry: 'Ministry of Agriculture & Farmers Welfare, Govt. of India',
    annualBenefitINR: 6000,
    benefitSummary: 'Direct bank transfer of ₹6,000 per year in three equal installments of ₹2,000 every 4 months.',
    plainSummary: {
      en: 'You get ₹2,000 directly in your bank account every 4 months (₹6,000 a year) to buy seeds and fertilizer. No middleman fee.',
      hi: 'बीज और खाद खरीदने के लिए हर 4 महीने में सीधे आपके बैंक खाते में ₹2,000 (साल में ₹6,000) मिलते हैं। किसी बिचौलिए को पैसे न दें।',
      ta: 'விதை மற்றும் உரம் வாங்க 4 மாதங்களுக்கு ஒருமுறை ₹2,000 (ஆண்டுக்கு ₹6,000) நேரடியாக உங்கள் வங்கி கணக்கில் வரும்.',
      bn: 'বীজ ও সার কেনার জন্য প্রতি ৪ মাস অন্তর সরাসরি আপনার ব্যাংক অ্যাকাউন্টে ২,০০০ টাকা (বছরে ৬,০০০ টাকা) পাবেন।',
      te: 'విత్తనాలు, ఎరువుల కోసం ప్రతి 4 నెలలకు ₹2,000 (ఏడాదికి ₹6,000) నేరుగా మీ బ్యాంక్ ఖాతాలో జమ అవుతాయి.',
    },
    targetOccupations: ['farmer'],
    maxAnnualIncomeINR: 250000,
    minAge: 18,
    documentsRequired: ['Aadhaar Card', 'Cultivable Land Record (Khasra / Khatauni)', 'Active Bank Passbook (NPCI Linked)'],
    applicationPortalUrl: 'https://pmkisan.gov.in',
    statutoryCitation: 'Operational Guidelines Rev. IV, Dept. of Agriculture & Farmers Welfare (DBT Notification No. 1-1/2019-FW)',
    stepsToApply: [
      'Complete e-KYC using Aadhaar OTP or fingerprint at nearest Common Service Centre (CSC).',
      'Verify land ownership seeding on your State Land Record portal.',
      'Ensure your bank account has Aadhaar DBT enabled at your branch.',
    ],
  },
  {
    id: 'pm-svanidhi-vendor',
    title: 'PM SVANidhi Street Vendor Micro-Credit & Digital Cashback',
    localizedTitle: {
      en: 'PM SVANidhi Street Vendor Working Capital (₹10,000–₹50,000)',
      hi: 'पीएम स्वनिधि रेहड़ी-पटरी आत्मनिर्भर ऋण (₹10,000–₹50,000)',
      ta: 'பிஎம் ஸ்வநிதி சாலையோர வியாபாரிகள் கடன் திட்டம்',
      bn: 'পিএম স্বনিধি পথ ব্যবসায়ী ক্ষুদ্র ঋণ প্রকল্প',
      te: 'పీఎం స్వనిధి వీధి వ్యాపారుల రుణ పథకం',
    },
    ministry: 'Ministry of Housing and Urban Affairs (MoHUA)',
    annualBenefitINR: 15000,
    benefitSummary: 'Collateral-free working capital loan starting at ₹10,000 (scaling to ₹20k and ₹50k) with 7% interest subsidy and ₹1,200 UPI cashback.',
    plainSummary: {
      en: 'Get a ₹10,000 loan for your cart or stall without any guarantee or property paper. Pay on time to get ₹20,000 next and ₹1,200 bonus for using UPI.',
      hi: 'बिना किसी गारंटी या कागज़ गिरवी रखे अपने ठेले/दुकान के लिए ₹10,000 का लोन पाएं। समय पर चुकाने पर ₹20,000 मिलेंगे और UPI इस्तेमाल पर ₹1,200 कैशबैक।',
      ta: 'எந்த சொத்து ஆவணமும் இல்லாமல் தள்ளுவண்டி கடைக்கு ₹10,000 கடன். சரியான நேரத்தில் செலுத்தினால் ₹20,000 மற்றும் UPI ஊக்கத்தொகை ₹1,200.',
      bn: 'কোনো জামানত ছাড়াই আপনার ভ্যান বা দোকানের জন্য ১০,০০০ টাকা ঋণ পান। সময়মতো শোধ করলে ২০,০০০ টাকা এবং UPI ব্যবহারে ১,২০০ টাকা ক্যাশব্যাক।',
      te: 'ఎలాంటి పూచీకత్తు లేకుండా తోపుడు బండి లేదా దుకాణానికి ₹10,000 రుణం. సకాలంలో చెల్లిస్తే ₹20,000 మరియు UPI వాడకంపై ₹1,200 క్యాష్‌బ్యాక్.',
    },
    targetOccupations: ['street_vendor', 'small_business'],
    maxAnnualIncomeINR: 300000,
    minAge: 18,
    documentsRequired: ['Aadhaar Linked Mobile Number', 'Municipal Certificate of Vending OR Letter of Recommendation (LoR)', 'Bank Account Details'],
    applicationPortalUrl: 'https://pmsvanidhi.mohua.gov.in',
    statutoryCitation: 'Street Vendors (Protection of Livelihood and Regulation of Street Vending) Act, 2014 & MoHUA Circular 2020',
    stepsToApply: [
      'Check if you have a Municipal Vending ID card; if not, apply for a Provisional Letter of Recommendation (LoR).',
      'Submit the 1-page mobile OTP application on PM SVANidhi portal or via Seva Agent.',
      'Receive ₹10,000 working capital directly into your bank account within 14 working days.',
    ],
  },
  {
    id: 'ayushman-bharat-pmjay',
    title: 'Ayushman Bharat PM-JAY Free Hospitalization Cover',
    localizedTitle: {
      en: 'Ayushman Bharat Health Cover (₹5,00,000 Free Treatment)',
      hi: 'आयुष्मान भारत मुफ्त इलाज योजना (₹5 लाख तक)',
      ta: 'ஆயுஷ்மான் பாரத் மருத்துவ காப்பீடு (₹5 லட்சம் இலவச சிகிச்சை)',
      bn: 'আয়ুষ্মান ভারত বিনামূল্যে চিকিৎসা বীমা (৫ লক্ষ টাকা)',
      te: 'ఆయుష్మాన్ భారత్ ఉచిత వైద్య పథకం (₹5 లక్షల వరకు)',
    },
    ministry: 'National Health Authority (NHA), Ministry of Health & Family Welfare',
    annualBenefitINR: 50000,
    benefitSummary: 'Cashless secondary and tertiary hospitalization coverage up to ₹5,00,000 per family per year across empaneled government and private hospitals, including all citizens aged 70+.',
    plainSummary: {
      en: 'Free hospital surgeries, medicines, and tests up to ₹5 Lakh per year for your family (and automatically for all seniors aged 70+). Hospital cannot ask for cash.',
      hi: 'आपके पूरे परिवार के लिए (और 70 वर्ष से अधिक उम्र के सभी बुजुर्गों के लिए) सरकारी व प्राइवेट अस्पताल में सालाना ₹5 लाख तक का ऑपरेशन, दवा और जांच बिल्कुल मुफ्त।',
      ta: 'உங்கள் குடும்பத்திற்கும் 70 வயதுக்கு மேற்பட்ட முதியவர்களுக்கும் அரசு மற்றும் தனியார் மருத்துவமனைகளில் ₹5 லட்சம் வரை இலவச அறுவை சிகிச்சை மற்றும் மருந்துகள்.',
      bn: 'আপনার পরিবার এবং ৭০ বছরের বেশি বয়সী সকল প্রবীণদের জন্য সরকারি ও বেসরকারি হাসপাতালে বছরে ৫ লক্ষ টাকা পর্যন্ত সম্পূর্ণ বিনামূল্যে চিকিৎসা ও ওষুধ।',
      te: 'మీ కుటుంబానికి మరియు 70 ఏళ్లు పైబడిన వృద్ధులందరికీ ప్రభుత్వ, ప్రైవేట్ ఆసుపత్రులలో ఏడాదికి ₹5 లక్షల వరకు ఉచిత ఆపరేషన్లు మరియు మందులు.',
    },
    targetOccupations: ['farmer', 'street_vendor', 'daily_worker', 'senior_citizen', 'homemaker', 'woman_entrepreneur', 'student', 'small_business'],
    maxAnnualIncomeINR: 300000,
    minAge: 0,
    documentsRequired: ['Aadhaar Card', 'Ration Card / NFSA Family ID (or Age Proof 70+ for Senior Vay Vandana Card)'],
    applicationPortalUrl: 'https://beneficiary.nha.gov.in',
    statutoryCitation: 'National Health Authority (NHA) PM-JAY Guidelines & Senior Citizen Expansion Notification (Sept 2024)',
    stepsToApply: [
      'Search family eligibility by mobile number and Aadhaar or Ration Card ID.',
      'Complete instant face-auth or OTP e-KYC to download your Ayushman Golden Card.',
      'Show card at the Ayushman Mitra desk at any empaneled hospital for 100% cashless admission.',
    ],
  },
  {
    id: 'eshram-daily-worker-shield',
    title: 'e-Shram & PM Suraksha Social Security Shield for Unorganised Workers',
    localizedTitle: {
      en: 'e-Shram Worker Card & ₹2 Lakh Accident + Pension Shield',
      hi: 'ई-श्रम मजदूर कार्ड एवं ₹2 लाख दुर्घटना सुरक्षा कवच',
      ta: 'இ-ஷ்ரம் தொழிலாளர் அட்டை மற்றும் ₹2 லட்சம் பாதுகாப்பு',
      bn: 'ই-শ্রম কার্ড ও ২ লক্ষ টাকার শ্রমিক সুরক্ষা বীমা',
      te: 'ఇ-శ్రమ్ కార్మిక కార్డు & ₹2 లక్షల ప్రమాద బీమా రక్షణ',
    },
    ministry: 'Ministry of Labour and Employment',
    annualBenefitINR: 12000,
    benefitSummary: 'Universal Account Number (UAN) giving access to ₹2,00,000 accidental death/disability cover (PMSBY), portable ration (One Nation One Ration), and ₹3,000/month pension after age 60.',
    plainSummary: {
      en: 'Every daily wage worker, driver, construction helper, or domestic worker gets an official Worker ID, ₹2 Lakh accident protection, and ration anywhere in the country.',
      hi: 'हर दिहाड़ी मजदूर, ड्राइवर, राजमिस्त्री या घरेलू कामगार को सरकारी पहचान पत्र, ₹2 लाख का दुर्घटना बीमा और देश में कहीं भी राशन लेने का अधिकार मिलता है।',
      ta: 'கட்டுமானத் தொழிலாளர்கள், ஓட்டுநர்கள் மற்றும் வீட்டுப் பணியாளர்களுக்கு அரசு அடையாள அட்டை, ₹2 லட்சம் விபத்து காப்பீடு மற்றும் எங்கும் ரேஷன் பெறும் உரிமை.',
      bn: 'নির্মাণ শ্রমিক, চালক ও গৃহকর্মীদের জন্য সরকারি পরিচয়পত্র, ২ লক্ষ টাকার দুর্ঘটনা বীমা এবং দেশের যেকোনো স্থানে রেশন পাওয়ার অধিকার।',
      te: 'రోజువారీ కూలీలు, డ్రైవర్లు, భవన నిర్మాణ కార్మికులకు ప్రభుత్వ గుర్తింపు కార్డు, ₹2 లక్షల ప్రమాద బీమా మరియు దేశంలో ఎక్కడైనా రేషన్ తీసుకునే హక్కు.',
    },
    targetOccupations: ['daily_worker', 'street_vendor', 'farmer', 'homemaker'],
    maxAnnualIncomeINR: 240000,
    minAge: 16,
    maxAge: 59,
    documentsRequired: ['Aadhaar Card', 'Aadhaar-linked Mobile Number', 'Bank Account IFSC & Account Number'],
    applicationPortalUrl: 'https://eshram.gov.in',
    statutoryCitation: 'Unorganised Workers Social Security Act, 2008 (Act No. 33 of 2008)',
    stepsToApply: [
      'Enter Aadhaar number and verify OTP on e-Shram portal.',
      'Select your occupation code (NCO) such as construction, domestic work, agricultural labor, or delivery.',
      'Download your instant 12-digit Universal Account Number (UAN) e-Shram card.',
    ],
  },
  {
    id: 'lakhpati-didi-mudra-shg',
    title: 'Lakhpati Didi & PM Vishwakarma / Mudra Enterprise Grant-Cum-Credit',
    localizedTitle: {
      en: 'Women & Artisan Micro-Enterprise Toolkit (₹15,000 Grant + ₹1L Credit)',
      hi: 'लखपति दीदी एवं विश्वकर्मा उद्यमी योजना (₹15,000 टूलकिट अनुदान + ₹1 लाख ऋण)',
      ta: 'மகளிர் மற்றும் கைவினைஞர் தொழில் உதவி (₹15,000 மானியம் + ₹1 லட்சம் கடன்)',
      bn: 'লখপতি দিদি ও বিশ্বকর্মা ক্ষুদ্র উদ্যোগ প্রকল্প (১৫,০০০ টাকা অনুদান)',
      te: 'లఖ్‌పతి దీదీ & విశ్వకర్మ మహిళా/చేతివృత్తుల పథకం (₹15,000 గ్రాంట్)',
    },
    ministry: 'Ministry of Rural Development & Ministry of MSME',
    annualBenefitINR: 25000,
    benefitSummary: '₹15,000 direct e-voucher for modern equipment/sewing/craft toolkit, ₹500/day stipend during 5-day skill training, and 5% concessional ₹1,00,000 enterprise credit.',
    plainSummary: {
      en: 'Get ₹15,000 free voucher to buy a sewing machine, food processing kit, or craft tools, plus ₹500/day training allowance and low-interest business loan.',
      hi: 'सिलाई मशीन, मसाला/खाद्य प्रोसेसिंग या कारीगरी के औजार खरीदने के लिए ₹15,000 का मुफ्त वाउचर, ट्रेनिंग के दौरान ₹500/दिन भत्ता और सस्ता व्यापार ऋण।',
      ta: 'தையல் இயந்திரம் அல்லது தொழில் கருவிகள் வாங்க ₹15,000 இலவச வவுச்சர், பயிற்சி காலத்தில் நாளொன்றுக்கு ₹500 உதவித்தொகை மற்றும் குறைந்த வட்டி கடன்.',
      bn: 'সেলাই মেশিন বা কাজের সরঞ্জাম কেনার জন্য ১৫,০০০ টাকার বিনামূল্যে ভাউচার, প্রশিক্ষণের সময় দৈনিক ৫০০ টাকা ভাতা এবং স্বল্প সুদে ঋণ।',
      te: 'కుట్టు మిషన్ లేదా వృత్తి పరికరాల కొనుగోలుకు ₹15,000 ఉచిత వోచర్, శిక్షణ సమయంలో రోజుకు ₹500 భత్యం మరియు తక్కువ వడ్డీ వ్యాపార రుణం.',
    },
    targetOccupations: ['woman_entrepreneur', 'homemaker', 'small_business', 'daily_worker'],
    maxAnnualIncomeINR: 350000,
    minAge: 18,
    documentsRequired: ['Aadhaar Card', 'Bank Passbook', 'Self-Help Group (SHG) or Artisan Verification'],
    applicationPortalUrl: 'https://pmvishwakarma.gov.in',
    statutoryCitation: 'DAY-NRLM Lakhpati Didi Operational Framework 2024 & PM Vishwakarma Gazette Notification',
    stepsToApply: [
      'Register trade or Self-Help Group membership via Gram Panchayat / Urban Local Body portal.',
      'Attend the 5-day local skill assessment to receive ₹2,500 stipend and ₹15,000 toolkit e-voucher.',
      'Activate collateral-free ₹1,00,000 enterprise credit line at 5% capped interest.',
    ],
  },
  {
    id: 'nsp-post-matric-scholarship',
    title: 'National Scholarship Portal (NSP) Post-Matric & Pragati STEM Grant',
    localizedTitle: {
      en: 'National Post-Matric & Technical Education Scholarship (Up to ₹50,000/yr)',
      hi: 'राष्ट्रीय पोस्ट-मैट्रिक एवं प्रगति छात्रवृत्ति (₹50,000 प्रति वर्ष तक)',
      ta: 'தேசிய கல்வி உதவித்தொகை திட்டம் (ஆண்டுக்கு ₹50,000 வரை)',
      bn: 'জাতীয় পোস্ট-ম্যাট্রিক ও প্রগতি শিক্ষাবৃত্তি (বার্ষিক ৫০,০০০ টাকা পর্যন্ত)',
      te: 'జాతీయ పోస్ట్-మెట్రిక్ & ప్రగతి స్కాలర్‌షిప్ (ఏడాదికి ₹50,000 వరకు)',
    },
    ministry: 'Ministry of Education & AICTE',
    annualBenefitINR: 36000,
    benefitSummary: 'Tuition fee reimbursement plus annual maintenance allowance up to ₹50,000 for students in Class 11, 12, ITI, Diploma, and undergraduate degrees.',
    plainSummary: {
      en: 'Direct money in student bank account up to ₹50,000 per year to pay college/school fees, books, and hostel expenses.',
      hi: 'स्कूल/कॉलेज की फीस, किताबों और हॉस्टल खर्च के लिए छात्रों के बैंक खाते में सालाना ₹50,000 तक की सीधी छात्रवृत्ति।',
      ta: 'கல்லூரி கட்டணம், புத்தகங்கள் மற்றும் விடுதி செலவுகளுக்காக மாணவர்களின் வங்கி கணக்கில் ஆண்டுக்கு ₹50,000 வரை நேரடி உதவித்தொகை.',
      bn: 'কলেজের ফি, বই ও হোস্টেল খরচের জন্য শিক্ষার্থীদের ব্যাংক অ্যাকাউন্টে বছরে ৫০,০০০ টাকা পর্যন্ত সরাসরি বৃত্তি।',
      te: 'కళాశాల ఫీజులు, పుస్తకాలు, హాస్టల్ ఖర్చుల కోసం విద్యార్థుల బ్యాంక్ ఖాతాలో ఏడాదికి ₹50,000 వరకు నేరుగా స్కాలర్‌షిప్.',
    },
    targetOccupations: ['student'],
    maxAnnualIncomeINR: 350000,
    minAge: 14,
    maxAge: 30,
    documentsRequired: ['Student Aadhaar & OTR ID', 'Previous Exam Marksheet', 'Family Income Certificate', 'Bonafide Student Certificate'],
    applicationPortalUrl: 'https://scholarships.gov.in',
    statutoryCitation: 'National Scholarship Portal (NSP 2.0) One-Time Registration (OTR) Guidelines',
    stepsToApply: [
      'Generate your lifetime One-Time Registration (OTR) ID on the NSP portal.',
      'Fill in your school/college AISHE code and upload income + marksheet certificates.',
      'Institute nodal officer verifies online; scholarship credits via Aadhaar Payment Bridge.',
    ],
  },
];

export function evaluateSchemeEligibility(
  profile: CitizenProfile,
  schemes: GovernmentScheme[] = REAL_GOVERNMENT_SCHEMES
): EligibilityMatch[] {
  return schemes
    .map((scheme) => {
      const matchedReasons: string[] = [];
      const missingRequirements: string[] = [];
      let score = 0;

      // 1. Occupation check (45 points)
      const isSeniorAyushman = scheme.id === 'ayushman-bharat-pmjay' && profile.age >= 70;
      if (scheme.targetOccupations.includes(profile.occupation) || isSeniorAyushman) {
        score += 45;
        matchedReasons.push(
          isSeniorAyushman
            ? `Universal Senior Citizen (70+) eligibility applies automatically (Age: ${profile.age})`
            : `Matches occupation profile (${profile.occupation.replace('_', ' ')})`
        );
      } else {
        missingRequirements.push(
          `Targeted at: ${scheme.targetOccupations.map((o) => o.replace('_', ' ')).join(', ')}`
        );
      }

      // 2. Income threshold check (30 points)
      if (isSeniorAyushman || profile.annualIncomeINR <= scheme.maxAnnualIncomeINR) {
        score += 30;
        matchedReasons.push(
          isSeniorAyushman
            ? 'No income cap for citizens aged 70 and above'
            : `Annual income ₹${profile.annualIncomeINR.toLocaleString('en-IN')} is within ₹${scheme.maxAnnualIncomeINR.toLocaleString('en-IN')} limit`
        );
      } else {
        missingRequirements.push(
          `Annual income exceeds limit of ₹${scheme.maxAnnualIncomeINR.toLocaleString('en-IN')}`
        );
      }

      // 3. Age check (15 points)
      const minAgeOk = scheme.minAge === undefined || profile.age >= scheme.minAge;
      const maxAgeOk = scheme.maxAge === undefined || profile.age <= scheme.maxAge;
      if (minAgeOk && maxAgeOk) {
        score += 15;
        matchedReasons.push(`Age (${profile.age} yrs) meets statutory range`);
      } else {
        const rangeText = `${scheme.minAge ?? 0}–${scheme.maxAge ?? '100+'} years`;
        missingRequirements.push(`Age must be between ${rangeText}`);
      }

      // 4. Banking / DBT readiness (10 points)
      if (profile.hasBankAccount) {
        score += 10;
        matchedReasons.push('Direct Benefit Transfer (DBT) bank account ready');
      } else {
        missingRequirements.push('Requires zero-balance Jan Dhan / post office bank account for DBT transfer');
      }

      const isEligible = missingRequirements.length === 0 || (score >= 85 && !profile.hasBankAccount);

      return {
        scheme,
        isEligible,
        matchScore: score,
        matchedReasons,
        missingRequirements,
        estimatedAnnualBenefitINR: isEligible ? scheme.annualBenefitINR : 0,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.scheme.annualBenefitINR - a.scheme.annualBenefitINR);
}

const BASE_CATEGORY_WEIGHTS: Record<
  IssueCategory,
  {
    baseScore: number;
    department: string;
    act: string;
    immediateAction: string;
  }
> = {
  open_live_wire: {
    baseScore: 84,
    department: 'State Electricity Distribution Company (DISCOM) Emergency Fault Cell',
    act: 'Section 68, Electricity Act, 2003 & State Public Service Guarantee Act (Emergency Safety)',
    immediateAction: 'Cordon off 5-meter perimeter immediately; do not touch wet surfaces or metal poles nearby.',
  },
  water_contamination: {
    baseScore: 76,
    department: 'Municipal Water Supply & Sewage Board (Jal Board Quality Wing)',
    act: 'BIS IS 10500:2012 Drinking Water Mandate & Right to Public Services Act',
    immediateAction: 'Boil water for 10 minutes before consumption; preserve a 500ml sample in a clean glass bottle for ward inspection.',
  },
  sewage_overflow: {
    baseScore: 68,
    department: 'Municipal Corporation Sanitation & Storm Water Drainage Division',
    act: 'Solid & Liquid Waste Management Rules, 2016 & Municipal Accountability Charter',
    immediateAction: 'Avoid wading through stagnant overflow; request immediate jetting machine deployment.',
  },
  road_cave_in: {
    baseScore: 65,
    department: 'Public Works Department (PWD) / Municipal Roads & Bridges Division',
    act: 'Indian Roads Congress (IRC:SP:84) Maintenance Standard & Citizen Charter SLA',
    immediateAction: 'Place visible reflector or marker branches 10 meters ahead of the pothole/subsidence.',
  },
  hospital_supply_shortage: {
    baseScore: 80,
    department: 'Chief Medical Officer (CMO) & State Medical Services Corporation',
    act: 'National Essential List of Medicines (NLEM) Charter & Clinical Establishments Act',
    immediateAction: 'Log batch request at the Hospital Rogi Kalyan Samiti helpdesk and retain outpatient slip.',
  },
  garbage_dump: {
    baseScore: 52,
    department: 'Municipal Solid Waste Management (Swachhata Ward Supervisor)',
    act: 'Solid Waste Management Rules, 2016 (MoEFCC)',
    immediateAction: 'Prevent open burning of waste to avoid toxic particulate release.',
  },
  street_light_outage: {
    baseScore: 48,
    department: 'Municipal Street Lighting & EESL Maintenance Cell',
    act: 'Municipal Citizen Service Charter (Public Safety Lighting Clause)',
    immediateAction: 'Note the stenciled pole number on the streetlamp column for rapid technician dispatch.',
  },
};

export function computeCivicSeverityAndSLA(input: GrievanceTriageInput): GrievanceTriageResult {
  const meta = BASE_CATEGORY_WEIGHTS[input.category];
  let score = meta.baseScore;
  const multiplierNotes: string[] = [];

  // Live rainfall / flood hazard correlation
  if (input.precipitationMm > 2.0) {
    if (
      input.category === 'open_live_wire' ||
      input.category === 'sewage_overflow' ||
      input.category === 'road_cave_in' ||
      input.category === 'water_contamination'
    ) {
      const rainBoost = Math.min(14, Math.round(input.precipitationMm * 2.2));
      score += rainBoost;
      multiplierNotes.push(
        `Active precipitation (${input.precipitationMm.toFixed(1)} mm) elevates electrocution/waterlogging hazard (+${rainBoost} pts)`
      );
    }
  }

  // Live air quality correlation
  if (input.aqi >= 150 && (input.category === 'garbage_dump' || input.category === 'road_cave_in')) {
    const aqiBoost = input.aqi >= 250 ? 12 : 7;
    score += aqiBoost;
    multiplierNotes.push(
      `Elevated local AQI (${input.aqi}) compounds respiratory dust/smoke hazard (+${aqiBoost} pts)`
    );
  }

  // Heatwave correlation
  if (input.temperatureC >= 38 && (input.category === 'water_contamination' || input.category === 'hospital_supply_shortage')) {
    score += 8;
    multiplierNotes.push(`High ambient temperature (${input.temperatureC.toFixed(1)}°C) increases dehydration/health risk (+8 pts)`);
  }

  // Vulnerable zone proximity
  if (input.nearSchoolOrHospital) {
    score += 9;
    multiplierNotes.push('Located within 200m of a school, Anganwadi, or public hospital (+9 pts)');
  }

  // Affected population scale
  if (input.affectedHouseholdsEstimate >= 50) {
    const popBoost = Math.min(8, Math.floor(input.affectedHouseholdsEstimate / 50) * 3);
    score += popBoost;
    multiplierNotes.push(`Impacts ~${input.affectedHouseholdsEstimate} citizens/households (+${popBoost} pts)`);
  }

  const finalScore = Math.max(10, Math.min(99, score));

  let priorityLevel: GrievanceTriageResult['priorityLevel'] = 'STANDARD';
  let slaHours = 72;

  if (finalScore >= 85) {
    priorityLevel = 'CRITICAL';
    slaHours = 4;
  } else if (finalScore >= 70) {
    priorityLevel = 'HIGH';
    slaHours = 12;
  } else if (finalScore >= 55) {
    priorityLevel = 'MEDIUM';
    slaHours = 24;
  }

  return {
    severityScore: finalScore,
    priorityLevel,
    slaHours,
    assignedDepartment: meta.department,
    statutoryActReference: meta.act,
    environmentalMultiplierReason:
      multiplierNotes.length > 0
        ? multiplierNotes.join(' · ')
        : 'Baseline statutory severity applied under normal weather conditions.',
    recommendedImmediateAction: meta.immediateAction,
  };
}

export function generateRTIDraft(grievance: CivicGrievanceRecord, applicantName: string): string {
  const safeName = applicantName.trim() || 'Concerned Citizen';
  const dateStr = new Date(grievance.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `FORM OF APPLICATION FOR SEEKING INFORMATION
Under Section 6(1) of the Right to Information Act, 2005

To,
The Public Information Officer (PIO),
${grievance.assignedDepartment},
${grievance.city} Municipal Jurisdiction (${grievance.ward})

1. Name of the Applicant: ${safeName}
2. Civic Grievance Reference ID: ${grievance.trackingId} (Ledger Hash: ${grievance.ledgerHash})
3. Subject: Statutory Action Status on ${grievance.priorityLevel} Civic Hazard: "${grievance.title}" logged on ${dateStr}.

4. Particulars of Information Solicited:
   (a) Please provide the certified daily progress report (action taken day-by-day) on Grievance ID ${grievance.trackingId} regarding "${grievance.description}" at ${grievance.ward}, ${grievance.city} (Coordinates: ${grievance.coordinates.lat.toFixed(4)}, ${grievance.coordinates.lon.toFixed(4)}).
   (b) Please provide the names, designations, and official contact details of the Junior Engineer / Ward Officer entrusted with rectifying this issue within the stipulated ${grievance.slaHours}-hour SLA under ${grievance.statutoryActReference}.
   (c) Please provide certified copies of the work order, contractor allocation, and inspection measurement book (MB) entries for the last 12 months at this exact location.
   (d) If the hazard involves threat to life and liberty (Severity Score: ${grievance.severityScore}/100), please treat this request under the Proviso to Section 7(1) of the RTI Act, 2005 (Information to be provided within 48 hours).

Place: ${grievance.city}
Date: ${new Date().toLocaleDateString('en-IN')}`;
}

export function evaluateClaimCredibilityHeuristics(claimText: string): HeuristicAuditResult {
  const normalized = claimText.toLowerCase();
  const flags: string[] = [];
  let suspicionScore = 15;

  const hasUrgencyBait =
    /forward to \d+|share immediately|last chance tonight|whatsapp forward|deleted soon|10 groups/i.test(claimText);
  if (hasUrgencyBait) {
    suspicionScore += 35;
    flags.push('Contains viral chain-forwarding urgency bait ("forward to groups / last chance tonight")');
  }

  const hasUnverifiedCashPromise =
    /(free ₹?\s*\d{4,}|click link to get ₹|instant cash transfer to all|pmoles|free laptop for all)/i.test(claimText);
  if (hasUnverifiedCashPromise) {
    suspicionScore += 30;
    flags.push('Promises universal instant cash/gift disbursement via unverified external link');
  }

  const hasSuspiciousLink = /(bit\.ly|tinyurl|t\.me|\.xyz|\.top|-gov\.in|gov-scheme\.)/i.test(claimText);
  if (hasSuspiciousLink) {
    suspicionScore += 35;
    flags.push('Contains lookalike or shortened URL instead of an official .gov.in / .nic.in domain');
  }

  const hasOfficialGovDomain =
    /\b([a-z0-9-]+\.)*(gov\.in|nic\.in|rbi\.org\.in|pib\.gov\.in|nta\.ac\.in|nta\.nic\.in|ugc\.ac\.in|ac\.in|edu\.in)\b/i.test(normalized) ||
    /national testing agency|press information bureau|gazette of india|union public service commission/i.test(normalized);
  if (hasOfficialGovDomain && !hasSuspiciousLink) {
    suspicionScore = Math.max(5, suspicionScore - 15);
  }

  const isOfficialExaminationNotice =
    /national testing agency|nta\.ac\.in|nta\.nic\.in|\bnta\b|jeemain|neet\.nta|ugc\.ac\.in/i.test(normalized) &&
    !hasUrgencyBait &&
    !hasUnverifiedCashPromise &&
    !hasSuspiciousLink;

  const cappedScore = isOfficialExaminationNotice ? 5 : Math.min(98, suspicionScore);
  let preliminaryVerdict: HeuristicAuditResult['preliminaryVerdict'] = 'NEEDS_OFFICIAL_CROSS_CHECK';
  if (cappedScore >= 60) {
    preliminaryVerdict = 'HIGH_RISK_SCAM_OR_RUMOR';
  } else if ((hasOfficialGovDomain || isOfficialExaminationNotice) && cappedScore <= 25) {
    preliminaryVerdict = 'CONTAINS_OFFICIAL_REFERENCE';
  }

  return {
    suspicionScore: cappedScore,
    flags,
    hasOfficialGovDomain,
    hasUrgencyBait,
    hasUnverifiedCashPromise,
    preliminaryVerdict,
  };
}

export function generateReceiptHash(payload: string): string {
  let h1 = 0xdeadbeef ^ payload.length;
  let h2 = 0x41c6ce57 ^ payload.length;
  for (let i = 0, ch; i < payload.length; i++) {
    ch = payload.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `0x${hex1}${hex2}`;
}
