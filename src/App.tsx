/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { t } from './utils/translations';
import React, { useState, useEffect } from 'react';
import {
  CitizenProfile,
  SupportedLanguage,
} from './utils/civicLogic';
import { speakCivicText, stopCivicSpeech } from './utils/speechHelper';
import {
  AcousticHornIcon,
  AcousticMuteIcon,
  ScriptGlobeIcon,
} from './components/CivicIcons';
import { RightsAndSchemesView } from './components/RightsAndSchemesView';
import { FactCheckAuditView } from './components/FactCheckAuditView';
import { JanSahayakChatView } from './components/JanSahayakChatView';
import { LegalPagesView } from './components/LegalPagesView';

type ActiveTab = 'rights' | 'factcheck' | 'chat' | 'tos' | 'privacy';

interface LivePulseData {
  environment: {
    city: string;
    state: string;
    temperatureC: number;
    precipitationMm: number;
    aqi: number;
  };
  macroIndicators: {
    code: string;
    label: string;
    value: number;
    unit: string;
    year: string;
  }[];
}

const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string; nativeName: string }[] = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'bn', label: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
];

const HERO_TRANSLATIONS: Record<
  SupportedLanguage,
  {
    kicker: string;
    headline: string;
    subheadline: string;
    guideAudioText: string;
  }
