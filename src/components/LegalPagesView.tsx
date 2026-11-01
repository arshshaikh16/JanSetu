import React from 'react';
import { ArchivalSealIcon, StatutoryScaleIcon, RightChevronStampIcon } from './CivicIcons';

interface LegalPagesViewProps {
  page: 'tos' | 'privacy';
  onSwitchPage: (page: 'tos' | 'privacy') => void;
  onReturnHome: () => void;
}

export const LegalPagesView: React.FC<LegalPagesViewProps> = ({
  page,
  onSwitchPage,
  onReturnHome,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D4CBB4] pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold mb-2">
            Statutory Governance Charter & Public Commons Disclosures
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
            {page === 'tos'
              ? 'Terms of Service & Statutory Information Charter'
              : 'Privacy Policy & Zero-PII Citizen Data Protection'}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onSwitchPage('tos')}
            className={`px-3.5 py-2 text-xs font-semibold border cursor-pointer ${
              page === 'tos'
                ? 'bg-[#1C1917] text-[#F6F1E7] border-[#1C1917]'
                : 'bg-[#EFE8DA] text-[#1C1917] border-[#D4CBB4] hover:bg-[#E5DEC9]'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => onSwitchPage('privacy')}
            className={`px-3.5 py-2 text-xs font-semibold border cursor-pointer ${
              page === 'privacy'
                ? 'bg-[#1C1917] text-[#F6F1E7] border-[#1C1917]'
                : 'bg-[#EFE8DA] text-[#1C1917] border-[#D4CBB4] hover:bg-[#E5DEC9]'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={onReturnHome}
            className="px-3.5 py-2 text-xs font-semibold bg-[#B43E1C] text-[#F6F1E7] border border-[#9A3412] hover:bg-[#9A3412] cursor-pointer flex items-center gap-1.5"
          >
            <span>Return to Workspace</span>
            <RightChevronStampIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {page === 'tos' ? (
        <article className="bg-[#EFE8DA] border border-[#D4CBB4] p-6 sm:p-8 space-y-6 text-sm text-[#1C1917] leading-relaxed">
          <div className="flex items-center gap-2.5 text-xs font-mono-tabular text-[#57534E] border-b border-[#D4CBB4] pb-4">
            <StatutoryScaleIcon className="w-4 h-4 text-[#B43E1C]" />
            <span>DOCUMENT REF: JANSETU/TOS/2026-REV1</span>
            <span>·</span>
            <span>EFFECTIVE JURISDICTION: REPUBLIC OF INDIA</span>
          </div>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              01. Purpose and Public Information Scope
            </h3>
            <p className="text-[#44403C]">
              JanSetu operates as a public-interest digital governance commons designed to translate published government notifications, central and state welfare scheme guidelines, and statutory provisions into plain language and regional speech. All eligibility calculations are anchored to publicly notified guidelines including PM-KISAN, PM SVANidhi, Ayushman Bharat PM-JAY, e-Shram, Lakhpati Didi / PM Vishwakarma, National Scholarship Portal (NSP 2.0), the National Food Security Act (2013), and the Right to Information Act (2005).
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              02. Zero-Fee Mandate and Anti-Middleman Protection
            </h3>
            <p className="text-[#44403C]">
              JanSetu is completely free for citizens, Common Service Centre (CSC) volunteers, ASHA workers, and legal aid clinics. Official registration on central and state Direct Benefit Transfer (.gov.in) portals carries a statutory fee of ₹0. Users are expressly advised never to pay bribes, commissions, or unofficial processing charges to middlemen or touts.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              03. Non-Substitute for Formal Judicial Representation
            </h3>
            <p className="text-[#44403C]">
              While JanSetu provides automated translations of administrative circulars and drafts Section 6(1) and Section 19(1) Right to Information notices, outputs are generated for citizen empowerment and administrative literacy. For contested litigation before High Courts or Tribunals, citizens may present these statutory drafts to their District Legal Services Authority (DLSA) under Section 12 of the Legal Services Authorities Act, 1987 for free formal representation.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              04. Fact-Checking and Grounding Verification Standards
            </h3>
            <p className="text-[#44403C]">
              The SatyaShield verification engine combines deterministic phishing heuristics with live Google Search Grounding and MediaWiki statutory lookups. Users must verify final scheme applications exclusively on official .gov.in or .nic.in domains and should never click shortened links (.xyz, .top, bit.ly) received via messaging forwards.
            </p>
          </section>
        </article>
      ) : (
        <article className="bg-[#EFE8DA] border border-[#D4CBB4] p-6 sm:p-8 space-y-6 text-sm text-[#1C1917] leading-relaxed">
          <div className="flex items-center gap-2.5 text-xs font-mono-tabular text-[#57534E] border-b border-[#D4CBB4] pb-4">
            <ArchivalSealIcon className="w-4 h-4 text-[#14532D]" />
            <span>DOCUMENT REF: JANSETU/PRIVACY/DPDP-2026</span>
            <span>·</span>
            <span>ZERO PERSISTENT PII STORAGE ARCHITECTURE</span>
          </div>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              01. Stateless Ephemeral Processing of Citizen Documents
            </h3>
            <p className="text-[#44403C]">
              Citizens frequently scan sensitive notices such as land records (Khasra/Khatauni), ration slips, or hospital bills. JanSetu processes uploaded images and text strictly in ephemeral server RAM during the active inference request to Gemini Flash. Uploaded document photos are never written to disk, stored in an external database, or retained after the HTTP response completes.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              02. Strict Prohibition on Aadhaar, Bank PIN, and OTP Collection
            </h3>
            <p className="text-[#44403C]">
              To protect last-mile citizens against identity theft and financial fraud, JanSetu never requests 12-digit Aadhaar numbers, bank account numbers, UPI PINs, or mobile One-Time Passwords (OTPs). Household demographic sliders (occupation, age, and approximate annual family income) remain in local browser memory for the active session only.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              03. Client-Side Image Sanitization and Bandwidth Protection
            </h3>
            <p className="text-[#44403C]">
              When a user selects a camera photo for multimodal translation or scam auditing, the file is validated and proportionally downscaled inside the user&apos;s browser using an offscreen HTML5 canvas (capped at 1200px JPEG). This strips unnecessary camera EXIF metadata and minimizes mobile data usage before transmission.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-[#1C1917]">
              04. Server-Side Credential Isolation and DPDP Act Alignment
            </h3>
            <p className="text-[#44403C]">
              All AI model calls execute through server-side proxy routes (/api/civic/*) so API keys are never exposed to the client browser. In accordance with data minimization principles under the Digital Personal Data Protection (DPDP) Act, 2023, closing or refreshing the browser tab immediately clears all session state.
            </p>
          </section>
        </article>
      )}
    </div>
  );
};
