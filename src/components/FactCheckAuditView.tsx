import { t } from '../utils/translations';
import React, { useState } from 'react';
import { HeuristicAuditResult, SupportedLanguage } from '../utils/civicLogic';
import { createSampleDocumentImageBase64, speakCivicText } from '../utils/speechHelper';
import {
  AcousticHornIcon,
  AcousticMuteIcon,
  ArchivalSealIcon,
  DocumentScanIcon,
  ExternalPortalIcon,
  ForensicShieldIcon,
  HazardOctagonIcon,
} from './CivicIcons';

interface FactCheckResponse {
  verdict: 'VERIFIED_FACT' | 'MISLEADING_CONTEXT' | 'DOCTORED_OR_SCAM' | 'UNVERIFIED_CLAIM';
  truthScore: number;
  explanation: string;
  heuristics: HeuristicAuditResult;
  sources: { title: string; url: string }[];
  modelUsed: string;
}

const VIRAL_CLAIM_PRESETS = [
  {
    id: 'scam-forward',
    label: 'Viral WhatsApp ₹15,000 Cash Link Scam',
    claim:
      'URGENT: Forward to 10 groups immediately! Prime Minister Welfare Fund is giving free ₹15000 instant cash transfer to all citizens tonight. Click link http://pm-free-scheme.xyz to claim before midnight!',
  },
  {
    id: 'ration-rumor',
    label: 'Ration Card Cancellation Rumor',
    claim:
      'Breaking news: All ration cards not used for 2 weeks will be permanently deleted tomorrow and families will be fined ₹5,000. Share immediately on WhatsApp!',
  },
  {
    id: 'official-pmjay',
    label: 'Senior Citizen 70+ Ayushman Bharat Expansion',
    claim:
      'All senior citizens aged 70 years and above are eligible for ₹5 lakh free health coverage under Ayushman Bharat PM-JAY regardless of income by registering on https://beneficiary.nha.gov.in.',
  },
];

interface FactCheckAuditViewProps {
  language: SupportedLanguage;
}

