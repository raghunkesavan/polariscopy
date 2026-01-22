/**
 * End-to-End Calculation Tests
 * 
 * These tests simulate complete calculation flows as a user would experience them,
 * testing the full pipeline from user inputs to final outputs with realistic scenarios.
 */

import { describe, it, expect } from 'vitest';
import { BridgeFusionCalculator, solveBridgeFusion } from '../bridgeFusionCalculationEngine';
import { computeBTLLoan } from '../btlCalculationEngine';
import { LOAN_TYPES } from '../../config/constants';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createMockRateRecord(options = {}) {
  const { rate = 0.55, product = 'Standard' } = options;
  return { rate, product, min_loan: 75000, max_loan: 25000000, max_ltv: 75, min_ltv: 0, erc_1: 0, erc_2: 0 };
}

function createBTLRate(options = {}) {
  return {
    rate: options.rate || 6.5,
    min_loan: options.minLoan || 50000,
    max_loan: options.maxLoan || 5000000,
    max_ltv: options.maxLtv || 75,
    min_icr: options.minIcr || 145,
    term_months: options.termMonths || 24,
    max_rolled_months: options.maxRolledMonths || 12,
    min_rolled_months: options.minRolledMonths || 0,
    max_defer_int: options.maxDeferInt || 1.5,
    min_defer_int: options.minDeferInt || 0,
    admin_fee: options.adminFee || 500,
    exit_fee: options.exitFee || 0,
    floor_rate: options.floorRate || null,
  };
}

// ============================================================================
// BRIDGE VARIABLE E2E SCENARIOS
// ============================================================================

describe('E2E: Bridge Variable Product - Complete User Journey', () => {
  
  it('Scenario 1: Standard residential bridge loan at 70% LTV', () => {
    // User wants to borrow against a £500,000 property at 70% LTV
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      grossLoan: 350000, // 70% of £500k
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 6,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    console.log('\n=== E2E: Standard Residential Bridge at 70% LTV ===');
    console.log('Property: £500,000 | Gross: £350,000 (70% LTV)');
    console.log('Term: 12 months | Rolled: 6 months | BBR: 4.5%');
    console.log('---');
    console.log('Gross Loan: £' + result.gross?.toLocaleString());
    console.log('Net Loan: £' + result.netLoanGBP?.toLocaleString());
    console.log('Gross LTV: ' + result.grossLTV?.toFixed(2) + '%');
    console.log('LTV Bucket: ' + result.ltv);
    console.log('Monthly Coupon Rate: ' + result.fullCouponRateMonthly?.toFixed(2) + '%');
    console.log('Arrangement Fee: £' + result.arrangementFeeGBP?.toLocaleString());
    console.log('Rolled Interest: £' + result.rolledInterestGBP?.toFixed(2));
    console.log('Title Insurance: £' + result.titleInsuranceCost?.toFixed(2));

    // Validate expected outputs
    expect(result).toBeTruthy();
    expect(result.gross).toBe(350000);
    expect(result.grossLTV).toBeCloseTo(70, 1);
    expect(result.ltv).toBe(70); // LTV bucket
    expect(result.netLoanGBP).toBeLessThan(result.gross);
    expect(result.arrangementFeeGBP).toBe(7000); // 2% of £350k
    expect(result.rolledInterestGBP).toBeGreaterThan(0);
  });

  it('Scenario 2: Verifies net loan calculation from known gross', () => {
    // Test that net is correctly calculated: Net = Gross - Fees - Rolled Interest - Title Insurance
    const grossLoan = 250000;
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      grossLoan: grossLoan,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 3,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    // Calculate expected net manually
    const expectedArrangementFee = grossLoan * 0.02;
    const expectedRolledCoupon = grossLoan * 0.0055 * 3;
    const expectedRolledBBR = grossLoan * (0.045/12) * 3;
    const expectedTitleInsurance = Math.max(392, grossLoan * 0.0013 * 1.12);
    const expectedNet = grossLoan - expectedArrangementFee - expectedRolledCoupon - expectedRolledBBR - expectedTitleInsurance;

    console.log('\n=== E2E: Net Loan Calculation Verification ===');
    console.log('Gross: £' + grossLoan.toLocaleString());
    console.log('---');
    console.log('Expected Arrangement Fee: £' + expectedArrangementFee.toFixed(2));
    console.log('Actual Arrangement Fee: £' + result.arrangementFeeGBP?.toFixed(2));
    console.log('Expected Rolled Interest: £' + (expectedRolledCoupon + expectedRolledBBR).toFixed(2));
    console.log('Actual Rolled Interest: £' + result.rolledInterestGBP?.toFixed(2));
    console.log('Expected Title Insurance: £' + expectedTitleInsurance.toFixed(2));
    console.log('Actual Title Insurance: £' + result.titleInsuranceCost?.toFixed(2));
    console.log('Expected Net: £' + expectedNet.toFixed(2));
    console.log('Actual Net: £' + result.netLoanGBP?.toFixed(2));

    expect(result).toBeTruthy();
    expect(result.gross).toBe(grossLoan);
    expect(result.arrangementFeeGBP).toBeCloseTo(expectedArrangementFee, 0);
    expect(result.rolledInterestGBP).toBeCloseTo(expectedRolledCoupon + expectedRolledBBR, 0);
    expect(result.netLoanGBP).toBeCloseTo(expectedNet, 0);
    expect(result.gross).toBeGreaterThan(result.netLoanGBP);
  });

  it('Scenario 3: Second charge on property with existing mortgage', () => {
    // Property: £600,000, First charge: £300,000 (50% LTV)
    // User wants max second charge up to 70% combined
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 600000,
      grossLoan: 200000, // Requesting more than max allowed
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 6,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      isSecondCharge: true,
      firstChargeValue: 300000,
    });

    console.log('\n=== E2E: Second Charge with Existing Mortgage ===');
    console.log('Property: £600,000 | First Charge: £300,000');
    console.log('Max Combined LTV: 70% = £420,000');
    console.log('Max Second Charge: £420,000 - £300,000 = £120,000');
    console.log('---');
    console.log('Max Second Charge: £' + result.maxSecondChargeGross?.toLocaleString());
    console.log('Actual Gross (capped): £' + result.gross?.toLocaleString());
    console.log('Combined LTV: ' + result.combinedGrossLTV?.toFixed(2) + '%');
    console.log('Net Proceeds: £' + result.netLoanGBP?.toLocaleString());
    console.log('Capped: ' + result.capped);

    expect(result).toBeTruthy();
    // Max 70% combined = £420,000 total, minus £300k first = £120k max second
    expect(result.gross).toBe(120000);
    expect(result.maxSecondChargeGross).toBe(120000);
    expect(result.capped).toBe(true);
    expect(result.combinedGrossLTV).toBeCloseTo(70, 1);
  });
});

