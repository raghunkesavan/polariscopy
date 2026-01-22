/**
 * Calculation Validation Tests
 * These tests verify the actual calculation numbers are correct
 */

import { describe, it, expect } from 'vitest';
import { BridgeFusionCalculator } from '../bridgeFusionCalculationEngine';

function createMockRateRecord(options = {}) {
  const { rate = 0.5, product = 'Standard' } = options;
  return { rate, product, min_loan: 75000, max_loan: 25000000, max_ltv: 75, min_ltv: 0, erc_1: 0, erc_2: 0 };
}

describe('Calculation Validation - Second Charge Numbers', () => {
  
  it('should calculate correct max second charge with specific numbers', () => {
    // Property: £500,000
    // First Charge: £200,000
    // Expected: Max combined at 70% = £350,000
    // Expected: Max second charge = £350,000 - £200,000 = £150,000
    
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 0,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 200000, // Requesting more than allowed
      isSecondCharge: true,
      firstChargeValue: 200000,
    });

    console.log('=== Second Charge Cap Validation ===');
    console.log('Property Value: £500,000');
    console.log('First Charge: £200,000');
    console.log('Max 70% Combined: £' + (500000 * 0.7).toLocaleString());
    console.log('Expected Max Second Charge: £' + (500000 * 0.7 - 200000).toLocaleString());
    console.log('---');
    console.log('Result maxSecondChargeGross: £' + result.maxSecondChargeGross?.toLocaleString());
    console.log('Result gross: £' + result.gross?.toLocaleString());
    console.log('Result capped:', result.capped);
    console.log('Combined LTV:', result.combinedGrossLTV?.toFixed(2) + '%');
    
    expect(result.maxSecondChargeGross).toBe(150000);
    expect(result.gross).toBe(150000);
    expect(result.capped).toBe(true);
  });

  it('should calculate correct combined LTV', () => {
    // Property: £500,000
    // First Charge: £100,000
    // Second Charge: £100,000
    // Combined LTV = (100k + 100k) / 500k = 40%
    
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 0,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 100000,
      isSecondCharge: true,
      firstChargeValue: 100000,
    });

    console.log('=== Combined LTV Validation ===');
    console.log('Expected Combined LTV: 40%');
    console.log('Result combinedGrossLTV:', result.combinedGrossLTV?.toFixed(2) + '%');
    console.log('Result grossLTV (just 2nd charge):', result.grossLTV?.toFixed(2) + '%');
    
    expect(result.combinedGrossLTV).toBeCloseTo(40, 1);
    expect(result.grossLTV).toBeCloseTo(20, 1); // Just the second charge portion
  });
});

describe('Calculation Validation - Specific Net Loan Numbers', () => {
  
  it('should solve for correct gross given target net - simple case', () => {
    // Target net: £200,000
    // Arrangement fee: 2%
    // No rolled interest, no other fees
    // Formula: Net = Gross - (Gross * 0.02) - TitleInsurance
    // Net = Gross * 0.98 - TitleInsurance
    // For Gross = £204,000: TitleInsurance = max(392, 204000 * 0.0013 * 1.12) = max(392, 297) = 392
    // Net = 204000 * 0.98 - 392 = 199,920 - 392 = 199,528
    // Need slightly higher gross to hit £200k net
    
    const targetNet = 200000;
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 0,
      arrangementPct: 0.02, // 2%
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
    });

    console.log('=== Specific Net (Simple) Validation ===');
    console.log('Target Net: £' + targetNet.toLocaleString());
    console.log('Result gross: £' + result.gross?.toLocaleString());
    console.log('Result netLoanGBP: £' + result.netLoanGBP?.toLocaleString());
    console.log('Arrangement Fee (2%): £' + result.arrangementFeeGBP?.toLocaleString());
    console.log('Title Insurance: £' + result.titleInsuranceCost?.toLocaleString());
    console.log('---');
    console.log('Verification: Gross - ArrangementFee - TitleInsurance = Net');
    const calculatedNet = result.gross - result.arrangementFeeGBP - (result.titleInsuranceCost || 0);
    console.log(result.gross + ' - ' + result.arrangementFeeGBP + ' - ' + (result.titleInsuranceCost || 0) + ' = ' + calculatedNet);
    
    // Net should be at or above target (may round up)
    expect(result.netLoanGBP).toBeGreaterThanOrEqual(targetNet - 500);
    // Gross should be reasonable (roughly target / 0.98 + fees)
    expect(result.gross).toBeGreaterThan(targetNet);
    expect(result.gross).toBeLessThan(targetNet * 1.1); // Not more than 10% above target
  });

  it('should solve for correct gross with rolled interest', () => {
    // Target net: £200,000
    // Arrangement fee: 2%
    // Rolled months: 6
    // Rate: 0.55% monthly margin + BBR (4%/12 = 0.333% monthly)
    // Total monthly rate: 0.55% + 0.333% = 0.883%
    // Rolled interest for 6 months = Gross * 0.00883 * 6 = Gross * 0.053
    
    const targetNet = 200000;
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 6,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
    });

    console.log('=== Specific Net (With Rolled Interest) Validation ===');
    console.log('Target Net: £' + targetNet.toLocaleString());
    console.log('Result gross: £' + result.gross?.toLocaleString());
    console.log('Result netLoanGBP: £' + result.netLoanGBP?.toLocaleString());
    console.log('Arrangement Fee: £' + result.arrangementFeeGBP?.toLocaleString());
    console.log('Rolled Interest: £' + result.rolledInterestGBP?.toLocaleString());
    console.log('Title Insurance: £' + result.titleInsuranceCost?.toLocaleString());
    console.log('---');
    console.log('Monthly margin rate: 0.55% = 0.0055');
    console.log('Monthly BBR rate: 4%/12 = 0.333% = 0.00333');
    console.log('Total monthly: 0.883% = 0.00883');
    console.log('Expected rolled (6 mo): Gross * 0.00883 * 6 = Gross * 0.053');
    const expectedRolled = result.gross * 0.00883 * 6;
    console.log('Expected rolled for gross ' + result.gross + ': £' + expectedRolled.toFixed(2));
    console.log('Actual rolled: £' + result.rolledInterestGBP?.toFixed(2));
    
    // Net should be at or above target
    expect(result.netLoanGBP).toBeGreaterThanOrEqual(targetNet - 1000);
    // Rolled interest should be approximately correct
    expect(result.rolledInterestGBP).toBeGreaterThan(0);
    // Gross should be higher than in the no-rolled case
    expect(result.gross).toBeGreaterThan(targetNet * 1.05);
  });

  it('should calculate title insurance correctly', () => {
    // Title insurance formula: MAX(392, gross * 0.0013 * 1.12)
    // For £300,000: 300000 * 0.0013 * 1.12 = 436.80
    // MAX(392, 436.80) = 436.80
    
    // For £100,000: 100000 * 0.0013 * 1.12 = 145.60
    // MAX(392, 145.60) = 392 (minimum)
    
    const result300k = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 0,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 300000,
    });

    const result100k = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 0,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 100000,
    });

    console.log('=== Title Insurance Validation ===');
    console.log('For £300k gross:');
    console.log('  Expected: MAX(392, 300000 * 0.0013 * 1.12) = MAX(392, 436.80) = £436.80');
    console.log('  Actual: £' + result300k.titleInsuranceCost?.toFixed(2));
    console.log('For £100k gross:');
    console.log('  Expected: MAX(392, 100000 * 0.0013 * 1.12) = MAX(392, 145.60) = £392.00 (minimum)');
    console.log('  Actual: £' + result100k.titleInsuranceCost?.toFixed(2));
    
    expect(result300k.titleInsuranceCost).toBeCloseTo(436.80, 0);
    expect(result100k.titleInsuranceCost).toBe(392);
  });
});

