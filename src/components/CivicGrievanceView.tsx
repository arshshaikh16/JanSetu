import React, { useState } from 'react';
import {
  Camera,
  AlertTriangle,
  FileText,
  CheckCircle2,
  CloudRain,
  Wind,
  Thermometer,
  Upload,
  Scale,
  Copy,
  Check,
} from 'lucide-react';
import {
  CivicGrievanceRecord,
  generateRTIDraft,
  IssueCategory,
} from '../utils/civicLogic';
import { createSampleDocumentImageBase64 } from '../utils/speechHelper';

export interface LivePulseData {
  environment: {
    city: string;
    state: string;
    wardExample: string;
    coordinates: { lat: number; lon: number };
    temperatureC: number;
    precipitationMm: number;
    windSpeedKmh: number;
    aqi: number;
    pm25: number;
    pm10: number;
    fetchedAt: string;
    source: string;
  };
  macroIndicators: {
    code: string;
    label: string;
    value: number;
    unit: string;
    year: string;
    source: string;
  }[];
  cities: string[];
}

interface CivicGrievanceViewProps {
  livePulse: LivePulseData | null;
  selectedCity: string;
  onSelectCity: (city: string) => void;
  grievances: CivicGrievanceRecord[];
  citizenName: string;
  onGrievanceCreated: (record: CivicGrievanceRecord) => void;
  onGrievanceStatusUpdated: (updated: CivicGrievanceRecord) => void;
}

const ISSUE_CATEGORIES: {
  id: IssueCategory;
  label: string;
  simpleHint: string;
}[] = [
  {
    id: 'open_live_wire',
    label: 'Sparking Wire / Transformer Hazard',
    simpleHint: '4-hour emergency SLA · Electricity Board',
  },
  {
    id: 'water_contamination',
    label: 'Dirty Tap Water / Burst Pipeline',
    simpleHint: '4–12h priority SLA · Municipal Jal Board',
  },
  {
    id: 'road_cave_in',
    label: 'Deep Road Pothole / Open Manhole',
    simpleHint: '12–24h safety SLA · Public Works Dept (PWD)',
  },
  {
    id: 'sewage_overflow',
    label: 'Waterlogging / Blocked Storm Drain',
    simpleHint: '12–24h sanitation SLA · Storm Drainage Wing',
  },
  {
    id: 'hospital_supply_shortage',
    label: 'Govt Hospital Medicine / Test Shortage',
    simpleHint: '12h health charter SLA · Chief Medical Officer',
  },
  {
    id: 'garbage_dump',
    label: 'Overflowing Garbage / Open Waste Burning',
    simpleHint: '24–72h Swachhata SLA · Ward Supervisor',
  },
  {
    id: 'street_light_outage',
    label: 'Dark Street / Broken Public Lamp Post',
    simpleHint: '48–72h safety SLA · Street Lighting Cell',
  },
];