export const FactCheckAuditView: React.FC<FactCheckAuditViewProps> = ({ language }) => {
  const [claimText, setClaimText] = useState<string>(VIRAL_CLAIM_PRESETS[0].claim);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<FactCheckResponse | null>({
    verdict: 'DOCTORED_OR_SCAM',
    truthScore: 9,
    explanation:
      'ALERT: This message triggers high-risk misinformation and phishing signatures. No government ministry distributes ₹15,000 instant cash via WhatsApp forward chains or non-.gov.in links (http://pm-free-scheme.xyz). Do not click the link or share your Aadhaar OTP.',
    heuristics: {
      suspicionScore: 98,
      flags: [
        'Contains viral chain-forwarding urgency bait ("forward to groups / last chance tonight")',
        'Promises universal instant cash/gift disbursement via unverified external link',
        'Contains lookalike or shortened URL instead of an official .gov.in / .nic.in domain',
      ],
      hasOfficialGovDomain: false,
      hasUrgencyBait: true,
      hasUnverifiedCashPromise: true,
      preliminaryVerdict: 'HIGH_RISK_SCAM_OR_RUMOR',
    },
    sources: [
      { title: 'PIB Fact Check Official Portal (Govt of India)', url: 'https://factcheck.pib.gov.in' },
      { title: 'National Portal of India: Official Directory', url: 'https://www.india.gov.in' },
    ],
    modelUsed: 'gemini-3.8-flash (Google Search Grounding)',
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSpeakingAudit, setIsSpeakingAudit] = useState<boolean>(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg(null);
    try {
      const { processUploadedImageFile } = await import('../utils/speechHelper');
      const { dataUrl, mimeType, extractedText } = await processUploadedImageFile(file);
      setImageMime(mimeType);
      setImagePreview(dataUrl);
      setUploadedFileName(file.name);
      const text = extractedText?.trim() || '';
      if (text.length > 0) {
        setClaimText(text.slice(0, 3000));
        await executeAuditRequest(text.slice(0, 3000), dataUrl, mimeType);
      } else {
        const queryText = `Document Audit: ${file.name} - Verification of official notice/circular authenticity.`;
        setClaimText(queryText);
        await executeAuditRequest(queryText, dataUrl, mimeType);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  const handleLoadSampleFakeScreenshot = () => {
    const sampleImg = createSampleDocumentImageBase64(
      'VIRAL FORWARD SCREENSHOT AUDIT',
      claimText,
      'FWD-SCAN-2026'
    );
    if (sampleImg) {
      setImagePreview(sampleImg);
      setImageMime('image/png');
      setUploadedFileName('sample_screenshot.png');
    }
  };

  const executeAuditRequest = async (textToAudit: string, imgDataUrl: string | null, imgMime: string) => {
    if (!textToAudit.trim() && !imgDataUrl) {
      setErrorMsg('Please enter a viral claim or upload a suspicious screenshot to verify.');
      return;
    }
    setErrorMsg(null);
    setIsAuditing(true);
    try {
      const res = await fetch('/api/civic/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimText: textToAudit,
          imageBase64: imgDataUrl || undefined,
          imageMimeType: imgDataUrl ? imgMime : undefined,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to run fact-check audit');
      }
      const data = (await res.json()) as FactCheckResponse;
      setAuditResult(data);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRunAudit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await executeAuditRequest(claimText, imagePreview, imageMime);
  };

  const handleToggleAuditSpeech = async () => {
    if (!auditResult) return;
    const { stopCivicSpeech } = await import('../utils/speechHelper');
    if (isSpeakingAudit) {
      stopCivicSpeech(() => setIsSpeakingAudit(false));
      return;
    }
    setIsSpeakingAudit(true);
    speakCivicText(auditResult.explanation, language, (active) => {
      if (!active) setIsSpeakingAudit(false);
    });
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-[#1C1917] pb-6">
        <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold mb-2">
          02 · Real-Time Fact-Verification, Deepfake & Phishing Audit Engine
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
          {t('factCheckHeading', language)}
        </h2>
        <p className="text-sm text-[#44403C] mt-1 max-w-3xl">
          {t('factCheckSub', language)}
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[#57534E] mr-1">{t('verifyKnownClaims', language)}</span>
        {VIRAL_CLAIM_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setClaimText(p.claim);
              executeAuditRequest(p.claim, imagePreview, imageMime);
            }}
            className="px-3 py-1.5 text-xs font-medium bg-[#EFE8DA] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#D4CBB4] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input */}
        <section
          aria-labelledby="factcheck-input-heading"
          className="lg:col-span-5 bg-[#EFE8DA] p-6 border border-[#1C1917] space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 id="factcheck-input-heading" className="text-base font-bold text-[#1C1917]">
              {t('viralClaimLabel', language)}
            </h3>
            <button
              type="button"
              onClick={handleLoadSampleFakeScreenshot}
              className="text-xs font-semibold text-[#B43E1C] hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              + Sample Screenshot
            </button>
          </div>

          <form onSubmit={handleRunAudit} className="space-y-4">
            <div>
              <label htmlFor="claim-textarea" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                {t('viralClaimLabel', language)}
              </label>
              <textarea
                id="claim-textarea"
                rows={5}
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder={t('viralClaimPlaceholder', language)}
                className="w-full p-3 bg-[#F6F1E7] border border-[#D4CBB4] text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
              />
            </div>

            <div>
              <label htmlFor="factcheck-photo-upload" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                {t('uploadSuspiciousMedia', language)}
              </label>
              <label
                htmlFor="factcheck-photo-upload"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-[#78350F] bg-[#F6F1E7] hover:bg-[#E5DEC9]/60 cursor-pointer text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <DocumentScanIcon className="w-4 h-4 text-[#B43E1C]" />
                <span>{t('selectMediaToAudit', language)}</span>
                <input
                  id="factcheck-photo-upload"
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {imagePreview && (
              <div className="p-2.5 bg-[#F6F1E7] border border-[#D4CBB4]">
                <div className="flex items-center justify-between text-xs text-[#57534E] mb-1.5">
                  <span>{t('attachedMediaReady', language)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setUploadedFileName(null);
                    }}
                    className="text-[#B43E1C] font-semibold hover:underline cursor-pointer"
                  >
                    {t('removeMedia', language)}
                  </button>
                </div>
                {imageMime === 'application/pdf' || imagePreview.startsWith('data:application/pdf') ? (
                  <div className="flex items-center gap-3 p-3 bg-[#EFE8DA] border border-[#D4CBB4]">
                    <div className="w-9 h-9 bg-[#B43E1C] text-[#F6F1E7] flex items-center justify-center font-bold text-xs shrink-0">
                      PDF
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1C1917] truncate">
                        {uploadedFileName || 'Notice Document (PDF)'}
                      </p>
                      <p className="text-[11px] text-[#57534E]">Ready for SatyaShield Forensics</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={imagePreview}
                    alt="Suspicious media preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-32 object-cover border border-[#D4CBB4]"
                  />
                )}
              </div>
            )}

            {errorMsg && (
              <p role="alert" className="text-xs font-semibold text-[#9A3412] bg-[#F6F1E7] p-2.5 border border-[#9A3412]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isAuditing}
              className="w-full py-3.5 px-5 bg-[#B43E1C] hover:bg-[#9A3412] disabled:opacity-60 text-[#F6F1E7] border border-[#1C1917] font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ForensicShieldIcon className="w-4 h-4" />
              <span>
                {isAuditing
                  ? t('auditingBtn', language)
                  : t('auditClaimBtn', language)}
              </span>
            </button>
          </form>
        </section>

        {/* Right Audit Result with Architectural Skeleton Loader */}
        <section
          aria-labelledby="factcheck-result-heading"
          className="lg:col-span-7 bg-[#EFE8DA] p-6 border border-[#1C1917] min-h-[380px] flex flex-col justify-between"
        >
          {isAuditing ? (
            <div aria-live="polite" aria-busy="true" className="space-y-5">
              <div className="border-b border-[#D4CBB4] pb-4 space-y-2">
                <div className="h-3.5 w-48 skeleton-block" />
                <div className="h-7 w-4/5 skeleton-block" />
              </div>
              <div className="p-4 bg-[#F6F1E7] border border-[#D4CBB4] space-y-2">
                <div className="h-4 w-full skeleton-block" />
                <div className="h-4 w-11/12 skeleton-block" />
                <div className="h-4 w-3/4 skeleton-block" />
              </div>
              <div className="p-4 bg-[#F6F1E7] border border-[#D4CBB4] space-y-2">
                <div className="h-3.5 w-64 skeleton-block" />
                <div className="h-3.5 w-5/6 skeleton-block" />
                <div className="h-3.5 w-4/6 skeleton-block" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-44 skeleton-block" />
                <div className="h-9 w-full skeleton-block" />
                <div className="h-9 w-full skeleton-block" />
              </div>
            </div>
          ) : auditResult ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D4CBB4] pb-4">
                <div>
                  <div className="text-xs text-[#57534E]">
                    <span>Forensic Audit Engine</span>
                    <span aria-hidden="true"> · </span>
                    <span className="font-mono-tabular">{auditResult.modelUsed}</span>
                  </div>
                  <h3
                    id="factcheck-result-heading"
                    className={`text-2xl font-bold mt-1 flex items-center gap-2 ${
                      auditResult.verdict === 'DOCTORED_OR_SCAM'
                        ? 'text-[#B43E1C]'
                        : auditResult.verdict === 'VERIFIED_FACT'
                        ? 'text-[#14532D]'
                        : 'text-[#78350F]'
                    }`}
                  >
                    {auditResult.verdict === 'DOCTORED_OR_SCAM' ? (
                      <>
                        <HazardOctagonIcon className="w-6 h-6 shrink-0" />
                        <span>{t('verdictScam', language)} ({auditResult.truthScore}/100)</span>
                      </>
                    ) : auditResult.verdict === 'VERIFIED_FACT' ? (
                      <>
                        <ForensicShieldIcon className="w-6 h-6 shrink-0" />
                        <span>{t('verdictFact', language)} ({auditResult.truthScore}/100)</span>
                      </>
                    ) : (
                      <>
                        <ArchivalSealIcon className="w-6 h-6 shrink-0" />
                        <span>{t('verdictMisleading', language)} ({auditResult.truthScore}/100)</span>
                      </>
                    )}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAuditSpeech}
                  className="px-3.5 py-2 bg-[#1C1917] text-[#F6F1E7] border border-[#1C1917] text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isSpeakingAudit ? (
                    <>
                      <AcousticMuteIcon className="w-4 h-4" />
                      <span>{t('stopAuditVoice', language)}</span>
                    </>
                  ) : (
                    <>
                      <AcousticHornIcon className="w-4 h-4 text-[#B43E1C]" />
                      <span>{t('listenAudit', language)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Plain Explanation */}
              <div className="bg-[#F6F1E7] p-4 border border-[#D4CBB4] text-sm text-[#1C1917] leading-relaxed whitespace-pre-line">
                {auditResult.explanation}
              </div>

              {/* Heuristic Pattern Breakdown */}
              <div className="bg-[#F6F1E7] p-4 border border-[#D4CBB4] space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#44403C]">
                  {t('forensicSignals', language)} ({auditResult.heuristics.suspicionScore}/100)
                </div>
                {auditResult.heuristics.flags.length > 0 ? (
                  <ul className="space-y-1 text-xs text-[#9A3412] font-medium">
                    {auditResult.heuristics.flags.map((flag, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono-tabular font-bold shrink-0">[FLAG 0{idx + 1}]</span>
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#14532D] font-medium flex items-center gap-2">
                    <span className="font-mono-tabular font-bold">[CLEAN]</span>
                    <span>No phishing shortlinks or chain-forwarding urgency bait detected.</span>
                  </p>
                )}
              </div>

              {/* Grounded Sources */}
              {auditResult.sources && auditResult.sources.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#44403C] mb-2">
                    {t('publicPortals', language)}
                  </h4>
                  <div className="space-y-1.5">
                    {auditResult.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 bg-[#F6F1E7] hover:bg-[#E5DEC9] border border-[#D4CBB4] text-xs font-medium text-[#1E3A8A] transition-colors"
                      >
                        <span className="truncate pr-3">{src.title}</span>
                        <ExternalPortalIcon className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto text-center py-12 px-4">
              <HazardOctagonIcon className="w-10 h-10 text-[#B43E1C] mx-auto mb-3" />
              <h3 id="factcheck-result-heading" className="text-lg font-bold text-[#1C1917]">
                Ready to Audit Viral Claims & Suspicious Links
              </h3>
              <p className="text-sm text-[#57534E] max-w-md mx-auto mt-1 mb-5">
                Click &ldquo;Verify Claim & Audit Credibility&rdquo; to test the loaded WhatsApp cash scam forward or paste any rumor you received.
              </p>
              <button
                type="button"
                onClick={() => handleRunAudit()}
                className="px-5 py-2.5 bg-[#1C1917] text-[#F6F1E7] text-xs font-semibold border border-[#1C1917] hover:bg-[#292524] transition-colors cursor-pointer"
              >
                Run Audit on Loaded Claim Now
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
