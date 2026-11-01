import { createSampleDocumentImageBase64, processUploadedImageFile, speakCivicText, stopCivicSpeech } from '../utils/speechHelper';

import { t } from '../utils/translations';
import React, { useState, useEffect } from 'react';
import {
  CitizenProfile,
  evaluateSchemeEligibility,
  GovernmentScheme,
  OccupationType,
  REAL_GOVERNMENT_SCHEMES,
  SupportedLanguage,
} from '../utils/civicLogic';

import {
  AcousticHornIcon,
  AcousticMuteIcon,
  ArchivalSealIcon,
  DocumentScanIcon,
  EditorialQuillIcon,
  ExternalPortalIcon,
  RightChevronStampIcon,
} from './CivicIcons';

interface RightsAndSchemesViewProps {
  profile: CitizenProfile;
  onUpdateProfile: (profile: CitizenProfile) => void;
  language: SupportedLanguage;
  onAskSahayak: (schemeTitle: string) => void;
}

const PERSONA_PRESETS: {
  id: OccupationType;
  title: Record<SupportedLanguage, string>;
  subtitle: string;
  defaultAge: number;
  defaultIncome: number;
  svgPath: string;
}[] = [
  {
    id: 'farmer',
    title: {
      en: 'Small Farmer',
      hi: 'छोटा किसान',
      ta: 'சிறு விவசாயி',
      bn: 'ক্ষুদ্র কৃষক',
      te: 'చిన్నకారు రైతు',
    },
    subtitle: 'Seeds, fertilizer & crop support',
    defaultAge: 42,
    defaultIncome: 85000,
    svgPath: 'M12 2v20M5 9l7-5 7 5M5 15l7-5 7 5',
  },
  {
    id: 'street_vendor',
    title: {
      en: 'Street Vendor / Cart',
      hi: 'रेहड़ी-पटरी विक्रेता',
      ta: 'சாலையோர வியாபாரி',
      bn: 'পথ ব্যবসায়ী',
      te: 'వీధి వ్యాపారి',
    },
    subtitle: 'Stall working capital & eviction shield',
    defaultAge: 34,
    defaultIncome: 110000,
    svgPath: 'M3 9l9-6 9 6v11H3V9zM9 20v-6h6v6',
  },
  {
    id: 'daily_worker',
    title: {
      en: 'Daily Wage Worker',
      hi: 'दिहाड़ी मज़दूर / कामगार',
      ta: 'தினக்கூலி தொழிலாளி',
      bn: 'দিনমজুর / শ্রমিক',
      te: 'రోజువారీ కూలీ',
    },
    subtitle: 'Accident cover, portable ration & pension',
    defaultAge: 29,
    defaultIncome: 90000,
    svgPath: 'M6 4h12l3 5H3l3-5zM4 9v11h16V9M9 14h6',
  },
  {
    id: 'woman_entrepreneur',
    title: {
      en: 'Woman Artisan / SHG',
      hi: 'महिला उद्यमी / दीदी',
      ta: 'மகளிர் சுயஉதவி தொழில்',
      bn: 'মহিলা উদ্যোক্তা',
      te: 'మహిళా పారిశ్రామికవేత్త',
    },
    subtitle: '₹15k toolkit grant & Lakhpati Didi loan',
    defaultAge: 31,
    defaultIncome: 120000,
    svgPath: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  },
  {
    id: 'student',
    title: {
      en: 'School / College Student',
      hi: 'स्कूल / कॉलेज छात्र',
      ta: 'பள்ளி / கல்லூரி மாணவர்',
      bn: 'স্কুল / কলেজ শিক্ষার্থী',
      te: 'పాఠశాల / కళాశాల విద్యార్థి',
    },
    subtitle: 'National scholarship & hostel grant',
    defaultAge: 19,
    defaultIncome: 140000,
    svgPath: 'M2 9l10-5 10 5-10 5-10-5zM6 11.5v5.5L12 20l6-3v-5.5',
  },
  {
    id: 'senior_citizen',
    title: {
      en: 'Senior Citizen (70+)',
      hi: 'वरिष्ठ नागरिक (70+ आयु)',
      ta: 'மூத்த குடிமக்கள் (70+)',
      bn: 'প্রবীণ নাগরিক (৭০+)',
      te: 'సీనియర్ సిటిజన్ (70+)',
    },
    subtitle: 'Universal ₹5 Lakh free hospital treatment',
    defaultAge: 73,
    defaultIncome: 180000,
    svgPath: 'M12 2L4 5.5v6c0 5.5 3.4 9.8 8 11 4.6-1.2 8-5.5 8-11v-6L12 2zM12 8v8M8 12h8',
  },
];