export const CivicGrievanceView: React.FC<CivicGrievanceViewProps> = ({
  livePulse,
  selectedCity,
  onSelectCity,
  grievances,
  citizenName,
  onGrievanceCreated,
  onGrievanceStatusUpdated,
}) => {
  const [category, setCategory] = useState<IssueCategory>('road_cave_in');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [ward, setWard] = useState<string>('');
  const [nearSchoolOrHospital, setNearSchoolOrHospital] = useState<boolean>(true);
  const [affectedHouseholds, setAffectedHouseholds] = useState<number>(60);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeRtiGrievance, setActiveRtiGrievance] = useState<CivicGrievanceRecord | null>(null);
  const [copiedRti, setCopiedRti] = useState<boolean>(false);
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadFieldSample = () => {
    const sampleTitle = 'Collapsed Culvert & Exposed Rebar Near Primary School Gate';
    const sampleDesc =
      'Heavy rain washed out a 4-foot section of the main culvert road outside the municipal school, leaving an unbarricaded drop and waterlogging.';
    setCategory('road_cave_in');
    setTitle(sampleTitle);
    setDescription(sampleDesc);
    setWard(livePulse?.environment.wardExample || 'Ward 44 - Karol Bagh');
    setNearSchoolOrHospital(true);
    setAffectedHouseholds(110);
    const sampleImg = createSampleDocumentImageBase64(
      'FIELD INSPECTION PHOTO: CULVERT SUBSIDENCE',
      `${sampleTitle}. Location: ${selectedCity} (${livePulse?.environment.wardExample || 'Municipal Ward'}). Verified structural road cave-in requiring immediate PWD barricade and cold-mix patching.`,
      'FIELD-CAM-2026-99'
    );
    if (sampleImg) {
      setImagePreview(sampleImg);
      setImageMime('image/png');
    }
    setFormError(null);
  };

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError('Please enter a short issue title and description before submitting.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/civic/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          city: selectedCity,
          ward: ward.trim() || livePulse?.environment.wardExample || 'Central Ward',
          nearSchoolOrHospital,
          affectedHouseholdsEstimate: affectedHouseholds,
          imageBase64: imagePreview || undefined,
          imageMimeType: imagePreview ? imageMime : undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit grievance');
      }
      const data = await res.json();
      onGrievanceCreated(data.grievance);
      setTitle('');
      setDescription('');
      setImagePreview(null);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (g: CivicGrievanceRecord, status: CivicGrievanceRecord['status']) => {
    try {
      const res = await fetch(`/api/civic/grievance/${g.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        onGrievanceStatusUpdated(data.grievance);
      }
    } catch {
      // ignore
    }
  };

  const filteredGrievances = grievances.filter((g) => {
    if (filterPriority === 'ALL') return true;
    return g.priorityLevel === filterPriority;
  });

  const rtiText = activeRtiGrievance ? generateRTIDraft(activeRtiGrievance, citizenName) : '';

  const handleCopyRti = () => {
    if (!rtiText) return;
    navigator.clipboard?.writeText(rtiText);
    setCopiedRti(true);
    setTimeout(() => setCopiedRti(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Live Real-Time Open-Meteo & World Bank Civic Infrastructure Stress Ribbon */}
      <section
        aria-label="Live Municipal Weather and Air Quality Telemetry"
        className="bg-[#1C1917] text-[#F6F1E7] p-6 rounded-xl border border-[#292524]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#292524]">
          <div>
            <div className="text-xs text-[#D6CEBE] flex flex-wrap items-center gap-2">
              <span>LIVE ENVIRONMENTAL & INFRASTRUCTURE CORRELATION</span>
              <span aria-hidden="true">·</span>
              <span>{livePulse?.environment.source || 'Open-Meteo Live API'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              {selectedCity} Municipal Hazard & SLA Triage Matrix
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="city-selector" className="text-xs text-[#D6CEBE] font-medium whitespace-nowrap">
              Active Municipality:
            </label>
            <select
              id="city-selector"
              value={selectedCity}
              onChange={(e) => onSelectCity(e.target.value)}
              className="px-3 py-2 bg-[#292524] text-[#F6F1E7] border border-[#44403C] rounded-lg text-xs font-semibold focus:outline-none focus:border-[#B43E1C]"
            >
              {(livePulse?.cities || ['New Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Patna', 'Guwahati']).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* 4-Column Live Telemetry Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-5">
          <div>
            <div className="text-xs text-[#D6CEBE] flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-[#B43E1C]" aria-hidden="true" />
              <span>Ambient Temperature</span>
            </div>
            <div className="text-2xl font-mono-tabular font-bold mt-1">
              {livePulse ? `${livePulse.environment.temperatureC.toFixed(1)}°C` : '29.8°C'}
            </div>
            <div className="text-xs text-[#A8A29E] mt-0.5">
              Coords: {livePulse ? `${livePulse.environment.coordinates.lat.toFixed(2)}°N, ${livePulse.environment.coordinates.lon.toFixed(2)}°E` : '28.61°N, 77.21°E'}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#D6CEBE] flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-[#B43E1C]" aria-hidden="true" />
              <span>Live Precipitation / Flood Stress</span>
            </div>
            <div className="text-2xl font-mono-tabular font-bold mt-1">
              {livePulse ? `${livePulse.environment.precipitationMm.toFixed(1)} mm` : '0.0 mm'}
            </div>
            <div className="text-xs text-[#A8A29E] mt-0.5">
              Auto-boosts live wire & drain SLA priority
            </div>
          </div>

          <div>
            <div className="text-xs text-[#D6CEBE] flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#B43E1C]" aria-hidden="true" />
              <span>Live Air Quality (US AQI / PM2.5)</span>
            </div>
            <div className="text-2xl font-mono-tabular font-bold mt-1">
              AQI {livePulse ? livePulse.environment.aqi : 118}{' '}
              <span className="text-xs font-normal text-[#D6CEBE]">
                ({livePulse ? livePulse.environment.pm25.toFixed(1) : '42.0'} µg/m³)
              </span>
            </div>
            <div className="text-xs text-[#A8A29E] mt-0.5">
              Correlates dust & waste burning urgency
            </div>
          </div>

          <div>
            <div className="text-xs text-[#D6CEBE]">
              World Bank Live IND Macro Benchmark
            </div>
            <div className="text-2xl font-mono-tabular font-bold mt-1">
              {livePulse?.macroIndicators?.[0]
                ? `${livePulse.macroIndicators[0].value}%`
                : '99.2%'}
            </div>
            <div className="text-xs text-[#A8A29E] mt-0.5 truncate">
              {livePulse?.macroIndicators?.[0]?.label || 'Rural Grid Electrification (World Bank API)'}
            </div>
          </div>
        </div>
      </section>

      {/* Main Split: Left = Snap & Fix Grievance Form | Right = Live Public Accountability Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Report a Civic Issue */}
        <section
          aria-labelledby="report-issue-heading"
          className="lg:col-span-5 bg-[#EFE8DA] p-6 rounded-xl border border-[#D4CBB4]"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold">
                Multimodal Field Triage
              </p>
              <h3 id="report-issue-heading" className="text-xl font-bold text-[#1C1917]">
                Snap & Log a Local Civic Issue
              </h3>
            </div>
            <button
              type="button"
              onClick={handleLoadFieldSample}
              className="px-3 py-1.5 text-xs font-semibold bg-[#F6F1E7] hover:bg-[#E5DEC9] text-[#1C1917] border border-[#D4CBB4] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Load Sample Hazard Photo
            </button>
          </div>

          <form onSubmit={handleSubmitGrievance} className="space-y-4">
            <div>
              <label htmlFor="grievance-category" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                1. What Type of Problem Is It?
              </label>
              <select
                id="grievance-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as IssueCategory)}
                className="w-full px-3 py-2.5 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm text-[#1C1917] font-medium focus:outline-none focus:border-[#B43E1C]"
              >
                {ISSUE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.simpleHint})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="grievance-title" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                2. Short Summary Title
              </label>
              <input
                id="grievance-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Open manhole near primary school gate"
                className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="grievance-ward" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  3. Ward / Landmark
                </label>
                <input
                  id="grievance-ward"
                  type="text"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder={livePulse?.environment.wardExample || 'Ward 44 - Main Market'}
                  className="w-full px-3 py-2 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
                />
              </div>

              <div>
                <label htmlFor="grievance-households" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                  Affected Families: <span className="font-mono-tabular font-bold">{affectedHouseholds}</span>
                </label>
                <input
                  id="grievance-households"
                  type="range"
                  min={5}
                  max={250}
                  step={5}
                  value={affectedHouseholds}
                  onChange={(e) => setAffectedHouseholds(Number(e.target.value))}
                  className="w-full accent-[#B43E1C] cursor-pointer mt-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="grievance-description" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                4. Describe What You See
              </label>
              <textarea
                id="grievance-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the hazard, how long it has been there, and if children or elderly are at risk..."
                className="w-full p-3 bg-[#F6F1E7] border border-[#D4CBB4] rounded-lg text-sm text-[#1C1917] focus:outline-none focus:border-[#B43E1C]"
              />
            </div>

            <div className="flex items-center gap-2.5 bg-[#F6F1E7] p-3 rounded-lg border border-[#D4CBB4]">
              <input
                id="school-hospital-checkbox"
                type="checkbox"
                checked={nearSchoolOrHospital}
                onChange={(e) => setNearSchoolOrHospital(e.target.checked)}
                className="w-4 h-4 accent-[#B43E1C] cursor-pointer"
              />
              <label htmlFor="school-hospital-checkbox" className="text-xs font-medium text-[#1C1917] cursor-pointer">
                Located near a School, Anganwadi, or Hospital (Triggers higher statutory SLA priority)
              </label>
            </div>

            <div>
              <label htmlFor="hazard-photo-upload" className="block text-xs font-semibold text-[#1C1917] mb-1.5">
                5. Attach Photo Evidence (Analyzed by Gemini 4 Argon Vision)
              </label>
              <label
                htmlFor="hazard-photo-upload"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-[#78350F] rounded-lg bg-[#F6F1E7] hover:bg-[#E5DEC9]/60 cursor-pointer text-xs font-semibold text-[#1C1917] transition-colors"
              >
                <Upload className="w-4 h-4 text-[#B43E1C]" aria-hidden="true" />
                <span>Upload Field Photo (Optional)</span>
                <input
                  id="hazard-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {imagePreview && (
              <div className="p-2.5 bg-[#F6F1E7] rounded-lg border border-[#D4CBB4]">
                <div className="flex items-center justify-between text-xs text-[#57534E] mb-1.5">
                  <span>Attached Field Evidence</span>
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="text-[#B43E1C] font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <img
                  src={imagePreview}
                  alt="Civic hazard upload preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-32 object-cover rounded border border-[#D4CBB4]"
                />
              </div>
            )}

            {formError && (
              <p role="alert" className="text-xs font-semibold text-[#9A3412]">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-5 bg-[#B43E1C] hover:bg-[#9A3412] disabled:opacity-60 text-[#F6F1E7] font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" aria-hidden="true" />
              <span>
                {isSubmitting
                  ? 'Evaluating Severity & SLA with Gemini 4 Argon...'
                  : 'Submit & Log on Public Accountability Ledger'}
              </span>
            </button>
          </form>
        </section>

        {/* RIGHT COLUMN: Public Accountability Ledger & RTI Escalation */}
        <section aria-labelledby="ledger-heading" className="lg:col-span-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4CBB4] pb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#78350F] font-semibold">
                Transparent Statutory Dispatch Queue
              </p>
              <h3 id="ledger-heading" className="text-xl font-bold text-[#1C1917]">
                Public Accountability Ledger ({filteredGrievances.length} Active Cases)
              </h3>
            </div>

            {/* Interactive Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#EFE8DA] border border-[#D4CBB4] rounded-lg shrink-0">
              {(['ALL', 'CRITICAL', 'HIGH'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setFilterPriority(tier)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    filterPriority === tier
                      ? 'bg-[#1C1917] text-[#F6F1E7]'
                      : 'text-[#44403C] hover:text-[#1C1917]'
                  }`}
                >
                  {tier === 'ALL' ? 'All Cases' : `${tier} Only`}
                </button>
              ))}
            </div>
          </div>

          {/* RTI Application Generator Drawer (when selected) */}
          {activeRtiGrievance && (
            <div
              role="region"
              aria-label="Generated Right to Information Application"
              className="bg-[#1C1917] text-[#F6F1E7] p-6 rounded-xl border border-[#292524] space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-[#D6CEBE]">
                    Section 6(1) Right to Information Act, 2005 · Statutory Escalation Draft
                  </div>
                  <h4 className="text-lg font-bold mt-0.5">
                    Ready-to-File RTI Application for {activeRtiGrievance.trackingId}
                  </h4>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyRti}
                    className="px-3 py-1.5 bg-[#B43E1C] text-[#F6F1E7] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedRti ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRti ? 'Copied RTI Draft' : 'Copy RTI Application'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRtiGrievance(null)}
                    className="px-3 py-1.5 bg-[#292524] text-[#D6CEBE] hover:text-[#F6F1E7] rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-[#292524] text-[#F6F1E7] rounded-lg text-xs font-mono-tabular whitespace-pre-wrap leading-relaxed overflow-x-auto border border-[#44403C]">
                {rtiText}
              </pre>
            </div>
          )}

          {/* Grievance Cards */}
          <div className="space-y-4">
            {filteredGrievances.map((g) => {
              const isCritical = g.priorityLevel === 'CRITICAL';
              return (
                <article
                  key={g.id}
                  className="bg-[#EFE8DA] p-5 rounded-xl border border-[#D4CBB4] space-y-3"
                >
                  {/* Unboxed quiet metadata line */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`font-bold ${
                          isCritical ? 'text-[#B43E1C]' : 'text-[#1E3A8A]'
                        }`}
                      >
                        {g.priorityLevel} PRIORITY (Score {g.severityScore}/100)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular font-semibold text-[#1C1917]">
                        {g.trackingId}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {g.city} ({g.ward})
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular font-semibold text-[#14532D]">
                        Statutory SLA: {g.slaHours}h
                      </span>
                    </div>

                    <span className="font-mono-tabular text-[#57534E]">
                      Status: <strong className="text-[#1C1917]">{g.status.replace('_', ' ')}</strong>
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-[#1C1917]">{g.title}</h4>
                  <p className="text-sm text-[#292524] leading-relaxed">{g.description}</p>

                  {/* Environmental & AI Multimodal Inspection Box */}
                  <div className="bg-[#F6F1E7] p-3.5 rounded-lg border border-[#D4CBB4] text-xs space-y-1.5">
                    <div className="text-[#1C1917]">
                      <strong>Assigned Authority:</strong> {g.assignedDepartment}
                    </div>
                    <div className="text-[#44403C]">
                      <strong>Climate-Infrastructure Correlation:</strong>{' '}
                      {g.environmentalContext.multiplierNote} (Temp{' '}
                      {g.environmentalContext.temperatureC.toFixed(1)}°C · Rain{' '}
                      {g.environmentalContext.precipitationMm.toFixed(1)}mm · AQI{' '}
                      {g.environmentalContext.aqi})
                    </div>
                    {g.aiVisualAuditSummary && (
                      <div className="text-[#14532D]">
                        <strong>Multimodal Field Audit:</strong> {g.aiVisualAuditSummary}
                      </div>
                    )}
                    <div className="text-[#57534E] font-mono-tabular pt-1">
                      Ledger Proof Hash: {g.ledgerHash} · {g.statutoryActReference}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRtiGrievance(g);
                        handleUpdateStatus(g, 'ESCALATED_RTI');
                      }}
                      className="px-3.5 py-2 bg-[#1C1917] hover:bg-[#292524] text-[#F6F1E7] rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Scale className="w-3.5 h-3.5 text-[#B43E1C]" aria-hidden="true" />
                      <span>Draft Section 6(1) RTI Escalation</span>
                    </button>

                    {g.status !== 'RESOLVED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(g, 'RESOLVED')}
                        className="px-3.5 py-2 bg-[#F6F1E7] hover:bg-[#E5DEC9] text-[#14532D] border border-[#14532D]/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Verify & Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