describe('E2E: Bridge Fixed Product - Complete User Journey', () => {
  
  it('Scenario 1: Fixed rate bridge for quick property flip', () => {
    // User buying at auction, needs quick fixed-rate bridge
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-fix',
      propertyValue: 300000,
      grossLoan: 225000, // 75% of £300k
      rateRecord: createMockRateRecord({ rate: 0.85 }), // Fixed rate
      isCommercial: false,
      bbrAnnual: 0, // No BBR for fixed
      rentPm: 0,
      termMonths: 6,
      rolledMonths: 6, // All rolled
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    console.log('\n=== E2E: Fixed Bridge for Property Flip ===');
    console.log('Property: £300,000 | Gross: £225,000 (75% LTV)');
    console.log('Term: 6 months | All interest rolled | Fixed rate');
    console.log('---');
    console.log('Gross Loan: £' + result.gross?.toLocaleString());
    console.log('Net Day 1: £' + result.netLoanGBP?.toLocaleString());
    console.log('Monthly Rate: ' + result.fullCouponRateMonthly?.toFixed(2) + '% (fixed)');
    console.log('Rolled Interest: £' + result.rolledInterestGBP?.toFixed(2));
    console.log('BBR Portion (should be 0): £' + result.rolledIntBBR?.toFixed(2));

    expect(result).toBeTruthy();
    expect(result.gross).toBe(225000);
    expect(result.ltv).toBe(75); // Bucket 75
    expect(result.rolledIntBBR).toBe(0); // No BBR for fixed
    expect(result.netLoanGBP).toBeLessThan(result.gross);
  });
});