> = {
  en: {
    kicker: 'Public Rights, Policy Translation & Fact-Verification Commons',
    headline: 'Every Government Scheme, Official Notice & Legal Right in Plain Human Speech.',
    subheadline:
      'Built for rural farmers, street vendors, daily-wage workers, students, and senior citizens. Tap your work profile to hear your entitlements, scan a photo of any government circular, or verify viral WhatsApp claims.',
    guideAudioText:
      'Welcome to JanSetu. Tap your occupation card below to hear your government benefits in your own voice, upload any confusing notice photo, or check viral WhatsApp rumors.',
  },
  hi: {
    kicker: 'जन अधिकार, सरकारी नीति अनुवाद एवं सत्य-जांच मंच',
    headline: 'हर सरकारी योजना, कानूनी अधिकार और सरकारी नोटिस अब आपकी अपनी सरल भाषा में।',
    subheadline:
      'किसान, रेहड़ी-पटरी विक्रेता, मज़दूर, छात्र और वरिष्ठ नागरिकों के लिए निर्मित। अपनी प्रोफ़ाइल चुनें, सरकारी नोटिस की फोटो स्कैन करें या वायरल संदेशों की सच्चाई जांचें।',
    guideAudioText:
      'जनसेतु में आपका स्वागत है। नीचे अपने काम का कार्ड चुनें और अपनी भाषा में सरकारी योजनाओं की जानकारी सुनें, या किसी भी सरकारी कागज़ की फोटो अपलोड करें।',
  },
  ta: {
    kicker: 'மக்கள் உரிமைகள், அரசு திட்டங்கள் மற்றும் உண்மை சரிபார்ப்பு தளம்',
    headline: 'அனைத்து அரசு திட்டங்களும் சட்ட உரிமைகளும் எளிய தமிழ் மொழியில்.',
    subheadline:
      'விவசாயிகள், சாலையோர வியாபாரிகள், தொழிலாளர்கள் மற்றும் மாணவர்களுக்காக உருவாக்கப்பட்டது. உங்கள் தகுதியை அறிய படத்தைத் தட்டவும் அல்லது குரல் மூலம் கேட்கவும்.',
    guideAudioText:
      'ஜன்சேது தளத்திற்கு வரவேற்கிறோம். உங்கள் தொழிலைத் தேர்ந்தெடுத்து அரசு நலத்திட்டங்களை உங்கள் குரலில் கேளுங்கள்.',
  },
  bn: {
    kicker: 'জনঅধিকার, সরকারি প্রকল্প ও তথ্য যাচাই মঞ্চ',
    headline: 'প্রতিটি সরকারি প্রকল্প, আইনি অধিকার ও সরকারি বিজ্ঞপ্তি এখন সহজ ভাষায়।',
    subheadline:
      'কৃষক, পথ ব্যবসায়ী, দিনমজুর ও শিক্ষার্থীদের জন্য তৈরি। এক ক্লিকে আপনার প্রাপ্য সরকারি সুবিধা জানুন ও ভয়েস অডিও শুনুন।',
    guideAudioText:
      'জনসেতুতে স্বাগতম। নিচের কার্ডে ট্যাপ করে আপনার প্রাপ্য সরকারি প্রকল্পের কথা নিজের ভাষায় শুনুন।',
  },
  te: {
    kicker: 'ప్రజా హక్కులు, ప్రభుత్వ పథకాలు & వాస్తవ తనిఖీ వేదిక',
    headline: 'ప్రతి ప్రభుత్వ పథకం, చట్టపరమైన హక్కు మరియు ప్రభుత్వ నోటీసు సులభమైన భాషలో.',
    subheadline:
      'రైతులు, వీధి వ్యాపారులు, కార్మికులు మరియు విద్యార్థుల కోసం రూపొందించబడింది. మీ అర్హతలను తెలుసుకోవడానికి మరియు వాయిస్‌లో వినడానికి కార్డును నొక్కండి.',
    guideAudioText:
      'జన్‌సేతుకు స్వాగతం. మీ వృత్తిని ఎంచుకుని ప్రభుత్వ పథకాల వివరాలను మీ భాషలో వినండి.',
  },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('rights');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [isSpeakingGuide, setIsSpeakingGuide] = useState<boolean>(false);
  const [pendingChatQuestion, setPendingChatQuestion] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState<LivePulseData | null>(null);

  const [profile, setProfile] = useState<CitizenProfile>({
    name: 'Ramesh Kumar',
    age: 42,
    occupation: 'farmer',
    annualIncomeINR: 85000,
    state: 'Delhi NCR',
    hasRationCard: true,
    hasBankAccount: true,
    isRural: true,
  });

  useEffect(() => {
    const cityMap: Record<string, string> = {
      'Delhi NCR': 'New Delhi',
      'Maharashtra': 'Mumbai',
      'Karnataka': 'Bengaluru',
      'Tamil Nadu': 'Chennai',
      'West Bengal': 'Kolkata',
      'Telangana': 'Hyderabad',
      'Bihar': 'Patna',
      'Assam': 'Guwahati',
    };
    const targetCity = cityMap[profile.state] || 'New Delhi';
    fetch(`/api/civic/live-pulse?city=${encodeURIComponent(targetCity)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.environment) setLivePulse(data);
      })
      .catch(() => {
        // Silent fallback if telemetry offline
      });
  }, [profile.state]);

  const heroCopy = HERO_TRANSLATIONS[language] || HERO_TRANSLATIONS.en;

  const handleTogglePageGuide = () => {
    if (isSpeakingGuide) {
      stopCivicSpeech(() => setIsSpeakingGuide(false));
      return;
    }
    setIsSpeakingGuide(true);
    speakCivicText(heroCopy.guideAudioText, language, (active) => {
      if (!active) setIsSpeakingGuide(false);
    });
  };

  const handleJumpToScanner = () => {
    setActiveTab('rights');
    setTimeout(() => {
      document.getElementById('notice-scanner-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const handleAskSahayak = (schemeTitle: string) => {
    setPendingChatQuestion(
      `How do I apply step-by-step for ${schemeTitle}, what documents do I need, and how do I avoid middlemen?`
    );
    setActiveTab('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E7] text-[#1C1917]">
      {/* Strict 3-Zone Top Bar Contract (No glassmorphism or pure white) */}
      <header className="flex items-center justify-between gap-8 px-6 lg:px-12 py-4 border-b border-[#1C1917] bg-[#F6F1E7] sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('rights');
          }}
          className="text-xl font-bold tracking-tight text-[#1C1917] font-serif-display whitespace-nowrap shrink-0"
        >
          JanSetu
        </a>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav aria-label="Main Civic Modules" className="hidden md:flex items-center gap-6 text-sm font-medium text-[#44403C]">
          <button
            type="button"
            onClick={() => setActiveTab('rights')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'rights'
                ? 'text-[#1C1917] font-bold border-[#B43E1C]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            {t('navRights', language)}
          </button>
          <button
            type="button"
            onClick={handleJumpToScanner}
            className="py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 border-transparent hover:text-[#1C1917]"
          >
            {t('navScanner', language)}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('factcheck')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'factcheck'
                ? 'text-[#1C1917] font-bold border-[#B43E1C]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            {t('navFactcheck', language)}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'chat'
                ? 'text-[#1C1917] font-bold border-[#B43E1C]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            {t('navChat', language)}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleTogglePageGuide}
            className="px-4 py-2 text-xs font-semibold text-[#F6F1E7] bg-[#B43E1C] hover:bg-[#9A3412] border border-[#1C1917] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSpeakingGuide ? (
              <>
                <AcousticMuteIcon className="w-3.5 h-3.5" />
                <span>{t('stopAudioGuide', language)}</span>
              </>
            ) : (
              <>
                <AcousticHornIcon className="w-3.5 h-3.5" />
                <span>{t('listenPageGuide', language)}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-[1280px] w-full mx-auto px-5 sm:px-8 lg:px-12 py-8 space-y-10">
        {/* Hero Broadsheet Banner + Vernacular Language Toolbar */}
        <section className="border-b border-[#1C1917] pb-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#78350F] mb-2">
                {heroCopy.kicker}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1C1917] leading-[1.15]">
                {heroCopy.headline}
              </h1>
              <p className="text-base text-[#44403C] mt-3 leading-relaxed">
                {heroCopy.subheadline}
              </p>
            </div>

            {/* Vernacular Language Switcher */}
            <div className="bg-[#EFE8DA] p-3.5 border border-[#1C1917] shrink-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#44403C] mb-2">
                <ScriptGlobeIcon className="w-3.5 h-3.5 text-[#B43E1C]" />
                <span>{t('chooseLanguage', language)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                      language === lang.code
                        ? 'bg-[#1C1917] text-[#F6F1E7] border-[#1C1917]'
                        : 'bg-[#F6F1E7] text-[#1C1917] border-[#D4CBB4] hover:bg-[#E5DEC9]'
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Open-Meteo & World Bank Civic Pulse Telemetry Strip */}
          {livePulse && (
            <div className="bg-[#EFE8DA] border border-[#D4CBB4] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#44403C]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#1C1917] uppercase tracking-wider">
                  {t('liveCivicTelemetry', language)} ({livePulse.environment.city})
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {t('temp', language)} {livePulse.environment.temperatureC.toFixed(1)}°C
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {t('usAqi', language)} {livePulse.environment.aqi}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">
                  {t('rain', language)} {livePulse.environment.precipitationMm.toFixed(1)} mm
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-[11px] text-[#57534E]">
                {livePulse.macroIndicators.map((ind) => (
                  <span key={ind.code}>
                    {ind.label.split('(')[0].trim()}: <strong className="text-[#1C1917]">{ind.value}{ind.unit}</strong> ({ind.year})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Architectural Broadsheet Ledger Index Bar (No 3-card row) */}
          <div
            role="tablist"
            aria-label="Civic Workspaces"
            className="flex flex-col md:flex-row border border-[#1C1917] bg-[#EFE8DA] divide-y md:divide-y-0 md:divide-x divide-[#1C1917]"
          >
            {[
              {
                id: 'rights' as const,
                num: 'SECTION 01',
                title: t('sec01Title', language),
                sub: t('sec01Sub', language),
              },
              {
                id: 'factcheck' as const,
                num: 'SECTION 02',
                title: t('sec02Title', language),
                sub: t('sec02Sub', language),
              },
              {
                id: 'chat' as const,
                num: 'SECTION 03',
                title: t('sec03Title', language),
                sub: t('sec03Sub', language),
              },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-5 py-4 text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1C1917] text-[#F6F1E7]'
                      : 'bg-[#EFE8DA] text-[#1C1917] hover:bg-[#E5DEC9]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono-tabular mb-1">
                    <span className={active ? 'text-[#B43E1C] font-bold' : 'text-[#78350F] font-semibold'}>
                      {tab.num}
                    </span>
                    <span className={`text-[11px] ${active ? 'text-[#D6CEBE]' : 'text-[#57534E]'}`}>
                      {active ? t('activeLedger', language) : t('openLedger', language)}
                    </span>
                  </div>
                  <div className="text-sm font-bold leading-snug">
                    {tab.title}
                  </div>
                  <div className={`text-xs mt-0.5 ${active ? 'text-[#D6CEBE]' : 'text-[#57534E]'}`}>
                    {tab.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Active Module Workspace */}
        {activeTab === 'rights' && (
          <RightsAndSchemesView
            profile={profile}
            onUpdateProfile={setProfile}
            language={language}
            onAskSahayak={handleAskSahayak}
          />
        )}

        {activeTab === 'factcheck' && <FactCheckAuditView language={language} />}

        {activeTab === 'chat' && (
          <JanSahayakChatView
            language={language}
            profile={profile}
            initialQuestion={pendingChatQuestion}
            onClearInitialQuestion={() => setPendingChatQuestion(null)}
          />
        )}

        {(activeTab === 'tos' || activeTab === 'privacy') && (
          <LegalPagesView
            page={activeTab}
            onSwitchPage={(p) => setActiveTab(p)}
            onReturnHome={() => setActiveTab('rights')}
          />
        )}
      </main>

      {/* Institutional Footer with Essential Legal Pages (TOS & Privacy Policy) */}
      <footer className="border-t border-[#1C1917] bg-[#EFE8DA] px-6 lg:px-12 py-6 mt-16">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-[#57534E]">
          <div>
            <strong className="text-[#1C1917]">JanSetu Public Governance Commons</strong> · Connected to Public Statutory Registries, Official .gov.in Portals & Live MediaWiki Grounding
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('rights')}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {t('footerRights', language)}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('factcheck')}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {t('footerFactCheck', language)}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              {t('footerLegalAid', language)}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('tos');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`font-semibold transition-colors cursor-pointer ${
                activeTab === 'tos' ? 'text-[#B43E1C] underline' : 'text-[#1C1917] hover:underline'
              }`}
            >
              {t('footerTos', language)}
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => {
                setActiveTab('privacy');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`font-semibold transition-colors cursor-pointer ${
                activeTab === 'privacy' ? 'text-[#B43E1C] underline' : 'text-[#1C1917] hover:underline'
              }`}
            >
              {t('footerPrivacy', language)}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
