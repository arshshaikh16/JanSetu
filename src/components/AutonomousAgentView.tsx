import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  FileCheck,
  Play,
  ShieldCheck,
  Terminal,
  Volume2,
} from 'lucide-react';
import {
  CitizenProfile,
  REAL_GOVERNMENT_SCHEMES,
  SupportedLanguage,
} from '../utils/civicLogic';
import { speakCivicText } from '../utils/speechHelper';

export interface AutonomousReceiptItem {
  receiptId: string;
  schemeId: string;
  schemeTitle: string;
  applicantName: string;
  state: string;
  occupation: string;
  annualBenefitINR: number;
  portalUrl: string;
  submittedAt: string;
  ledgerHash: string;
  agentSteps: {
    stepNumber: number;
    action: string;
    portalFieldMapped: string;
    status: 'VERIFIED' | 'FILLED' | 'SUBMITTED';
    timestampMs: number;
  }[];
}

interface AutonomousAgentViewProps {
  profile: CitizenProfile;
  onUpdateProfile: (profile: CitizenProfile) => void;
  selectedSchemeId: string;
  onSelectSchemeId: (id: string) => void;
  receipts: AutonomousReceiptItem[];
  onReceiptCreated: (receipt: AutonomousReceiptItem) => void;
  language: SupportedLanguage;
}

