import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateSchemeEligibility,
  computeCivicSeverityAndSLA,
  generateRTIDraft,
  evaluateClaimCredibilityHeuristics,
  generateReceiptHash,
} from './civicLogic';

test('evaluateSchemeEligibility matches low-income farmer to PM-KISAN, Ayushman Bharat, and e-Shram', () => {
  const results = evaluateSchemeEligibility({
    name: 'Ramesh Kumar',
    age: 42,
    occupation: 'farmer',
    annualIncomeINR: 95000,
    state: 'Bihar',
    hasRationCard: true,
    hasBankAccount: true,
    isRural: true,
  });

  const eligibleIds = results.filter((r) => r.isEligible).map((r) => r.scheme.id);
  assert.ok(eligibleIds.includes('pm-kisan-samman'), 'Farmer should be eligible for PM-KISAN');
  assert.ok(eligibleIds.includes('ayushman-bharat-pmjay'), 'Farmer should be eligible for Ayushman Bharat');
  assert.ok(eligibleIds.includes('eshram-daily-worker-shield'), 'Farmer should be eligible for e-Shram');

  const pmKisan = results.find((r) => r.scheme.id === 'pm-kisan-samman');
  assert.equal(pmKisan?.matchScore, 100);
  assert.equal(pmKisan?.estimatedAnnualBenefitINR, 6000);
});

test('evaluateSchemeEligibility grants universal Ayushman Bharat coverage to seniors aged 70+ regardless of income', () => {
  const results = evaluateSchemeEligibility({
    name: 'Savitri Devi',
    age: 74,
    occupation: 'senior_citizen',
    annualIncomeINR: 650000,
    state: 'Tamil Nadu',
    hasRationCard: false,
    hasBankAccount: true,
    isRural: false,
  });

  const ayushman = results.find((r) => r.scheme.id === 'ayushman-bharat-pmjay');
  assert.ok(ayushman);
  assert.equal(ayushman.isEligible, true);
  assert.equal(ayushman.matchScore, 100);
});

test('computeCivicSeverityAndSLA escalates open live wire during active rain to CRITICAL 4-hour SLA', () => {
  const triage = computeCivicSeverityAndSLA({
    category: 'open_live_wire',
    description: 'Sparking feeder cable hanging over flooded footpath',
    precipitationMm: 8.5,
    aqi: 110,
    temperatureC: 29,
    nearSchoolOrHospital: true,
    affectedHouseholdsEstimate: 120,
  });

  assert.equal(triage.priorityLevel, 'CRITICAL');
  assert.equal(triage.slaHours, 4);
  assert.ok(triage.severityScore >= 90);
  assert.ok(triage.environmentalMultiplierReason.includes('Active precipitation'));
});

test('generateRTIDraft formats statutory Section 6(1) Right to Information notice with tracking hash', () => {
  const draft = generateRTIDraft(
    {
      id: 'g-1',
      trackingId: 'JS-DEL-2026-8841',
      title: 'Collapsed Storm Drain Near Primary School',
      description: 'Open 4-foot manhole causing waterlogging',
      category: 'road_cave_in',
      city: 'New Delhi',
      ward: 'Ward 44 - Karol Bagh',
      coordinates: { lat: 28.6519, lon: 77.1909 },
      severityScore: 88,
      priorityLevel: 'CRITICAL',
      slaHours: 4,
      assignedDepartment: 'Public Works Department (PWD)',
      statutoryActReference: 'Delhi Right of Citizens to Time Bound Delivery of Services Act',
      environmentalContext: {
        temperatureC: 31,
        precipitationMm: 6.2,
        aqi: 165,
        multiplierNote: 'Rain hazard',
      },
      status: 'LOGGED',
      createdAt: '2026-10-30T10:00:00.000Z',
      ledgerHash: '0x9F82A11C0042B8E1',
    },
    'Meena Kumari'
  );

  assert.ok(draft.includes('Under Section 6(1) of the Right to Information Act, 2005'));
  assert.ok(draft.includes('JS-DEL-2026-8841'));
  assert.ok(draft.includes('Meena Kumari'));
  assert.ok(draft.includes('Proviso to Section 7(1)'));
});

test('evaluateClaimCredibilityHeuristics flags viral WhatsApp cash scam links', () => {
  const scamResult = evaluateClaimCredibilityHeuristics(
    'URGENT: Forward to 10 groups immediately! Government giving free ₹15000 instant cash transfer to all citizens. Click link http://pm-free-scheme.xyz now!'
  );

  assert.equal(scamResult.preliminaryVerdict, 'HIGH_RISK_SCAM_OR_RUMOR');
  assert.ok(scamResult.suspicionScore >= 60);
  assert.equal(scamResult.hasUrgencyBait, true);

  const officialResult = evaluateClaimCredibilityHeuristics(
    'Farmers can complete e-KYC for PM-KISAN installment on the official portal https://pmkisan.gov.in before the deadline.'
  );
  assert.equal(officialResult.preliminaryVerdict, 'CONTAINS_OFFICIAL_REFERENCE');
  assert.equal(officialResult.hasOfficialGovDomain, true);

  const ntaResult = evaluateClaimCredibilityHeuristics(
    'National Testing Agency (NTA) Public Notice: Examination schedule announced on https://nta.ac.in and https://jeemain.nta.nic.in.'
  );
  assert.equal(ntaResult.preliminaryVerdict, 'CONTAINS_OFFICIAL_REFERENCE');
  assert.equal(ntaResult.hasOfficialGovDomain, true);
  assert.ok(ntaResult.suspicionScore <= 20);
});

test('generateReceiptHash returns deterministic 18-char hex digest', () => {
  const h1 = generateReceiptHash('JS-2026-001|Ramesh|PM-KISAN');
  const h2 = generateReceiptHash('JS-2026-001|Ramesh|PM-KISAN');
  assert.equal(h1, h2);
  assert.equal(h1.length, 18);
  assert.ok(h1.startsWith('0x'));
});
