import React, { useState, useRef, useEffect } from 'react';
import { t } from '../utils/translations';
import {
  CitizenProfile,
  CivicGrievanceRecord,
  generateReceiptHash,
  generateRTIDraft,
  SupportedLanguage,
} from '../utils/civicLogic';
import { createSampleDocumentImageBase64, speakCivicText } from '../utils/speechHelper';
import {
  AcousticHornIcon,
  AcousticMuteIcon,
  CitizenPortraitIcon,
  DocumentScanIcon,
  EditorialQuillIcon,
  LedgerCopyIcon,
  LedgerDownloadIcon,
  SahayakEmblemIcon,
  StatutoryScaleIcon,
  VoiceMicIcon,
} from './CivicIcons';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  imagePreview?: string;
  timestamp: string;
}

interface JanSahayakChatViewProps {
  language: SupportedLanguage;
  profile?: CitizenProfile;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

const ROLE_PERSONAS: {
  id: 'sahayak' | 'rti_counsel' | 'fact_auditor';
  label: string;
  description: string;
}[] = [
  {
    id: 'sahayak',
    label: 'Gram & Ward Sahayak (Plain-Language Guide)',
    description: 'Explains welfare schemes, ration cards, and pensions in simple 1-2-3 steps.',
  },
  {
    id: 'rti_counsel',
    label: 'Constitutional & RTI Legal Counsel',
    description: 'Drafts Section 6(1) RTI requests, First Appeals, and SLA breach notices.',
  },
  {
    id: 'fact_auditor',
    label: 'Forensic Rumor & Scam Auditor',
    description: 'Inspects suspicious WhatsApp links, fake circulars, and synthetic media.',
  },
];

const MODEL_TIERS: {
  id: 'fast' | 'general' | 'deep';
  label: string;
  modelName: string;
}[] = [
  {
    id: 'fast',
    label: 'Fast Flash Lookup',
    modelName: 'gemini-3.8-flash (Low)',
  },
  {
    id: 'general',
    label: 'Standard Flash Guide',
    modelName: 'gemini-3.8-flash (Med)',
  },
  {
    id: 'deep',
    label: 'Deep Flash Thinking',
    modelName: 'gemini-3.8-flash (High)',
  },
];

const QUICK_PROMPTS = [
  'My ration dealer refused to give grains on my card in a new city. What are my legal rights?',
  'How do I file a Section 6(1) RTI application if a road repair SLA is delayed?',
  'How can my 73-year-old grandmother get ₹5 Lakh free hospital treatment under Ayushman Bharat?',
  'What documents do I need for a ₹10,000 PM SVANidhi street vendor loan?',
];

export const JanSahayakChatView: React.FC<JanSahayakChatViewProps> = ({
  language,
  profile,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [rolePersona, setRolePersona] = useState<'sahayak' | 'rti_counsel' | 'fact_auditor'>('sahayak');
  const [modelTier, setModelTier] = useState<'fast' | 'general' | 'deep'>('general');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: 'Namaste! I am JanSahayak, your public rights and civic governance companion powered by Gemini Flash. You can ask me any question in plain language, switch my role to Constitutional RTI Counsel, or attach a photo of a government notice for multimodal analysis.',
      modelUsed: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedMime, setAttachedMime] = useState<string>('image/png');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedExtractedText, setAttachedExtractedText] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [voiceStatusNote, setVoiceStatusNote] = useState<string | null>(null);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);

  // Statutory Section 6(1) RTI Notice Builder State
  const [rtiApplicantName, setRtiApplicantName] = useState<string>(profile?.name || 'Sunita Devi');
  const [rtiDepartment, setRtiDepartment] = useState<string>('Food & Civil Supplies Department (NFSA Ration)');
  const [rtiIssueText, setRtiIssueText] = useState<string>(
    'Monthly NFSA foodgrain ration quota and portability transaction withheld for 3 months without written order.'
  );
  const [rtiRefCode, setRtiRefCode] = useState<string>('RC-2026-99281');
  const [rtiBplExempt, setRtiBplExempt] = useState<boolean>(true);
  const [copiedRti, setCopiedRti] = useState<boolean>(false);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (profile?.name) {
      setRtiApplicantName(profile.name);
    }
  }, [profile?.name]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    try {
      const { processUploadedImageFile } = await import('../utils/speechHelper');
      const { dataUrl, mimeType, extractedText } = await processUploadedImageFile(file);
      setAttachedMime(mimeType);
      setAttachedImage(dataUrl);
      setAttachedFileName(file.name);
      if (extractedText && extractedText.trim().length > 0) {
        setAttachedExtractedText(extractedText);
      }
    } catch (err) {
      setUploadError((err as Error).message);
    }
  };

  const handleAttachSamplePhoto = () => {
    setUploadError(null);
    const sample = createSampleDocumentImageBase64(
      'RATION CARD PORTABILITY & E-POS SLIP',
      'National Food Security Act (NFSA) One Nation One Ration Card (ONORC) dealer transaction query: Biometric authentication completed, 5kg rice entitlement verification.',
      'NFSA-ONORC-2026'
    );
    if (sample) {
      setAttachedImage(sample);
      setAttachedMime('image/png');
      setAttachedFileName('sample_slip.png');
      setAttachedExtractedText(
        'National Food Security Act (NFSA) One Nation One Ration Card (ONORC) dealer transaction query: Biometric authentication completed, 5kg rice entitlement verification.'
      );
    }
  };

  const handleToggleVoiceDictation = () => {
    setVoiceStatusNote(null);
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setInputText('How can I file a free RTI application if my ration or pension is delayed?');
      setVoiceStatusNote(
        'Browser voice recognition is unavailable in this environment. Loaded a sample voice query into the composer below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRec();
      const langMap: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        bn: 'bn-IN',
        te: 'te-IN',
      };
      recognition.lang = langMap[language] || 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListeningMic(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputText(transcript);
        }
        setIsListeningMic(false);
      };
      recognition.onerror = () => {
        setIsListeningMic(false);
        setInputText('How can I file a free RTI application if my ration or pension is delayed?');
        setVoiceStatusNote(
          'Microphone permission was declined or unavailable. Loaded a sample citizen query into the composer.'
        );
      };
      recognition.onend = () => {
        setIsListeningMic(false);
      };
      recognition.start();
    } catch {
      setIsListeningMic(false);
      setInputText('How can I file a free RTI application if my ration or pension is delayed?');
      setVoiceStatusNote(
        'Voice dictation could not start in this browser context. Loaded a sample citizen query into the composer.'
      );
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : inputText).trim();
    if (!textToSend && !attachedImage && !attachedExtractedText) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text:
        textToSend ||
        (attachedFileName
          ? `Please analyze this uploaded document (${attachedFileName}) and explain what steps I should take.`
          : 'Please analyze this uploaded document and tell me what steps I should take.'),
      imagePreview: attachedImage || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    const imageToSend = attachedImage;
    const mimeToSend = attachedMime;
    const docTextToSend = attachedExtractedText;
    setAttachedImage(null);
    setAttachedFileName(null);
    setAttachedExtractedText(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/civic/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({ role: m.role, text: m.text })),
          rolePersona,
          modelTier,
          imageBase64: imageToSend || undefined,
          imageMimeType: imageToSend ? mimeToSend : undefined,
          documentText: docTextToSend || undefined,
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.reply || 'Please let me know how I can assist further.',
        modelUsed: data.modelUsed || 'gemini-2.5-flash',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'Network connection interrupted. Please try sending your question again.',
          modelUsed: 'Offline Safety Fallback',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleSendMessage(initialQuestion);
      onClearInitialQuestion?.();
    }
  }, [initialQuestion]);

  const handleToggleMessageSpeech = async (msgId: string, text: string) => {
    const { stopCivicSpeech } = await import('../utils/speechHelper');
    if (speakingMsgId === msgId) {
      stopCivicSpeech(() => setSpeakingMsgId(null));
      return;
    }
    setSpeakingMsgId(msgId);
    speakCivicText(text, language, (active) => {
      if (!active) setSpeakingMsgId(null);
    });
  };

  // Build Statutory Section 6(1) RTI Draft using civicLogic.ts
  const syntheticGrievanceForRti: CivicGrievanceRecord = {
    id: 'rti-builder',
    trackingId: rtiRefCode || 'RTI-2026-8841',
    title: `${rtiDepartment} Entitlement Delay`,
    description: rtiIssueText,
    category: 'hospital_supply_shortage',
    city: profile?.state || 'Delhi NCR',
    ward: 'Public Jurisdiction Ward',
    coordinates: { lat: 28.6139, lon: 77.209 },
    severityScore: 88,
    priorityLevel: 'CRITICAL',
    slaHours: 48,
    assignedDepartment: rtiDepartment,
    statutoryActReference: rtiBplExempt
      ? 'Section 6(1) & Section 7(1) Proviso, RTI Act 2005 (Rule 3 BPL Fee Exemption: ₹0 Fee)'
      : 'Section 6(1) & Section 7(1) Right to Information Act, 2005',
    environmentalContext: {
      temperatureC: 30,
      precipitationMm: 0,
      aqi: 110,
      multiplierNote: 'Statutory Citizen Entitlement Verification',
    },
    status: 'ESCALATED_RTI',
    createdAt: new Date().toISOString(),
    ledgerHash: generateReceiptHash(`${rtiApplicantName}|${rtiDepartment}|${rtiRefCode}`),
  };

  const generatedRtiNoticeText = generateRTIDraft(syntheticGrievanceForRti, rtiApplicantName);

  const handleCopyRti = async () => {
    try {
      await navigator.clipboard?.writeText(generatedRtiNoticeText);
      setCopiedRti(true);
      setTimeout(() => setCopiedRti(false), 2500);
    } catch {
      setCopiedRti(true);
      setTimeout(() => setCopiedRti(false), 2500);
    }
  };

  const handleDownloadRtiTxt = () => {
    const blob = new Blob([generatedRtiNoticeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RTI_Section6_${(rtiRefCode || 'Draft').replace(/[^a-zA-Z0-9_-]/g, '')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-[#1C1917] pb-6">
        <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold mb-2">
          {t('chatKicker', language)}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
          {t('chatTitle', language)}
        </h2>
        <p className="text-sm text-[#44403C] mt-1 max-w-3xl">
          {t('chatSub', language)}
        </p>
      </div>

      {/* Role & Model Configuration Bar (No 3-card row; uses unified segmented control) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#EFE8DA] p-5 border border-[#1C1917]">
        {/* Role Persona Selector */}
        <div>
          <label htmlFor="chat-role-select" className="block text-xs font-semibold text-[#1C1917] mb-2">
            {t('selectRolePersona', language)}
          </label>
          <select
            id="chat-role-select"
            value={rolePersona}
            onChange={(e) => setRolePersona(e.target.value as any)}
            className="w-full px-3 py-2.5 bg-[#F6F1E7] border border-[#1C1917] text-sm text-[#1C1917] font-medium focus:outline-none focus:border-[#B43E1C]"
          >
            {ROLE_PERSONAS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} ({r.description})
              </option>
            ))}
          </select>
        </div>

        {/* Model & Thinking Mode Unified Segmented Strip */}
        <div>
          <span className="block text-xs font-semibold text-[#1C1917] mb-2">
            {t('selectModelReasoning', language)}
          </span>
          <div className="flex flex-col sm:flex-row border border-[#1C1917] bg-[#F6F1E7] divide-y sm:divide-y-0 sm:divide-x divide-[#1C1917]">
            {MODEL_TIERS.map((tier) => {
              const active = modelTier === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setModelTier(tier.id)}
                  className={`flex-1 px-3 py-2 text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1C1917] text-[#F6F1E7]'
                      : 'bg-[#F6F1E7] text-[#1C1917] hover:bg-[#E5DEC9]'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{tier.label}</div>
                  <div
                    className={`text-[11px] font-mono-tabular truncate ${
                      active ? 'text-[#D6CEBE]' : 'text-[#57534E]'
                    }`}
                  >
                    {tier.modelName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[#57534E] mr-1">{t('askOneTap', language)}</span>
        {QUICK_PROMPTS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q)}
            className="px-3 py-1.5 text-xs font-medium bg-[#EFE8DA] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#D4CBB4] transition-colors cursor-pointer text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Scrollable Multi-Turn Conversation Thread (No pure white backgrounds) */}
      <div className="bg-[#EFE8DA] border border-[#1C1917] overflow-hidden flex flex-col h-[540px]">
        <div
          role="log"
          aria-label="JanSahayak Conversation History"
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 border border-[#1C1917] flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-[#B43E1C] text-[#F6F1E7]'
                      : 'bg-[#1C1917] text-[#F6F1E7]'
                  }`}
                >
                  {isUser ? <CitizenPortraitIcon className="w-4 h-4" /> : <SahayakEmblemIcon className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-2xl p-4 border ${
                    isUser
                      ? 'bg-[#1C1917] text-[#F6F1E7] border-[#1C1917]'
                      : 'bg-[#F6F1E7] text-[#1C1917] border-[#1C1917]'
                  }`}
                >
                  <div
                    className={`text-xs mb-1.5 flex items-center gap-2 ${
                      isUser ? 'text-[#D6CEBE]' : 'text-[#57534E]'
                    }`}
                  >
                    <span className="font-semibold">
                      {isUser ? 'Citizen' : 'JanSahayak AI'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{msg.modelUsed}</span>
                      </>
                    )}
                  </div>

                  {msg.imagePreview && (
                    msg.imagePreview.startsWith('data:application/pdf') ? (
                      <div className="flex items-center gap-2.5 p-2 bg-[#EFE8DA] border border-[#D4CBB4] mb-2.5 max-w-sm">
                        <span className="w-7 h-7 bg-[#B43E1C] text-[#F6F1E7] flex items-center justify-center font-bold text-xs shrink-0">PDF</span>
                        <span className="text-xs font-semibold text-[#1C1917] truncate">Attached Document (PDF)</span>
                      </div>
                    ) : (
                      <img
                        src={msg.imagePreview}
                        alt="Uploaded document in chat"
                        referrerPolicy="no-referrer"
                        className="w-48 h-28 object-cover border border-[#D4CBB4] mb-2.5"
                      />
                    )
                  )}

                  <div className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</div>

                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-[#D4CBB4] flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleToggleMessageSpeech(msg.id, msg.text)}
                        className="text-xs font-semibold text-[#14532D] hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        {speakingMsgId === msg.id ? (
                          <>
                            <AcousticMuteIcon className="w-3.5 h-3.5" />
                            <span>{t('stopVoice', language)}</span>
                          </>
                        ) : (
                          <>
                            <AcousticHornIcon className="w-3.5 h-3.5" />
                            <span>{t('listenVoice', language)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Architectural Skeleton Loader for Active Reasoning */}
          {isSending && (
            <div aria-live="polite" aria-busy="true" className="flex items-start gap-3.5">
              <div className="w-8 h-8 border border-[#1C1917] bg-[#1C1917] text-[#F6F1E7] flex items-center justify-center shrink-0">
                <SahayakEmblemIcon className="w-4 h-4" />
              </div>
              <div className="w-full max-w-xl p-4 bg-[#F6F1E7] border border-[#1C1917] space-y-2.5">
                <div className="h-3 w-48 skeleton-block" />
                <div className="h-4 w-full skeleton-block" />
                <div className="h-4 w-5/6 skeleton-block" />
                <div className="h-4 w-3/4 skeleton-block" />
              </div>
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Input Composer with Photo Upload & Voice Dictation (Zero bg-white) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-[#F6F1E7] border-t border-[#1C1917] space-y-3"
        >
          {uploadError && (
            <p role="alert" className="text-xs font-semibold text-[#9A3412] bg-[#EFE8DA] p-2 border border-[#9A3412]">
              {uploadError}
            </p>
          )}
          {voiceStatusNote && (
            <p role="status" className="text-xs font-medium text-[#78350F] bg-[#EFE8DA] p-2 border border-[#D4CBB4]">
              {voiceStatusNote}
            </p>
          )}
          {attachedImage && (
            <div className="flex items-center justify-between bg-[#EFE8DA] px-3 py-2 border border-[#D4CBB4] text-xs">
              <div className="flex items-center gap-2">
                {attachedMime === 'application/pdf' || attachedImage.startsWith('data:application/pdf') ? (
                  <div className="w-8 h-8 bg-[#B43E1C] text-[#F6F1E7] flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                ) : (
                  <img
                    src={attachedImage}
                    alt="Chat attachment preview"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover border border-[#D4CBB4]"
                  />
                )}
                <span className="font-semibold text-[#1C1917]">
                  {attachedFileName || (attachedMime === 'application/pdf' ? 'PDF Document attached' : 'Photo attached')} (Analyzed with Gemini Flash)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setAttachedFileName(null);
                  setAttachedExtractedText(null);
                }}
                className="text-[#B43E1C] font-semibold hover:underline cursor-pointer"
              >
                {t('removeDocument', language)}
              </button>
            </div>
          )}

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <label
              htmlFor="chat-photo-upload"
              className="px-3 py-2.5 bg-[#EFE8DA] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#1C1917] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <DocumentScanIcon className="w-4 h-4 text-[#B43E1C]" />
              <span>{t('uploadChatPhoto', language)}</span>
              <input
                id="chat-photo-upload"
                type="file"
                accept="image/*,application/pdf,.pdf"
                onChange={handlePhotoUpload}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={handleAttachSamplePhoto}
              className="px-3 py-2.5 bg-[#EFE8DA] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#1C1917] text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <DocumentScanIcon className="w-4 h-4 text-[#14532D]" />
              <span>{t('sampleSlipPhoto', language)}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleVoiceDictation}
              className={`px-3 py-2.5 border text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                isListeningMic
                  ? 'bg-[#B43E1C] text-[#F6F1E7] border-[#1C1917]'
                  : 'bg-[#EFE8DA] hover:bg-[#E5DEC9] text-[#1C1917] border-[#1C1917]'
              }`}
            >
              <VoiceMicIcon className="w-4 h-4" />
              <span>{isListeningMic ? t('listening', language) : t('voiceInput', language)}</span>
            </button>

            <label htmlFor="chat-message-input" className="sr-only">
              Type your question for JanSahayak
            </label>
            <input
              id="chat-message-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chatPlaceholder', language)}
              className="flex-1 px-4 py-2.5 bg-[#EFE8DA] border border-[#1C1917] text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
            />

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !attachedImage && !attachedExtractedText)}
              className="px-5 py-2.5 bg-[#B43E1C] hover:bg-[#9A3412] disabled:opacity-60 text-[#F6F1E7] border border-[#1C1917] text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <EditorialQuillIcon className="w-4 h-4" />
              <span>{t('sendMessage', language)}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Statutory Section 6(1) Right to Information (RTI) Application Generator */}
      <section
        aria-labelledby="rti-generator-heading"
        className="border-t border-[#1C1917] pt-8 space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold mb-1">
              Statutory Remedy Builder · Right to Information Act, 2005
            </p>
            <h3 id="rti-generator-heading" className="text-xl sm:text-2xl font-bold text-[#1C1917]">
              {t('rtiHeading', language)}
            </h3>
            <p className="text-sm text-[#44403C] mt-1 max-w-2xl">
              {t('rtiSub', language)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* RTI Inputs */}
          <div className="lg:col-span-5 bg-[#EFE8DA] p-5 border border-[#1C1917] space-y-4">
            <div>
              <label htmlFor="rti-applicant-name" className="block text-xs font-semibold text-[#1C1917] mb-1">
                {t('applicantName', language)}
              </label>
              <input
                id="rti-applicant-name"
                type="text"
                value={rtiApplicantName}
                onChange={(e) => setRtiApplicantName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] text-sm text-[#1C1917]"
              />
            </div>

            <div>
              <label htmlFor="rti-dept-select" className="block text-xs font-semibold text-[#1C1917] mb-1">
                {t('targetDept', language)}
              </label>
              <select
                id="rti-dept-select"
                value={rtiDepartment}
                onChange={(e) => setRtiDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] text-sm text-[#1C1917]"
              >
                <option value="Food & Civil Supplies Department (NFSA Ration)">
                  Food & Civil Supplies Department (NFSA Ration)
                </option>
                <option value="Department of Agriculture & Farmers Welfare (PM-KISAN)">
                  Department of Agriculture & Farmers Welfare (PM-KISAN)
                </option>
                <option value="Municipal Town Vending Committee (PM SVANidhi)">
                  Municipal Town Vending Committee (PM SVANidhi)
                </option>
                <option value="National Health Authority (Ayushman Bharat PM-JAY)">
                  National Health Authority (Ayushman Bharat PM-JAY)
                </option>
                <option value="Social Welfare & Pension Directorate">
                  Social Welfare & Pension Directorate
                </option>
              </select>
            </div>

            <div>
              <label htmlFor="rti-ref-code" className="block text-xs font-semibold text-[#1C1917] mb-1">
                {t('trackingRef', language)}
              </label>
              <input
                id="rti-ref-code"
                type="text"
                value={rtiRefCode}
                onChange={(e) => setRtiRefCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] text-sm font-mono-tabular text-[#1C1917]"
              />
            </div>

            <div>
              <label htmlFor="rti-issue-desc" className="block text-xs font-semibold text-[#1C1917] mb-1">
                {t('grievanceDesc', language)}
              </label>
              <textarea
                id="rti-issue-desc"
                rows={3}
                value={rtiIssueText}
                onChange={(e) => setRtiIssueText(e.target.value)}
                className="w-full p-2.5 bg-[#F6F1E7] border border-[#D4CBB4] text-sm text-[#1C1917]"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-[#1C1917] cursor-pointer">
              <input
                type="checkbox"
                checked={rtiBplExempt}
                onChange={(e) => setRtiBplExempt(e.target.checked)}
                className="accent-[#B43E1C]"
              />
              <span>{t('bplExempt', language)}</span>
            </label>
          </div>

          {/* Generated Statutory RTI Notice */}
          <div className="lg:col-span-7 bg-[#EFE8DA] p-5 border border-[#1C1917] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D4CBB4] pb-3">
              <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#1C1917]">
                <StatutoryScaleIcon className="w-4 h-4 text-[#B43E1C]" />
                <span>HASH: {syntheticGrievanceForRti.ledgerHash}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyRti}
                  className="px-3 py-1.5 bg-[#F6F1E7] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#1C1917] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LedgerCopyIcon className="w-3.5 h-3.5" />
                  <span>{copiedRti ? t('copiedRti', language) : t('copyRti', language)}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRtiTxt}
                  className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#292524] text-[#F6F1E7] border border-[#1C1917] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LedgerDownloadIcon className="w-3.5 h-3.5" />
                  <span>{t('downloadRti', language)}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 bg-[#F6F1E7] border border-[#D4CBB4] text-xs font-mono-tabular text-[#1C1917] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[320px]">
              {generatedRtiNoticeText}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
};