describe('E2E: Fusion Product - Complete User Journey', () => {
  
  it('Scenario 1: Fusion for residential BTL refinance', () => {
    // User refinancing a £400k BTL property
    const result = BridgeFusionCalculator.solve({
      productKind: 'fusion',
      propertyValue: 400000,
      grossLoan: 300000, // 75% of £400k
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 1500,
      termMonths: 24,
      rolledMonths: 12,
      arrangementPct: 0.02,
      deferredAnnualRate: 0.01, // 1% deferred
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    console.log('\n=== E2E: Fusion Residential BTL Refinance ===');
    console.log('Property: £400,000 | Gross: £300,000 (75% LTV)');
    console.log('Rental Income: £1,500/month');
    console.log('---');
    console.log('Gross Loan: £' + result.gross?.toLocaleString());
    console.log('Net Proceeds: £' + result.netLoanGBP?.toLocaleString());
    console.log('Tier: ' + result.tier);
    console.log('ICR: ' + result.icr?.toFixed(2));
    console.log('Deferred Interest: £' + result.deferredGBP?.toFixed(2));

    expect(result).toBeTruthy();
    expect(result.gross).toBe(300000);
    expect(result.tier).toBeTruthy();
    expect(result.icr).toBeGreaterThan(0);
  });
});

// ============================================================================
// BTL E2E SCENARIOS
// ============================================================================

describe('E2E: BTL Product - Complete User Journey', () => {

  it('Scenario 1: Standard BTL purchase with good rental yield', () => {
    // User buying £400k BTL property with £2,200/month rent
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createBTLRate({ rate: 6.5, minIcr: 145 }),
      propertyValue: '400000',
      monthlyRent: '2200',
      maxLtvInput: 75,
      loanType: LOAN_TYPES.MAX_LTV,
      productType: '2yr Fix',
      productScope: 'Residential',
      tier: 1,
      selectedRange: 'specialist',
      criteria: {},
      retentionChoice: 'No',
      productFeePercent: 2,
    });

    console.log('\n=== E2E: Standard BTL Purchase ===');
    console.log('Property: £400,000 | Monthly Rent: £2,200');
    console.log('Target LTV: 75% | Min ICR: 145%');
    console.log('---');
    console.log('Gross Loan: £' + result.grossLoan?.toLocaleString());
    console.log('Net Loan: £' + result.netLoan?.toLocaleString());
    console.log('LTV: ' + (result.ltv * 100).toFixed(2) + '%');
    console.log('ICR: ' + (result.icr * 100).toFixed(2) + '%');
    console.log('Monthly Payment: £' + result.directDebit?.toFixed(2));
    console.log('Product Fee: £' + result.productFeeAmount?.toLocaleString());

    expect(result).toBeTruthy();
    expect(result.ltv).toBeLessThanOrEqual(0.75);
    expect(result.icr).toBeGreaterThanOrEqual(1.45);
    expect(result.directDebit).toBeGreaterThan(0);
  });

  it('Scenario 2: BTL refinance - user needs specific net amount', () => {
    // User needs exactly £250,000 to refinance existing mortgage
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createBTLRate({ rate: 6.5, minIcr: 125 }),
      propertyValue: '400000',
      monthlyRent: '2000',
      specificNetLoan: '250000',
      loanType: LOAN_TYPES.SPECIFIC_NET,
      productType: '2yr Fix',
      productScope: 'Residential',
      tier: 1,
      selectedRange: 'specialist',
      criteria: {},
      retentionChoice: 'No',
      productFeePercent: 2,
    });

    console.log('\n=== E2E: BTL Refinance - Specific Net ===');
    console.log('Target Net: £250,000');
    console.log('---');
    console.log('Calculated Gross: £' + result.grossLoan?.toLocaleString());
    console.log('Actual Net: £' + result.netLoan?.toLocaleString());
    console.log('Product Fee (2%): £' + result.productFeeAmount?.toLocaleString());
    console.log('ICR achieved: ' + (result.icr * 100).toFixed(2) + '%');

    expect(result).toBeTruthy();
    expect(result.netLoan).toBeGreaterThanOrEqual(245000);
    expect(result.netLoan).toBeLessThanOrEqual(255000);
    expect(result.grossLoan).toBeGreaterThan(result.netLoan);
  });

  it('Scenario 3: Low rental yield - ICR constrains loan', () => {
    // Property: £500k but only £1,000/month rent (very low)
    // ICR will limit loan below LTV max
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createBTLRate({ rate: 6.5, minIcr: 145 }),
      propertyValue: '500000',
      monthlyRent: '1000', // Very low rent
      maxLtvInput: 75,
      loanType: LOAN_TYPES.MAX_LTV,
      productType: '2yr Fix',
      productScope: 'Residential',
      tier: 1,
      selectedRange: 'specialist',
      criteria: {},
      retentionChoice: 'No',
      productFeePercent: 2,
    });

    console.log('\n=== E2E: Low Rental Yield - ICR Constraint ===');
    console.log('Property: £500,000 | Monthly Rent: £1,000 (very low)');
    console.log('Max LTV would be: £375,000');
    console.log('---');
    console.log('Actual Gross (potentially ICR limited): £' + result.grossLoan?.toLocaleString());
    console.log('ICR: ' + (result.icr * 100).toFixed(2) + '% (min 145%)');
    console.log('Actual LTV: ' + (result.ltv * 100).toFixed(2) + '%');

    expect(result).toBeTruthy();
    // ICR must be >= 145%
    expect(result.icr).toBeGreaterThanOrEqual(1.45);
    // LTV should be <= 75%
    expect(result.ltv).toBeLessThanOrEqual(0.75);
  });

  it('Scenario 4: BTL with rolled interest and deferred payments', () => {
    // User wants to roll interest and defer payments
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createBTLRate({ 
        rate: 6.5, 
        minIcr: 125,
        maxRolledMonths: 12,
        maxDeferInt: 1.5,
        termMonths: 24,
      }),
      propertyValue: '350000',
      monthlyRent: '1800',
      maxLtvInput: 75,
      loanType: LOAN_TYPES.MAX_LTV,
      productType: '2yr Fix',
      productScope: 'Residential',
      tier: 1,
      selectedRange: 'specialist',
      criteria: {},
      retentionChoice: 'No',
      productFeePercent: 2,
      manualRolled: 6,
      manualDeferred: 1.5,
    });

    console.log('\n=== E2E: BTL with Rolled & Deferred Interest ===');
    console.log('Property: £350,000 | Rent: £1,800');
    console.log('Rolled: 6 months | Deferred: 1.5%');
    console.log('---');
    console.log('Gross Loan: £' + result.grossLoan?.toLocaleString());
    console.log('Rolled Interest: £' + result.rolledInterestAmount?.toFixed(2));
    console.log('Deferred Interest: £' + result.deferredInterestAmount?.toFixed(2));
    console.log('Net Loan: £' + result.netLoan?.toLocaleString());
    console.log('Reduced Monthly: £' + result.directDebit?.toFixed(2));

    expect(result).toBeTruthy();
    expect(result.rolledMonths).toBe(6);
    expect(result.deferredCapPct).toBe(1.5);
    expect(result.rolledInterestAmount).toBeGreaterThan(0);
    expect(result.deferredInterestAmount).toBeGreaterThan(0);
    // Net should be gross minus all fees and interest
    const expectedNet = result.grossLoan - result.productFeeAmount - 
                       result.rolledInterestAmount - result.deferredInterestAmount;
    expect(result.netLoan).toBeCloseTo(expectedNet, 0);
  });

  it('Scenario 5: HMO property with higher yield', () => {
    // HMO with 8% yield
    const propertyValue = 300000;
    const annualRent = propertyValue * 0.08;
    const monthlyRent = annualRent / 12;

    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createBTLRate({ rate: 7.0, minIcr: 145 }),
      propertyValue: String(propertyValue),
      monthlyRent: String(monthlyRent),
      maxLtvInput: 75,
      loanType: LOAN_TYPES.MAX_LTV,
      productType: '2yr Fix',
      productScope: 'HMO',
      tier: 1,
      selectedRange: 'specialist',
      criteria: {},
      retentionChoice: 'No',
      productFeePercent: 2,
    });

    console.log('\n=== E2E: HMO with Higher Yield ===');
    console.log('Property: £300,000 | Yield: 8%');
    console.log('Monthly Rent: £' + monthlyRent.toFixed(2));
    console.log('---');
    console.log('Gross Loan: £' + result.grossLoan?.toLocaleString());
    console.log('ICR: ' + (result.icr * 100).toFixed(2) + '%');
    console.log('LTV achieved: ' + (result.ltv * 100).toFixed(2) + '%');

    expect(result).toBeTruthy();
    // With 8% yield, should achieve max LTV
    expect(result.ltv).toBeCloseTo(0.75, 1);
    expect(result.icr).toBeGreaterThanOrEqual(1.45);
  });
});