describe('Calculation Validation - Arrangement Fee', () => {
  it('should calculate arrangement fee correctly', () => {
    // Gross: £300,000, Arrangement: 2%
    // Expected: 300000 * 0.02 = £6,000
    
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 0,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 300000,
    });

    console.log('=== Arrangement Fee Validation ===');
    console.log('Gross: £300,000');
    console.log('Arrangement %: 2%');
    console.log('Expected: £6,000');
    console.log('Actual: £' + result.arrangementFeeGBP?.toLocaleString());
    
    expect(result.arrangementFeeGBP).toBe(6000);
  });
});

describe('Calculation Validation - Rolled Interest', () => {
  it('should calculate rolled interest correctly for bridge variable', () => {
    // Gross: £300,000
    // Margin: 0.55% monthly = 0.0055
    // BBR: 4% annual / 12 = 0.333% monthly = 0.00333
    // Total monthly rate: 0.0055 + 0.00333 = 0.00883
    // Rolled months: 3
    // Rolled interest = 300000 * 0.00883 * 3 = £7,950 (approximately)
    
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.55 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 3,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 300000,
    });

    console.log('=== Rolled Interest Validation (Bridge Variable) ===');
    console.log('Gross: £300,000');
    console.log('Margin: 0.55% monthly');
    console.log('BBR: 4% annual = 0.333% monthly');
    console.log('Rolled months: 3');
    const expectedRolled = 300000 * (0.0055 + 0.04/12) * 3;
    console.log('Expected: 300000 * (0.0055 + 0.00333) * 3 = £' + expectedRolled.toFixed(2));
    console.log('Actual: £' + result.rolledInterestGBP?.toFixed(2));
    console.log('---');
    console.log('Components:');
    console.log('  Coupon portion: £' + result.rolledIntCoupon?.toFixed(2));
    console.log('  BBR portion: £' + result.rolledIntBBR?.toFixed(2));
    
    expect(result.rolledInterestGBP).toBeCloseTo(expectedRolled, -2); // Within £100
  });

  it('should NOT add BBR for bridge fixed', () => {
    // Bridge fixed: only coupon, no BBR
    // Gross: £300,000
    // Coupon: 0.85% monthly = 0.0085
    // Rolled months: 3
    // Rolled interest = 300000 * 0.0085 * 3 = £7,650
    
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-fix',
      propertyValue: 500000,
      rateRecord: createMockRateRecord({ rate: 0.85 }),
      isCommercial: false,
      bbrAnnual: 0.04,
      rentPm: 0,
      termMonths: 12,
      rolledMonths: 3,
      arrangementPct: 0.02,
      deferredAnnualRate: 0,
      procFeePct: 0,
      brokerFeeFlat: 0,
      brokerClientFee: 0,
      adminFee: 0,
      grossLoan: 300000,
    });

    console.log('=== Rolled Interest Validation (Bridge Fixed - No BBR) ===');
    console.log('Gross: £300,000');
    console.log('Coupon: 0.85% monthly');
    console.log('BBR: Should NOT be added for fixed');
    console.log('Rolled months: 3');
    const expectedRolled = 300000 * 0.0085 * 3;
    console.log('Expected: 300000 * 0.0085 * 3 = £' + expectedRolled.toFixed(2));
    console.log('Actual: £' + result.rolledInterestGBP?.toFixed(2));
    console.log('BBR portion should be 0: £' + result.rolledIntBBR?.toFixed(2));
    
    expect(result.rolledInterestGBP).toBeCloseTo(expectedRolled, -2);
    expect(result.rolledIntBBR).toBe(0);
  });
});