const SAMPLE_OFFICIAL_NOTICES = [
  {
    id: 'notice-kisan',
    label: 'PM-KISAN Land Seeding & e-KYC Circular',
    refCode: 'AGRI/PMK/2026/114',
    text: 'DEPARTMENT OF AGRICULTURE & FARMERS WELFARE CIRCULAR No. 1-1/2026-FW: All registered beneficiaries under PM-KISAN Samman Nidhi are hereby informed that disbursement of the upcoming ₹2,000 installment requires mandatory completion of (1) Biometric/OTP Aadhaar e-KYC, (2) Land Record Seeding on the State Bhulekh portal, and (3) NPCI Direct Benefit Transfer (DBT) activation in the beneficiary bank account before the 15th of next month. No service fee is payable to middlemen.',
  },
  {
    id: 'notice-vendor',
    label: 'Municipal Street Vendor Protection & Credit Notice',
    refCode: 'MOHUA/TVCA/2026/089',
    text: 'MUNICIPAL TOWN VENDING COMMITTEE STATUTORY NOTICE: Pursuant to Section 3(3) of the Street Vendors (Protection of Livelihood and Regulation of Street Vending) Act, 2014, no street vendor shall be evicted or relocated until the completion of the ward-level survey and issuance of Certificates of Vending. Eligible vendors may apply for ₹10,000 to ₹50,000 collateral-free working capital under PM SVANidhi with 7% interest subsidy and ₹1,200 annual digital transaction cashback.',
  },
  {
    id: 'notice-rti',
    label: 'RTI Section 7(1) Delayed Ration / Pension Order',
    refCode: 'CIC/RTI/2026/402',
    text: 'PUBLIC INFORMATION OFFICER STATUTORY ORDER (Right to Information Act, 2005): Under Section 7(1), information sought by a citizen must be supplied within 30 days of receipt, or within 48 hours where the information sought concerns the life or liberty of a person (including stoppage of essential food rations or emergency medical entitlements). Under Section 7(6), where a public authority fails to comply with the time limits, the information shall be provided free of charge.',
  },
];

interface ExplainedDocumentResult {
  documentTitle: string;
  twoSentencePlainSummary: string;
  whatYouGetOrOwe: string;
  whoIsEligibleOrAffected: string[];
  threeActionSteps: string[];
  deadlineOrWarning: string;
  statutoryAuthority: string;
  modelUsed: string;
}

const PERSONA_SUBTITLES: Record<OccupationType, Record<SupportedLanguage, string>> = {
  farmer: {
    en: 'Seeds, fertilizer & crop support',
    hi: 'बीज, खाद एवं फसल सहायता',
    ta: 'விதை, உரம் மற்றும் பயிர் உதவி',
    bn: 'বীজ, সার ও ফসল সহায়তা',
    te: 'విత్తనాలు, ఎరువులు & పంట సాయం',
  },
  street_vendor: {
    en: 'Stall working capital & eviction shield',
    hi: 'दुकान/ठेले के लिए ऋण एवं सुरक्षा',
    ta: 'கடை கடன் மற்றும் பாதுகாப்பு',
    bn: 'দোকান ঋণ ও উচ্ছেদ সুরক্ষা',
    te: 'దుకాణ రుణం & రక్షణ',
  },
  daily_worker: {
    en: 'Accident cover, portable ration & pension',
    hi: 'दुर्घटना बीमा, राशन एवं पेंशन',
    ta: 'விபத்து காப்பீடு, ரேஷன் & பென்ஷன்',
    bn: 'দুর্ঘটনা বীমা, রেশন ও পেনশন',
    te: 'ప్రమాద బీమా, రేషన్ & పెన్షన్',
  },
  woman_entrepreneur: {
    en: '₹15k toolkit grant & Lakhpati Didi loan',
    hi: '₹15k टूलकिट अनुदान एवं लखपति दीदी ऋण',
    ta: '₹15k கருவி மானியம் & கடன்',
    bn: '১৫ হাজার টাকা সরঞ্জাম অনুদান ও ঋণ',
    te: '₹15 వేల పరికరాల గ్రాంట్ & రుణం',
  },
  student: {
    en: 'National scholarship & hostel grant',
    hi: 'राष्ट्रीय छात्रवृत्ति एवं छात्रावास अनुदान',
    ta: 'தேசிய கல்வி உதவித்தொகை & விடுதி உதவி',
    bn: 'জাতীয় শিক্ষাবৃত্তি ও হোস্টেল অনুদান',
    te: 'జాతీయ స్కాలర్‌షిప్ & హాస్టల్ గ్రాంట్',
  },
  senior_citizen: {
    en: 'Universal ₹5 Lakh free hospital treatment',
    hi: '₹5 लाख तक मुफ्त अस्पताल इलाज',
    ta: '₹5 லட்சம் இலவச மருத்துவ சிகிச்சை',
    bn: '৫ লক্ষ টাকা পর্যন্ত বিনামূল্যে চিকিৎসা',
    te: '₹5 లక్షల ఉచిత వైద్యం',
  },
  small_business: {
    en: 'Micro-credit, MSME setup & collateral-free working loan',
    hi: 'सूक्ष्म ऋण, एमएसएमई स्थापना एवं बिना गारंटी कार्यशील ऋण',
    ta: 'சிறு கடன் மற்றும் தொழிற்கடன்',
    bn: 'ক্ষুদ্র ঋণ ও ব্যবসায়িক সহায়তা',
    te: 'చిన్న వ్యాపార రుణం & సాయం',
  },
  homemaker: {
    en: 'Family health cover, social security & self-help support',
    hi: 'पारिवारिक स्वास्थ्य सुरक्षा एवं स्वयं सहायता समूह सहायता',
    ta: 'குடும்ப சுகாதார காப்பீடு & சுய உதவிக்குழு',
    bn: 'পরিবার স্বাস্থ্য সুরক্ষা ও স্বনির্ভর সাহায্য',
    te: 'కుటుంబ ఆరోగ్య బీమా & స్వయం సహాయక బృందం',
  },
};