// ============================================================================
// CROSS-PRODUCT COMPARISON E2E
// ============================================================================

describe('E2E: Product Comparison - Same Property', () => {
  
  it('Should compare Bridge Variable vs Fixed for same scenario', () => {
    const property = 400000;
    const grossLoan = 280000; // 70% LTV

    const bridgeVar = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: property,
      grossLoan: grossLoan,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 6,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    const bridgeFix = BridgeFusionCalculator.solve({
      productKind: 'bridge-fix',
      propertyValue: property,
      grossLoan: grossLoan,
      rateRecord: createMockRateRecord({ rate: 0.85 }),
      isCommercial: false,
      bbrAnnual: 0, // No BBR for fixed
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 6,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    console.log('\n=== E2E: Bridge Variable vs Fixed Comparison ===');
    console.log('Property: £400,000 | Gross: £280,000 (70% LTV) | Term: 12mo');
    console.log('---');
    console.log('Bridge Variable (0.55% + BBR):');
    console.log('  Gross: £' + bridgeVar.gross?.toLocaleString());
    console.log('  Net: £' + bridgeVar.netLoanGBP?.toLocaleString());
    console.log('  Monthly Coupon: ' + bridgeVar.fullCouponRateMonthly?.toFixed(2) + '%');
    console.log('  Rolled Interest: £' + bridgeVar.rolledInterestGBP?.toFixed(2));
    console.log('  BBR Portion: £' + bridgeVar.rolledIntBBR?.toFixed(2));
    console.log('Bridge Fixed (0.85%):');
    console.log('  Gross: £' + bridgeFix.gross?.toLocaleString());
    console.log('  Net: £' + bridgeFix.netLoanGBP?.toLocaleString());
    console.log('  Monthly Coupon: ' + bridgeFix.fullCouponRateMonthly?.toFixed(2) + '%');
    console.log('  Rolled Interest: £' + bridgeFix.rolledInterestGBP?.toFixed(2));
    console.log('  BBR Portion: £' + bridgeFix.rolledIntBBR?.toFixed(2));

    expect(bridgeVar).toBeTruthy();
    expect(bridgeFix).toBeTruthy();
    // Both should have same gross (same request)
    expect(bridgeVar.gross).toBe(bridgeFix.gross);
    // Variable has BBR added, so rolled interest includes BBR
    expect(bridgeVar.rolledIntBBR).toBeGreaterThan(0);
    expect(bridgeFix.rolledIntBBR).toBe(0);
    // Total rolled interest: Variable includes BBR, Fixed does not
    expect(bridgeVar.rolledInterestGBP).toBeGreaterThan(bridgeFix.rolledInterestGBP);
  });
});

// ============================================================================
// EDGE CASE E2E SCENARIOS
// ============================================================================

describe('E2E: Edge Cases and Boundary Conditions', () => {
  
  it('Should handle minimum loan amount', () => {
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 100000,
      grossLoan: 75000, // Minimum loan
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 0,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    console.log('\n=== E2E: Minimum Loan Amount ===');
    console.log('Gross: £75,000 (minimum)');
    console.log('Net: £' + result.netLoanGBP?.toLocaleString());
    console.log('Title Insurance: £' + result.titleInsuranceCost?.toFixed(2));
    console.log('(Minimum title insurance is £392)');

    expect(result).toBeTruthy();
    expect(result.gross).toBe(75000);
    // Title insurance minimum is £392
    expect(result.titleInsuranceCost).toBe(392);
  });

  it('Should handle high LTV with all interest rolled', () => {
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      grossLoan: 375000, // 75% LTV
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 12, // All rolled
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    console.log('\n=== E2E: High LTV with All Interest Rolled ===');
    console.log('Property: £500,000 | Gross: £375,000 (75% LTV)');
    console.log('All 12 months interest rolled');
    console.log('---');
    console.log('Gross: £' + result.gross?.toLocaleString());
    console.log('Total Rolled Interest: £' + result.rolledInterestGBP?.toFixed(2));
    console.log('  Coupon portion: £' + result.rolledIntCoupon?.toFixed(2));
    console.log('  BBR portion: £' + result.rolledIntBBR?.toFixed(2));
    console.log('Net: £' + result.netLoanGBP?.toLocaleString());

    expect(result).toBeTruthy();
    expect(result.gross).toBe(375000);
    expect(result.ltv).toBe(75);
    expect(result.rolledInterestGBP).toBeGreaterThan(0);
    expect(result.netLoanGBP).toBeLessThan(result.gross);
  });

  it('Should handle BTL with very high rental yield', () => {
    // 12% yield - definitely not ICR constrained
    const propertyValue = 200000;
    const monthlyRent = (propertyValue * 0.12) / 12;

    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createBTLRate({ rate: 6.5, minIcr: 145 }),
      propertyValue: String(propertyValue),
      monthlyRent: String(monthlyRent),
      maxLtvInput: 75,
      loanType: LOAN_TYPES.MAX_LTV,
      productType: '2yr Fix',
      productScope: 'Residential',
      tier: 1,
      selectedRange: 'specialist',
      criteria: {},
      retentionChoice: 'No',
      productFeePercent: 2,
    });

    console.log('\n=== E2E: BTL with 12% Yield ===');
    console.log('Property: £200,000 | Yield: 12%');
    console.log('Monthly Rent: £' + monthlyRent.toFixed(2));
    console.log('---');
    console.log('Gross: £' + result.grossLoan?.toLocaleString());
    console.log('ICR: ' + (result.icr * 100).toFixed(2) + '%');
    console.log('LTV: ' + (result.ltv * 100).toFixed(2) + '%');

    expect(result).toBeTruthy();
    // With 12% yield, should definitely achieve max LTV
    expect(result.ltv).toBeCloseTo(0.75, 1);
    expect(result.icr).toBeGreaterThan(1.45);
  });
});