export const AutonomousAgentView: React.FC<AutonomousAgentViewProps> = ({
  profile,
  onUpdateProfile,
  selectedSchemeId,
  onSelectSchemeId,
  receipts,
  onReceiptCreated,
  language,
}) => {
  const [idLast4, setIdLast4] = useState<string>('4829');
  const [isRunningAgent, setIsRunningAgent] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [latestReceipt, setLatestReceipt] = useState<AutonomousReceiptItem | null>(
    receipts[0] || null
  );
  const [agentError, setAgentError] = useState<string | null>(null);

  const selectedScheme =
    REAL_GOVERNMENT_SCHEMES.find((s) => s.id === selectedSchemeId) ||
    REAL_GOVERNMENT_SCHEMES[0];

  const handleRunAutonomousAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setAgentError('Please enter the citizen applicant name before launching the portal agent.');
      return;
    }
    setAgentError(null);
    setIsRunningAgent(true);
    setActiveStepIndex(1);

    try {
      const stepTimer1 = setTimeout(() => setActiveStepIndex(2), 350);
      const stepTimer2 = setTimeout(() => setActiveStepIndex(3), 700);

      const res = await fetch('/api/civic/autonomous-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: selectedScheme.id,
          applicantName: profile.name,
          age: profile.age,
          occupation: profile.occupation,
          annualIncomeINR: profile.annualIncomeINR,
          state: profile.state,
          idLast4,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Agent execution failed');
      }

      const data = await res.json();
      setActiveStepIndex(4);
      setLatestReceipt(data.receipt);
      onReceiptCreated(data.receipt);
    } catch (err) {
      setAgentError((err as Error).message);
    } finally {
      setIsRunningAgent(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-[#D4CBB4] pb-6">
        <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold mb-2">
          03 · Autonomous Public Service & Legacy Portal Execution Agent
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
          SevaAuto — Let Our Agent Fill Out Legacy Government Forms for You
        </h2>
        <p className="text-sm text-[#44403C] mt-1 max-w-3xl">
          Government portals often have 15+ technical fields, session timeouts, and English-only dropdowns. Confirm 4 basic details below and our autonomous agent maps your profile, validates your documents, submits the form, and returns a verifiable receipt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 4-Field Citizen Profile & Service Selector */}
        <section
          aria-labelledby="seva-form-heading"
          className="lg:col-span-5 bg-[#EFE8DA] p-6 rounded-xl border border-[#D4CBB4]"
        >
          <h3 id="seva-form-heading" className="text-lg font-bold text-[#1C1917] mb-4">
            1. Select Service & Confirm Simple Citizen Details
          </h3>

          <form onSubmit={handleRunAutonomousAgent} className="space-y-4">
            <div>
              <label htmlFor="agent-scheme-select" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Target Public Service / Welfare Scheme
              </label>
              <select
                id="agent-scheme-select"
                value={selectedScheme.id}
                onChange={(e) => onSelectSchemeId(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm text-[#1C1917] font-medium focus:outline-none focus:border-[#B43E1C]"
              >
                {REAL_GOVERNMENT_SCHEMES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.localizedTitle[language] || s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#F6F1E7] p-3.5 rounded-lg border border-[#D4CBB4] text-xs space-y-1">
              <div className="font-semibold text-[#1C1917]">
                Target Legacy Portal: <span className="font-mono-tabular text-[#1E3A8A]">{selectedScheme.applicationPortalUrl}</span>
              </div>
              <div className="text-[#44403C]">
                Documents Verified Automatically: {selectedScheme.documentsRequired.join(' · ')}
              </div>
            </div>

            <div>
              <label htmlFor="agent-applicant-name" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                Applicant Full Name (in Any Language)
              </label>
              <input
                id="agent-applicant-name"
                type="text"
                value={profile.name}
                onChange={(e) => onUpdateProfile({ ...profile, name: e.target.value })}
                placeholder="e.g., Ramesh Kumar"
                className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="agent-applicant-age" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  Age (Years)
                </label>
                <input
                  id="agent-applicant-age"
                  type="number"
                  min={1}
                  max={110}
                  value={profile.age}
                  onChange={(e) => onUpdateProfile({ ...profile, age: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm font-mono-tabular text-[#1C1917]"
                />
              </div>

              <div>
                <label htmlFor="agent-id-last4" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  Last 4 Digits of Aadhaar / ID
                </label>
                <input
                  id="agent-id-last4"
                  type="text"
                  maxLength={4}
                  value={idLast4}
                  onChange={(e) => setIdLast4(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm font-mono-tabular text-[#1C1917]"
                />
              </div>
            </div>

            {agentError && (
              <p role="alert" className="text-xs font-semibold text-[#9A3412]">
                {agentError}
              </p>
            )}

            <button
              type="submit"
              disabled={isRunningAgent}
              className="w-full py-3.5 px-5 bg-[#B43E1C] hover:bg-[#9A3412] disabled:opacity-60 text-[#F6F1E7] font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>
                {isRunningAgent
                  ? `Executing Portal Step ${activeStepIndex}/4...`
                  : 'Run Autonomous Form Agent Now'}
              </span>
            </button>
          </form>
        </section>

        {/* RIGHT COLUMN: Live Legacy Portal Execution Inspector & Receipt Vault */}
        <section
          aria-labelledby="seva-receipt-heading"
          className="lg:col-span-7 space-y-6"
        >
          {/* Active Receipt & Portal Execution Trace */}
          {latestReceipt && (
            <div className="bg-[#1C1917] text-[#F6F1E7] p-6 rounded-xl border border-[#292524] space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#292524] pb-4">
                <div>
                  <div className="text-xs text-[#D6CEBE] flex items-center gap-2">
                    <span>OFFICIAL AUTONOMOUS SUBMISSION RECEIPT</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular text-[#4ADE80]">STATUS: SUBMITTED</span>
                  </div>
                  <h3 id="seva-receipt-heading" className="text-xl font-bold mt-1">
                    {latestReceipt.schemeTitle}
                  </h3>
                  <div className="text-xs text-[#D6CEBE] mt-1 font-mono-tabular">
                    Receipt ID: {latestReceipt.receiptId} · Applicant: {latestReceipt.applicantName} ({latestReceipt.state})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    speakCivicText(
                      `Your application for ${latestReceipt.schemeTitle} has been submitted for ${latestReceipt.applicantName}. Your official tracking number is ${latestReceipt.receiptId}. Annual benefit value is ${latestReceipt.annualBenefitINR} rupees.`,
                      language
                    )
                  }
                  className="px-3.5 py-2 bg-[#14532D] text-[#F6F1E7] rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                  <span>Read Receipt Aloud</span>
                </button>
              </div>

              {/* 4-Step Autonomous Browser DOM Execution Log */}
              <div>
                <div className="text-xs uppercase tracking-wider text-[#D6CEBE] font-semibold mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#B43E1C]" aria-hidden="true" />
                  <span>Autonomous Legacy Portal DOM Execution Trace ({latestReceipt.portalUrl})</span>
                </div>
                <div className="space-y-2.5">
                  {latestReceipt.agentSteps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="bg-[#292524] p-3.5 rounded-lg border border-[#44403C] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-[#F6F1E7]">
                          0{step.stepNumber}. {step.action}
                        </div>
                        <div className="font-mono-tabular text-[#D6CEBE]">
                          DOM Mapping: {step.portalFieldMapped}
                        </div>
                      </div>
                      <div className="font-mono-tabular text-[#4ADE80] font-semibold shrink-0">
                        [{step.status} · {step.timestampMs}ms]
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Proof Footer */}
              <div className="bg-[#292524] p-4 rounded-lg border border-[#44403C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[#D6CEBE]">Tamper-Evident Ledger Hash: </span>
                  <span className="font-mono-tabular font-bold text-[#F6F1E7]">
                    {latestReceipt.ledgerHash}
                  </span>
                </div>
                <div className="font-mono-tabular font-bold text-[#4ADE80]">
                  DBT Annual Value: ₹{latestReceipt.annualBenefitINR.toLocaleString('en-IN')}/yr
                </div>
              </div>
            </div>
          )}

          {/* Historical Submitted Receipts List */}
          <div className="bg-[#EFE8DA] p-6 rounded-xl border border-[#D4CBB4]">
            <h4 className="text-base font-bold text-[#1C1917] mb-3">
              Recent Autonomous Portal Receipts ({receipts.length})
            </h4>
            <div className="space-y-3">
              {receipts.map((r) => (
                <div
                  key={r.receiptId}
                  onClick={() => setLatestReceipt(r)}
                  className="p-3.5 bg-[#F6F1E7] hover:bg-[#E5DEC9] rounded-lg border border-[#D4CBB4] flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-mono-tabular text-[#57534E]">
                      {r.receiptId} · {r.applicantName} ({r.state})
                    </div>
                    <div className="text-sm font-bold text-[#1C1917]">{r.schemeTitle}</div>
                  </div>
                  <div className="text-xs font-mono-tabular font-semibold text-[#14532D] shrink-0">
                    ₹{r.annualBenefitINR.toLocaleString('en-IN')}/yr · {r.ledgerHash.slice(0, 10)}…
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