export const RightsAndSchemesView: React.FC<RightsAndSchemesViewProps> = ({
  profile,
  onUpdateProfile,
  language,
  onAskSahayak,
}) => {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [readingLevel, setReadingLevel] = useState<'simple' | 'detailed'>('simple');
  const [documentText, setDocumentText] = useState<string>(SAMPLE_OFFICIAL_NOTICES[0].text);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedImageMime, setUploadedImageMime] = useState<string>('image/png');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState<boolean>(false);
  const [explainedResult, setExplainedResult] = useState<ExplainedDocumentResult | null>({
    documentTitle: 'PM-KISAN Installment & Land Seeding Verification Notice',
    twoSentencePlainSummary:
      'This notice states that your next ₹2,000 farmer installment requires linking your Aadhaar e-KYC and land record (Land Seeding). You do not need to pay any middleman fee.',
    whatYouGetOrOwe: '₹6,000 per year (₹2,000 every 4 months directly via Aadhaar DBT)',
    whoIsEligibleOrAffected: [
      'Small and marginal farmer families with cultivable land in their name',
      'Farmers whose bank account NPCI/DBT status or Land Seeding shows pending',
    ],
    threeActionSteps: [
      'Take your Aadhaar card and land passbook (Khasra/Khatauni) to the village Patwari or CSC center.',
      'Complete free biometric or OTP e-KYC on pmkisan.gov.in.',
      'Ask your bank branch to enable Aadhaar NPCI Direct Benefit Transfer (DBT) on your account.',
    ],
    deadlineOrWarning: 'Complete before the 15th of next month so your ₹2,000 installment is not paused. Official fee: ₹0.',
    statutoryAuthority: 'Department of Agriculture & Farmers Welfare, Govt. of India',
    modelUsed: 'gemini-3.8-flash',
  });
  const [docError, setDocError] = useState<string | null>(null);
  const [liveSchemes, setLiveSchemes] = useState<GovernmentScheme[]>(REAL_GOVERNMENT_SCHEMES);
  const [ogdRecords, setOgdRecords] = useState<{ title: string; ministry: string; benefitText: string; sourceId: string }[]>([]);
  const [syncMeta, setSyncMeta] = useState<{
    status: string;
    hasDataGovKey: boolean;
    syncedAt: string;
    endpointUsed: string;
  } | null>(null);
  const [isSyncingSchemes, setIsSyncingSchemes] = useState<boolean>(false);

  const fetchLiveSchemes = async (forceRefresh = false) => {
    setIsSyncingSchemes(true);
    try {
      const res = await fetch(`/api/civic/schemes${forceRefresh ? '?refresh=1' : ''}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.schemes) && data.schemes.length > 0) {
          setLiveSchemes(data.schemes);
        }
        if (Array.isArray(data?.ogdRecords)) {
          setOgdRecords(data.ogdRecords);
        }
        if (data?.syncMeta) {
          setSyncMeta(data.syncMeta);
        }
      }
    } catch {
      // Keep baseline verified schemes if offline
    } finally {
      setIsSyncingSchemes(false);
    }
  };

  useEffect(() => {
    fetchLiveSchemes(false);
  }, []);

  const matches = evaluateSchemeEligibility(profile, liveSchemes);
  const eligibleMatches = matches.filter((m) => m.isEligible);
  const totalAnnualEntitlement = eligibleMatches.reduce((sum, m) => sum + m.estimatedAnnualBenefitINR, 0);

  const handleSelectPersona = (preset: (typeof PERSONA_PRESETS)[number]) => {
    onUpdateProfile({
      ...profile,
      occupation: preset.id,
      age: preset.defaultAge,
      annualIncomeINR: preset.defaultIncome,
    });
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      stopCivicSpeech(() => setSpeakingId(null));
      return;
    }
    setSpeakingId(id);
    speakCivicText(text, language, (active) => {
      if (!active) setSpeakingId(null);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setDocError(null);

    try {
      setIsAnalyzingDoc(true);
      const result = await processUploadedImageFile(file);
      setUploadedFileName(file.name);

      // 1. Set image preview state if a preview image dataUrl was generated
      if (result.dataUrl) {
        setUploadedImagePreview(result.dataUrl);
        setUploadedImageMime(result.mimeType);
      }

      // 2. Set extracted document text
      const extracted = (result.extractedText || '').trim();
      if (extracted.length > 0) {
        setDocumentText(extracted);
      } else {
        setDocumentText(`[Uploaded: ${file.name}] Multimodal visual scan active.`);
      }

      // 3. Trigger explanation immediately with extracted content
      const textToUse = extracted || '';
      await runDocumentExplanation(
        textToUse,
        result.dataUrl || uploadedImagePreview,
        result.mimeType || uploadedImageMime,
        readingLevel
      );
    } catch (err: any) {
      console.error('File upload error:', err);
      setDocError(err.message || 'Could not parse uploaded PDF document.');
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const runDocumentExplanation = async (
    textToAnalyze: string,
    imgDataUrl: string | null,
    imgMime: string,
    level: 'simple' | 'detailed'
  ) => {
    if (!textToAnalyze.trim() && !imgDataUrl) {
      setDocError('Please enter policy text, pick a sample notice, or upload a photo of your document.');
      return;
    }
    setDocError(null);
    setIsAnalyzingDoc(true);
    try {
      const res = await fetch('/api/civic/explain-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: textToAnalyze,
          imageBase64: imgDataUrl || undefined,
          imageMimeType: imgDataUrl ? imgMime : undefined,
          language,
          readingLevel: level,
        }),
      });
      if (!res.ok) {
        const raw = await res.text().catch(() => '');
        let detail = raw;
        try {
          const body = JSON.parse(raw);
          detail = body?.error || body?.message || raw;
        } catch {
          // non-JSON response (e.g. HTML 404 page)
        }
        console.error('explain-document failed:', res.status, detail);
        throw new Error(`Could not analyze document (${res.status}). ${detail.slice(0, 200)}`.trim());
      }
      const data = (await res.json()) as ExplainedDocumentResult;
      setExplainedResult(data);
    } catch (err) {
      setDocError((err as Error).message);
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  const handleLoadSampleNotice = (sample: (typeof SAMPLE_OFFICIAL_NOTICES)[number]) => {
    setUploadedFileName(null);
    setDocumentText(sample.text);
    const dataUrl = createSampleDocumentImageBase64(sample.label, sample.text, sample.refCode);
    const nextImg = dataUrl || null;
    if (nextImg) {
      setUploadedImagePreview(nextImg);
      setUploadedImageMime('image/png');
    }
    runDocumentExplanation(sample.text, nextImg, 'image/png', readingLevel);
  };

  const handleExplainNotice = async () => {
    const textToSend = documentText.startsWith('[Uploaded:') ? '' : documentText;
    await runDocumentExplanation(textToSend, uploadedImagePreview, uploadedImageMime, readingLevel);
  };

  return (
    <div className="space-y-12">
      {/* SECTION 1: Pictorial "Who Am I?" Citizen Entitlement Finder */}
      <section aria-labelledby="persona-heading" className="border-b border-[#1C1917] pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold mb-2">
              {t('personaKicker', language)}
            </p>
            <h2 id="persona-heading" className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
              {t('personaTitle', language)}
            </h2>
            <p className="text-sm text-[#44403C] mt-2 max-w-2xl">
              {t('personaSub', language)}
            </p>
          </div>

          {/* Total Matched Entitlement Summary Box */}
          <div className="bg-[#1C1917] text-[#F6F1E7] px-6 py-4 border border-[#1C1917] shrink-0">
            <div className="text-xs text-[#D6CEBE] flex items-center gap-2">
              <span>{t('matchedEntitlements', language)}</span>
              <span aria-hidden="true">·</span>
              <span>{eligibleMatches.length} {t('verifiedSchemes', language)}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-mono-tabular font-bold text-[#F6F1E7] mt-1">
              ₹{totalAnnualEntitlement.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-sans font-normal text-[#D6CEBE]">{t('yearValue', language)}</span>
            </div>
          </div>
        </div>

        {/* Live Web Search Grounding & Policy Registry Sync Strip */}
        <div className="bg-[#EFE8DA] border border-[#D4CBB4] px-4 py-2.5 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs text-[#44403C]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono-tabular font-bold text-[#14532D]">
              {t('liveSearchActive', language)}
            </span>
            <span>{syncMeta?.endpointUsed || 'Synchronizing with Gemini Google Search Grounding & Live Statutory Policy Feeds...'}</span>
            {syncMeta?.syncedAt && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular text-[#57534E]">
                  Synced {new Date(syncMeta.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => fetchLiveSchemes(true)}
            disabled={isSyncingSchemes}
            className="px-3 py-1 bg-[#F6F1E7] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#1C1917] font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            {isSyncingSchemes ? t('runningGrounding', language) : t('refreshData', language)}
          </button>
        </div>

        {ogdRecords.length > 0 && (
          <div className="bg-[#EFE8DA] border border-[#1C1917] p-4 mb-6 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#1C1917]">
              Live Web-Grounded Public Policy & Telemetry Bulletins
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ogdRecords.slice(0, 3).map((rec) => (
                <div key={rec.sourceId} className="bg-[#F6F1E7] p-3 border border-[#D4CBB4] text-xs space-y-1">
                  <div className="font-mono-tabular text-[11px] text-[#78350F]">{rec.sourceId} · {rec.ministry}</div>
                  <div className="font-bold text-[#1C1917]">{rec.title}</div>
                  <div className="text-[#44403C] line-clamp-2">{rec.benefitText}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6 Large Tactile Persona Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {PERSONA_PRESETS.map((preset) => {
            const isSelected = profile.occupation === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPersona(preset)}
                className={`text-left p-4 border transition-colors cursor-pointer flex flex-col justify-between min-h-[128px] ${
                  isSelected
                    ? 'bg-[#B43E1C] text-[#F6F1E7] border-[#1C1917]'
                    : 'bg-[#EFE8DA] text-[#1C1917] border-[#D4CBB4] hover:bg-[#E5DEC9]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <svg
                    className={`w-6 h-6 ${isSelected ? 'text-[#F6F1E7]' : 'text-[#B43E1C]'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    aria-hidden="true"
                  >
                    <path d={preset.svgPath} />
                  </svg>
                  {isSelected && <ArchivalSealIcon className="w-4 h-4 text-[#F6F1E7]" />}
                </div>
                <div>
                  <div className="font-bold text-sm leading-snug">
                    {preset.title[language] || preset.title.en}
                  </div>
                  <div
                    className={`text-xs mt-1 leading-tight ${
                      isSelected ? 'text-[#F6F1E7]/90' : 'text-[#57534E]'
                    }`}
                  >
                    {PERSONA_SUBTITLES[preset.id][language] || preset.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Simple Household Sliders & Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#EFE8DA] p-5 border border-[#1C1917]">
          <div>
            <label htmlFor="citizen-name-input" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              {t('citizenName', language)}
            </label>
            <input
              id="citizen-name-input"
              type="text"
              value={profile.name}
              onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label htmlFor="citizen-age-input" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              {t('ageLabel', language)} <span className="font-mono-tabular font-bold text-[#1C1917]">{profile.age} {t('yearsOld', language)}</span>
            </label>
            <input
              id="citizen-age-input"
              type="range"
              min={15}
              max={85}
              value={profile.age}
              onChange={(e) => onUpdateProfile({ ...profile, age: Number(e.target.value) })}
              className="w-full accent-[#B43E1C] cursor-pointer mt-2"
            />
          </div>

          <div>
            <label htmlFor="citizen-income-input" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              {t('yearlyIncome', language)}{' '}
              <span className="font-mono-tabular font-bold text-[#1C1917]">
                ₹{profile.annualIncomeINR.toLocaleString('en-IN')}
              </span>
            </label>
            <input
              id="citizen-income-input"
              type="range"
              min={30000}
              max={500000}
              step={10000}
              value={profile.annualIncomeINR}
              onChange={(e) => onUpdateProfile({ ...profile, annualIncomeINR: Number(e.target.value) })}
              className="w-full accent-[#B43E1C] cursor-pointer mt-2"
            />
          </div>

          <div>
            <label htmlFor="citizen-state-select" className="block text-xs font-semibold text-[#44403C] mb-1.5">
              {t('stateJurisdiction', language)}
            </label>
            <select
              id="citizen-state-select"
              value={profile.state}
              onChange={(e) => onUpdateProfile({ ...profile, state: e.target.value })}
              className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
            >
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Bihar">Bihar</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Telangana">Telangana</option>
              <option value="Assam">Assam</option>
            </select>
          </div>
        </div>

        {/* Matched Schemes Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {matches.map((match) => {
            const { scheme, isEligible, matchScore, matchedReasons, missingRequirements } = match;
            const localizedTitle = scheme.localizedTitle[language] || scheme.title;
            const localizedPlain = scheme.plainSummary[language] || scheme.plainSummary.en;
            const isSpeakingThis = speakingId === scheme.id;

            return (
              <article
                key={scheme.id}
                className={`p-6 border transition-colors flex flex-col justify-between ${
                  isEligible
                    ? 'bg-[#EFE8DA] border-[#14532D]'
                    : 'bg-[#F6F1E7] border-[#D4CBB4] opacity-85'
                }`}
              >
                <div>
                  {/* Quiet inline metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E] mb-2">
                    <span className={isEligible ? 'font-bold text-[#14532D]' : 'font-medium text-[#78350F]'}>
                      {isEligible ? t('eligibleNow', language) : t('partialMatch', language)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{t('matchScore', language)} {matchScore}%</span>
                    <span aria-hidden="true">·</span>
                    <span>{scheme.ministry}</span>
                  </div>

                  <h3 className="text-xl font-bold text-[#1C1917] leading-snug">{localizedTitle}</h3>

                  {/* Spoken Plain-Language Box */}
                  <p className="mt-3 text-base text-[#1C1917] leading-relaxed bg-[#F6F1E7] p-4 border border-[#D4CBB4]">
                    {localizedPlain}
                  </p>

                  {/* Why you qualify / What you need (No checkmark characters) */}
                  <div className="mt-4 space-y-1.5 text-xs text-[#44403C]">
                    {matchedReasons.map((reason, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-mono-tabular text-[#14532D] font-bold shrink-0">[+]</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                    {missingRequirements.map((miss, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[#9A3412]">
                        <span className="font-mono-tabular font-bold shrink-0">[!]</span>
                        <span>{miss}</span>
                      </div>
                    ))}
                  </div>

                  {/* Documents & Direct Official Portal Link */}
                  <div className="mt-4 pt-3 border-t border-[#D4CBB4] text-xs text-[#44403C] space-y-1">
                    <div className="font-semibold text-[#1C1917]">
                      {t('requiredPapers', language)} {scheme.documentsRequired.join(' · ')}
                    </div>
                    <div className="text-[#57534E]">
                      {t('statutoryRef', language)} {scheme.statutoryCitation}
                    </div>
                    <div className="pt-1">
                      <a
                        href={scheme.applicationPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono-tabular text-[#1E3A8A] font-semibold hover:underline"
                      >
                        <span>{t('officialPortal', language)} {scheme.applicationPortalUrl}</span>
                        <ExternalPortalIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Action Controls: Listen Aloud + Ask JanSahayak Guide */}
                <div className="mt-6 pt-4 border-t border-[#D4CBB4] flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleSpeak(scheme.id, `${localizedTitle}. ${localizedPlain}`)}
                    className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                      isSpeakingThis
                        ? 'bg-[#14532D] text-[#F6F1E7] border-[#14532D]'
                        : 'bg-[#F6F1E7] text-[#1C1917] border-[#1C1917] hover:bg-[#E5DEC9]'
                    }`}
                  >
                    {isSpeakingThis ? (
                      <>
                        <AcousticMuteIcon className="w-4 h-4" />
                        <span>{t('stopVoice', language)}</span>
                      </>
                    ) : (
                      <>
                        <AcousticHornIcon className="w-4 h-4 text-[#B43E1C]" />
                        <span>{t('listenVoice', language)}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onAskSahayak(scheme.title)}
                    className="px-4 py-2.5 text-xs font-semibold bg-[#1C1917] text-[#F6F1E7] border border-[#1C1917] hover:bg-[#292524] transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>{t('askGuide', language)}</span>
                    <RightChevronStampIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: Multimodal Government Circular & Notice Photo Scanner */}
      <section id="notice-scanner-section" aria-labelledby="scanner-heading">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold mb-2">
              {t('scannerKicker', language)}
            </p>
            <h2 id="scanner-heading" className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
              {t('scannerTitle', language)}
            </h2>
            <p className="text-sm text-[#44403C] mt-1 max-w-2xl">
              {t('scannerSub', language)}
            </p>
          </div>

          {/* Reading Complexity Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#EFE8DA] border border-[#1C1917] shrink-0">
            <button
              type="button"
              onClick={() => {
                setReadingLevel('simple');
                const textToSend = documentText.startsWith('[Uploaded:') ? '' : documentText;
                if (textToSend.trim() || uploadedImagePreview) {
                  runDocumentExplanation(textToSend, uploadedImagePreview, uploadedImageMime, 'simple');
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                readingLevel === 'simple'
                  ? 'bg-[#1C1917] text-[#F6F1E7]'
                  : 'text-[#44403C] hover:text-[#1C1917]'
              }`}
            >
              {t('simpleWords', language)}
            </button>
            <button
              type="button"
              onClick={() => {
                setReadingLevel('detailed');
                const textToSend = documentText.startsWith('[Uploaded:') ? '' : documentText;
                if (textToSend.trim() || uploadedImagePreview) {
                  runDocumentExplanation(textToSend, uploadedImagePreview, uploadedImageMime, 'detailed');
                }
              }}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                readingLevel === 'detailed'
                  ? 'bg-[#1C1917] text-[#F6F1E7]'
                  : 'text-[#44403C] hover:text-[#1C1917]'
              }`}
            >
              {t('detailedClauses', language)}
            </button>
          </div>
        </div>

        {/* Sample Notice Presets */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs font-semibold text-[#57534E] mr-1">{t('tryOfficialNotice', language)}</span>
          {SAMPLE_OFFICIAL_NOTICES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleLoadSampleNotice(sample)}
              className="px-3 py-1.5 text-xs font-medium bg-[#EFE8DA] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#D4CBB4] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input Column */}
          <div className="lg:col-span-5 bg-[#EFE8DA] p-6 border border-[#1C1917] space-y-4">
            <div>
              <label htmlFor="notice-photo-upload" className="block text-xs font-semibold text-[#1C1917] mb-2">
                {t('uploadNoticePhoto', language)}
              </label>
              <label
                htmlFor="notice-photo-upload"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-dashed border-[#78350F] bg-[#F6F1E7] hover:bg-[#E5DEC9]/60 cursor-pointer text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <DocumentScanIcon className="w-4 h-4 text-[#B43E1C]" />
                <span>{t('chooseNoticeFile', language)}</span>
                <input
                  id="notice-photo-upload"
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {uploadedImagePreview && (
              <div className="p-3 bg-[#F6F1E7] border border-[#D4CBB4]">
                <div className="flex items-center justify-between text-xs text-[#57534E] mb-2">
                  <span>{t('attachedDocReady', language)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImagePreview(null);
                      setUploadedFileName(null);
                      if (documentText.startsWith('[Uploaded:')) {
                        setDocumentText('');
                      }
                    }}
                    className="text-[#B43E1C] font-semibold hover:underline cursor-pointer"
                  >
                    {t('removeDocument', language)}
                  </button>
                </div>
                {uploadedImageMime === 'application/pdf' || uploadedImagePreview.startsWith('data:application/pdf') ? (
                  <div className="flex items-center gap-3 p-3 bg-[#EFE8DA] border border-[#D4CBB4]">
                    <div className="w-10 h-10 bg-[#B43E1C] text-[#F6F1E7] flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1C1917] truncate">
                        {uploadedFileName || 'Government Notice PDF'}
                      </p>
                      <p className="text-[11px] text-[#57534E]">
                        Multimodal Document Attached · Ready for Gemini Explanation
                      </p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={uploadedImagePreview}
                    alt="Uploaded government circular preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-36 object-cover border border-[#D4CBB4]"
                  />
                )}
              </div>
            )}

            <div>
              <label htmlFor="notice-text-input" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                {t('pasteNoticeText', language)}
              </label>
              <textarea
                id="notice-text-input"
                rows={5}
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                className="w-full p-3 bg-[#F6F1E7] border border-[#D4CBB4] text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
                placeholder={t('noticePlaceholder', language)}
              />
            </div>

            {docError && (
              <p role="alert" className="text-xs font-semibold text-[#9A3412] bg-[#F6F1E7] p-2.5 border border-[#9A3412]">
                {docError}
              </p>
            )}

            <button
              type="button"
              onClick={handleExplainNotice}
              disabled={isAnalyzingDoc}
              className="w-full py-3 px-5 bg-[#B43E1C] hover:bg-[#9A3412] disabled:opacity-60 text-[#F6F1E7] border border-[#1C1917] font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <EditorialQuillIcon className="w-4 h-4" />
              <span>
                {isAnalyzingDoc
                  ? t('translatingBtn', language)
                  : t('translateNoticeBtn', language)}
              </span>
            </button>
          </div>

          {/* Output Column with Architectural Skeleton Loader */}
          <div className="lg:col-span-7 bg-[#EFE8DA] p-6 border border-[#1C1917] min-h-[380px] flex flex-col justify-between">
            {isAnalyzingDoc ? (
              <div aria-live="polite" aria-busy="true" className="space-y-5">
                <div className="border-b border-[#D4CBB4] pb-4 space-y-2">
                  <div className="h-3.5 w-56 skeleton-block" />
                  <div className="h-6 w-3/4 skeleton-block" />
                </div>
                <div className="p-4 bg-[#F6F1E7] border border-[#D4CBB4] space-y-2">
                  <div className="h-3 w-40 skeleton-block" />
                  <div className="h-4 w-full skeleton-block" />
                  <div className="h-4 w-5/6 skeleton-block" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F6F1E7] border border-[#D4CBB4] space-y-2">
                    <div className="h-3 w-36 skeleton-block" />
                    <div className="h-4 w-4/5 skeleton-block" />
                  </div>
                  <div className="p-4 bg-[#F6F1E7] border border-[#D4CBB4] space-y-2">
                    <div className="h-3 w-36 skeleton-block" />
                    <div className="h-4 w-4/5 skeleton-block" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-48 skeleton-block" />
                  <div className="h-10 w-full skeleton-block" />
                  <div className="h-10 w-full skeleton-block" />
                  <div className="h-10 w-full skeleton-block" />
                </div>
              </div>
            ) : explainedResult ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D4CBB4] pb-4">
                  <div>
                    <div className="text-xs text-[#57534E]">
                      <span>{explainedResult.statutoryAuthority}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono-tabular">{explainedResult.modelUsed}</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#1C1917] mt-1">
                      {explainedResult.documentTitle}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleSpeak(
                        'explained-doc',
                        `${explainedResult.documentTitle}. ${explainedResult.twoSentencePlainSummary}. Steps to take: ${explainedResult.threeActionSteps.join('. ')}`
                      )
                    }
                    className="px-4 py-2 bg-[#14532D] text-[#F6F1E7] border border-[#1C1917] text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {speakingId === 'explained-doc' ? (
                      <>
                        <AcousticMuteIcon className="w-4 h-4" />
                        <span>{t('stopVoice', language)}</span>
                      </>
                    ) : (
                      <>
                        <AcousticHornIcon className="w-4 h-4" />
                        <span>{t('listenVoice', language)}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Plain Summary */}
                <div className="bg-[#F6F1E7] p-4 border border-[#D4CBB4]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#78350F] mb-1">
                    {t('explainerResultTitle', language)}
                  </div>
                  <p className="text-base text-[#1C1917] leading-relaxed font-medium">
                    {explainedResult.twoSentencePlainSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#F6F1E7] p-4 border border-[#D4CBB4]">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#14532D] mb-1">
                      {t('whatYouGetOrOwe', language)}
                    </div>
                    <p className="text-sm font-bold text-[#1C1917]">{explainedResult.whatYouGetOrOwe}</p>
                  </div>

                  <div className="bg-[#F6F1E7] p-4 border border-[#D4CBB4]">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#9A3412] mb-1">
                      {t('deadlineWarning', language)}
                    </div>
                    <p className="text-sm text-[#1C1917]">{explainedResult.deadlineOrWarning}</p>
                  </div>
                </div>

                {/* 3 Concrete Action Steps */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#44403C] mb-2.5">
                    {t('threeActionSteps', language)}
                  </h4>
                  <ol className="space-y-2">
                    {explainedResult.threeActionSteps.map((step, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 bg-[#F6F1E7] p-3 border border-[#D4CBB4] text-sm text-[#1C1917]"
                      >
                        <span className="font-mono-tabular font-bold text-[#B43E1C] shrink-0">
                          0{index + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <div className="my-auto text-center py-12 px-4">
                <DocumentScanIcon className="w-10 h-10 text-[#78350F] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[#1C1917]">
                  Ready to Translate Any Official Notice into Plain Speech
                </h3>
                <p className="text-sm text-[#57534E] max-w-md mx-auto mt-1 mb-5">
                  Click &ldquo;Explain Notice in Plain Language&rdquo; on the left (or upload a photo of your circular) to run deep statutory extraction and voice readout.
                </p>
                <button
                  type="button"
                  onClick={handleExplainNotice}
                  className="px-5 py-2.5 bg-[#1C1917] text-[#F6F1E7] text-xs font-semibold border border-[#1C1917] hover:bg-[#292524] transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <DocumentScanIcon className="w-4 h-4" />
                  <span>Explain Selected PM-KISAN Circular Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