// ============================================================================
// FULL CALCULATION CHAIN TEST
// ============================================================================

describe('E2E: Full Calculation Chain Verification', () => {
  
  it('Should verify complete Bridge calculation chain', () => {
    // This test verifies all calculations in the chain are correct
    const propertyValue = 500000;
    const grossLoan = 350000;
    const arrangementPct = 0.02;
    const monthlyMargin = 0.0055;
    const bbrMonthly = 0.045 / 12;
    const rolledMonths = 6;

    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: propertyValue,
      grossLoan: grossLoan,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.045,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: rolledMonths,
      arrangementPct: arrangementPct,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
    });

    // Calculate expected values manually
    const expectedArrangementFee = grossLoan * arrangementPct;
    const expectedRolledCoupon = grossLoan * monthlyMargin * rolledMonths;
    const expectedRolledBBR = grossLoan * bbrMonthly * rolledMonths;
    const expectedTotalRolled = expectedRolledCoupon + expectedRolledBBR;
    const expectedTitleInsurance = Math.max(392, grossLoan * 0.0013 * 1.12);
    const expectedNet = grossLoan - expectedArrangementFee - expectedTotalRolled - expectedTitleInsurance;
    const expectedLTV = (grossLoan / propertyValue) * 100;

    console.log('\n=== E2E: Full Calculation Chain Verification ===');
    console.log('Manual Calculations vs Engine Output:');
    console.log('---');
    console.log('LTV: Expected ' + expectedLTV.toFixed(2) + '% | Actual ' + result.grossLTV?.toFixed(2) + '%');
    console.log('Arrangement Fee: Expected £' + expectedArrangementFee + ' | Actual £' + result.arrangementFeeGBP);
    console.log('Rolled Coupon: Expected £' + expectedRolledCoupon.toFixed(2) + ' | Actual £' + result.rolledIntCoupon?.toFixed(2));
    console.log('Rolled BBR: Expected £' + expectedRolledBBR.toFixed(2) + ' | Actual £' + result.rolledIntBBR?.toFixed(2));
    console.log('Total Rolled: Expected £' + expectedTotalRolled.toFixed(2) + ' | Actual £' + result.rolledInterestGBP?.toFixed(2));
    console.log('Title Insurance: Expected £' + expectedTitleInsurance.toFixed(2) + ' | Actual £' + result.titleInsuranceCost?.toFixed(2));
    console.log('Net: Expected £' + expectedNet.toFixed(2) + ' | Actual £' + result.netLoanGBP?.toFixed(2));

    expect(result.grossLTV).toBeCloseTo(expectedLTV, 1);
    expect(result.arrangementFeeGBP).toBe(expectedArrangementFee);
    expect(result.rolledIntCoupon).toBeCloseTo(expectedRolledCoupon, 0);
    expect(result.rolledIntBBR).toBeCloseTo(expectedRolledBBR, 0);
    expect(result.rolledInterestGBP).toBeCloseTo(expectedTotalRolled, 0);
    expect(result.titleInsuranceCost).toBeCloseTo(expectedTitleInsurance, 0);
    expect(result.netLoanGBP).toBeCloseTo(expectedNet, 0);
  });
});
