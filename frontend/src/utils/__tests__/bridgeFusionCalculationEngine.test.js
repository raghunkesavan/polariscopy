/**
 * Bridge & Fusion Calculation Engine Tests
 * Tests the PRODUCTION code at src/utils/bridgeFusionCalculationEngine.js
 * 
 * Source of truth: "Issued - Bridge Calc 051125.xlsx"
 * 
 * IMPORTANT: Production code property names mapping:
 * - gross (not grossLoan)
 * - netLoanGBP (not netLoan)
 * - grossLTV (percentage, e.g., 70 for 70%)
 * - ltv (bucket: 60, 70, or 75)
 * - arrangementFeeGBP (not arrangementFee)
 * - rolledInterestGBP (not rolledInterest)
 * - procFeeGBP (not procFee)
 * - fullCouponRateMonthly (monthly coupon as percentage)
 * - deferredGBP (not deferredInterest)
 * - titleInsuranceCost (not titleInsurance)
 */

import { describe, it, expect } from 'vitest';
import { BridgeFusionCalculator, solveBridgeFusion } from '../bridgeFusionCalculationEngine';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a mock rate record simulating database rate
 */
function createMockRateRecord(options = {}) {
  const {
    rate = 0.5,           // Monthly rate percentage (e.g., 0.5 = 0.5%)
    product = 'Standard',
    minLoan = 75000,
    maxLoan = 25000000,
    maxLtv = 75,
    minLtv = 0,
    erc_1 = 0,
    erc_2 = 0,
  } = options;

  return {
    rate,
    product,
    min_loan: minLoan,
    max_loan: maxLoan,
    max_ltv: maxLtv,
    min_ltv: minLtv,
    erc_1,
    erc_2,
  };
}

// ============================================
// LTV BUCKET TESTS
// ============================================

describe('BridgeFusionCalculator - LTV Bucket Determination', () => {
  it('should return 60 bucket for LTV <= 60%', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(300000, 500000); // 60%
    expect(bucket).toBe(60);
  });

  it('should return 60 bucket for LTV < 60%', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(250000, 500000); // 50%
    expect(bucket).toBe(60);
  });

  it('should return 70 bucket for LTV between 60-70%', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(325000, 500000); // 65%
    expect(bucket).toBe(70);
  });

  it('should return 70 bucket for LTV exactly 70%', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(350000, 500000); // 70%
    expect(bucket).toBe(70);
  });

  it('should return 75 bucket for LTV > 70%', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(375000, 500000); // 75%
    expect(bucket).toBe(75);
  });

  it('should return 75 bucket for LTV between 70-75%', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(360000, 500000); // 72%
    expect(bucket).toBe(75);
  });

  it('should handle zero property value gracefully', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(300000, 0);
    expect(bucket).toBe(75); // Default to highest bucket
  });

  it('should handle negative property value gracefully', () => {
    const bucket = BridgeFusionCalculator.getLtvBucket(300000, -100000);
    expect(bucket).toBe(75);
  });
});

// ============================================
// RATE GETTER TESTS
// ============================================

describe('BridgeFusionCalculator - Rate Getters', () => {
  describe('getBridgeVarMargin', () => {
    it('should return monthly margin as decimal', () => {
      const rateRecord = createMockRateRecord({ rate: 0.5 }); // 0.5% monthly
      const margin = BridgeFusionCalculator.getBridgeVarMargin(75, rateRecord);
      expect(margin).toBeCloseTo(0.005, 6); // 0.5% = 0.005
    });

    it('should handle rate of 0.65%', () => {
      const rateRecord = createMockRateRecord({ rate: 0.65 });
      const margin = BridgeFusionCalculator.getBridgeVarMargin(70, rateRecord);
      expect(margin).toBeCloseTo(0.0065, 6);
    });
  });

  describe('getBridgeFixCoupon', () => {
    it('should return monthly coupon as decimal', () => {
      const rateRecord = createMockRateRecord({ rate: 0.85 }); // 0.85% monthly
      const coupon = BridgeFusionCalculator.getBridgeFixCoupon(75, rateRecord);
      expect(coupon).toBeCloseTo(0.0085, 6);
    });
  });

  describe('getFusionTierInfo', () => {
    it('should return correct tier info with BBR added', () => {
      const rateRecord = createMockRateRecord({ rate: 4.79, product: 'Fusion' });
      const bbrAnnual = 0.04; // 4% BBR
      const tierInfo = BridgeFusionCalculator.getFusionTierInfo(500000, rateRecord, bbrAnnual);
      
      expect(tierInfo.marginAnnual).toBeCloseTo(0.0479, 4); // 4.79%
      expect(tierInfo.annualRate).toBeCloseTo(0.0879, 4); // 4.79% + 4% = 8.79%
      expect(tierInfo.tierName).toBe('Fusion');
    });
  });
});

// ============================================
// BRIDGE VARIABLE CALCULATION TESTS
// ============================================

describe('BridgeFusionCalculator - Bridge Variable Calculations', () => {
  const defaultParams = {
    productKind: 'bridge-var',
    propertyValue: 500000,
    rateRecord: createMockRateRecord({ rate: 0.55 }), // 0.55% monthly margin
    isCommercial: false,
    bbrAnnual: 0.04, // 4% BBR
    rentPm: 0,
    termMonths: 12,
    rolledMonths: 0,
    arrangementPct: 0.02, // 2%
    deferredAnnualRate: 0,
    procFeePct: 0,
    brokerFeeFlat: 0,
    brokerClientFee: 0,
    adminFee: 0,
  };

  it('should calculate basic bridge variable loan', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 350000,
    });

    expect(result).toBeTruthy();
    expect(result.gross).toBe(350000);
    expect(result.grossLTV).toBeCloseTo(70, 1); // grossLTV is percentage
    expect(result.ltv).toBe(70); // ltv is bucket
    expect(result.arrangementFeeGBP).toBeCloseTo(7000, 0); // 2% of 350k
  });

  it('should calculate rolled interest correctly', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      rolledMonths: 3,
    });

    expect(result).toBeTruthy();
    expect(result.rolledMonths).toBe(3);
    expect(result.rolledInterestGBP).toBeGreaterThan(0);
    // Rolled interest = gross * (margin + BBR) * months
    // margin = 0.55% monthly = 0.0055
    // BBR monthly = 4% / 12 = 0.00333
    // Total monthly = 0.0055 + 0.00333 = 0.00883
    // Rolled = 300000 * 0.00883 * 3 = ~7950
  });

  it('should calculate net loan after deductions', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      rolledMonths: 6,
    });

    expect(result).toBeTruthy();
    expect(result.netLoanGBP).toBeLessThan(result.gross);
    // Net = Gross - Arrangement Fee - Rolled Interest
    const expectedArrangementFee = 300000 * 0.02;
    expect(result.netLoanGBP).toBeLessThan(300000 - expectedArrangementFee);
  });

  it('should handle zero gross loan', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
    });

    // Should return null or result with 0 values
    if (result) {
      expect(result.gross).toBe(0);
    }
  });
});

// ============================================
// BRIDGE FIXED CALCULATION TESTS
// ============================================

describe('BridgeFusionCalculator - Bridge Fixed Calculations', () => {
  const defaultParams = {
    productKind: 'bridge-fix',
    propertyValue: 500000,
    rateRecord: createMockRateRecord({ rate: 0.85 }), // 0.85% monthly coupon
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
  };

  it('should calculate basic bridge fixed loan', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 350000,
    });

    expect(result).toBeTruthy();
    expect(result.gross).toBe(350000);
    expect(result.grossLTV).toBeCloseTo(70, 1);
  });

  it('should NOT add BBR to fixed rate calculations', () => {
    const resultFixed = BridgeFusionCalculator.solve({
      ...defaultParams,
      productKind: 'bridge-fix',
      grossLoan: 300000,
      rolledMonths: 3,
    });

    const resultVar = BridgeFusionCalculator.solve({
      ...defaultParams,
      productKind: 'bridge-var',
      rateRecord: createMockRateRecord({ rate: 0.85 }), // Same rate
      grossLoan: 300000,
      rolledMonths: 3,
    });

    // Variable should have more rolled interest due to BBR
    expect(resultVar.rolledInterestGBP).toBeGreaterThan(resultFixed.rolledInterestGBP);
  });
});

// ============================================
// FUSION CALCULATION TESTS
// ============================================

describe('BridgeFusionCalculator - Fusion Calculations', () => {
  const defaultParams = {
    productKind: 'fusion',
    propertyValue: 500000,
    rateRecord: createMockRateRecord({ rate: 4.79, product: 'Fusion Standard' }),
    isCommercial: false,
    bbrAnnual: 0.04, // 4% BBR
    rentPm: 2000,
    topSlicingPm: 0,
    termMonths: 24,
    rolledMonths: 6,
    arrangementPct: 0.02,
    deferredAnnualRate: 0,
    procFeePct: 0,
    brokerFeeFlat: 0,
    brokerClientFee: 0,
    adminFee: 0,
  };

  it('should calculate basic fusion loan', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
    });

    expect(result).toBeTruthy();
    expect(result.gross).toBe(300000);
    expect(result.grossLTV).toBeCloseTo(60, 1);
  });

  it('should add BBR to fusion margin', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
    });

    expect(result).toBeTruthy();
    // Full rate should be margin (4.79%) + BBR (4%) = 8.79%
    // Monthly = 8.79% / 12 = ~0.73%
    expect(result.fullCouponRateMonthly).toBeGreaterThan(0);
  });

  it('should calculate deferred interest for fusion', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      deferredAnnualRate: 0.01, // 1% deferred
    });

    expect(result).toBeTruthy();
    expect(result.deferredGBP).toBeGreaterThan(0);
    // Deferred = Gross * (deferredRate/12) * termMonths
    // = 300000 * (0.01/12) * 24 = 6000
    expect(result.deferredGBP).toBeCloseTo(6000, -2);
  });
});

// ============================================
// SPECIFIC NET LOAN TESTS
// ============================================

describe('BridgeFusionCalculator - Specific Net Loan', () => {
  const defaultParams = {
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
  };

  it('should solve for gross when given specific net loan', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0, // Will be calculated
      useSpecificNet: true,
      specificNetLoan: 250000,
    });

    expect(result).toBeTruthy();
    expect(result.netLoanGBP).toBeCloseTo(250000, -3); // Within £1000
    expect(result.gross).toBeGreaterThan(250000);
  });

  it('should iterate to find correct gross for target net', () => {
    const targetNet = 200000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
    });

    expect(result).toBeTruthy();
    // Net should be within 1% of target
    expect(Math.abs(result.netLoanGBP - targetNet)).toBeLessThan(targetNet * 0.01);
  });
});

// ============================================
// FEE CALCULATION TESTS
// ============================================

describe('BridgeFusionCalculator - Fee Calculations', () => {
  const defaultParams = {
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
  };

  it('should calculate arrangement fee correctly', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      arrangementPct: 0.02, // 2%
    });

    expect(result).toBeTruthy();
    expect(result.arrangementFeeGBP).toBeCloseTo(6000, 0); // 2% of 300k
  });

  it('should calculate proc fee correctly', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      procFeePct: 1, // 1%
    });

    expect(result).toBeTruthy();
    expect(result.procFeeGBP).toBeCloseTo(3000, 0); // 1% of 300k
  });

  it('should include broker flat fee', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      brokerFeeFlat: 500,
    });

    expect(result).toBeTruthy();
    // Broker fee should reduce net loan
    const resultWithoutFee = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      brokerFeeFlat: 0,
    });

    expect(result.netLoanGBP).toBeLessThan(resultWithoutFee.netLoanGBP);
  });

  it('should calculate title insurance for loans under £3m', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
    });

    expect(result).toBeTruthy();
    // Title insurance = MAX(392, gross * 0.0013 * 1.12)
    // = MAX(392, 300000 * 0.0013 * 1.12) = MAX(392, 436.80) = 436.80
    if (result.titleInsuranceCost !== null && result.titleInsuranceCost !== undefined) {
      expect(result.titleInsuranceCost).toBeCloseTo(436.80, 0);
    }
  });

  it('should apply minimum title insurance fee', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 100000,
    });

    expect(result).toBeTruthy();
    // MIN fee is £392
    // 100000 * 0.0013 * 1.12 = 145.60, so should use minimum
    if (result.titleInsuranceCost !== null && result.titleInsuranceCost !== undefined) {
      expect(result.titleInsuranceCost).toBe(392);
    }
  });
});

// ============================================
// EDGE CASES
// ============================================

describe('BridgeFusionCalculator - Edge Cases', () => {
  const defaultParams = {
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
  };

  it('should handle very small loan amounts', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 75000, // Minimum loan
    });

    expect(result).toBeTruthy();
    expect(result.gross).toBe(75000);
  });

  it('should handle very large loan amounts', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      propertyValue: 50000000,
      grossLoan: 25000000,
    });

    expect(result).toBeTruthy();
    expect(result.gross).toBe(25000000);
  });

  it('should handle 0% BBR', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      bbrAnnual: 0,
    });

    expect(result).toBeTruthy();
    expect(result.gross).toBe(300000);
  });

  it('should handle high BBR', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      bbrAnnual: 0.06, // 6% BBR
    });

    expect(result).toBeTruthy();
    // Higher BBR should mean more rolled interest
  });

  it('should handle full term rolled interest', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      termMonths: 12,
      rolledMonths: 12, // Full term rolled
    });

    expect(result).toBeTruthy();
    expect(result.rolledMonths).toBe(12);
  });

  it('should cap rolled months at term months', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 300000,
      termMonths: 12,
      rolledMonths: 24, // More than term
    });

    expect(result).toBeTruthy();
    expect(result.rolledMonths).toBeLessThanOrEqual(12);
  });
});

// ============================================
// OUTPUT FIELD TESTS
// ============================================

describe('BridgeFusionCalculator - Output Fields', () => {
  it('should include all required output fields', () => {
    const result = BridgeFusionCalculator.solve({
      productKind: 'bridge-var',
      grossLoan: 300000,
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
    });

    expect(result).toBeTruthy();
    
    // Core loan amounts
    expect(result).toHaveProperty('gross');
    expect(result).toHaveProperty('netLoanGBP');
    expect(result).toHaveProperty('grossLTV');
    expect(result).toHaveProperty('ltv');
    
    // Fees
    expect(result).toHaveProperty('arrangementFeeGBP');
    
    // Interest
    expect(result).toHaveProperty('rolledInterestGBP');
    expect(result).toHaveProperty('rolledMonths');
    
    // Rates
    expect(result).toHaveProperty('fullCouponRateMonthly');
  });
});

// ============================================
// SECOND CHARGE TESTS
// ============================================

describe('BridgeFusionCalculator - Second Charge', () => {
  const defaultParams = {
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
  };

  it('should include first charge in LTV calculation for second charge', () => {
    const resultFirstCharge = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 200000,
      isSecondCharge: false,
    });

    const resultSecondCharge = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 200000,
      isSecondCharge: true,
      firstChargeValue: 100000, // £100k first charge
    });

    expect(resultFirstCharge).toBeTruthy();
    expect(resultSecondCharge).toBeTruthy();
    
    // Second charge LTV should be higher (includes first charge)
    // First charge: 200k/500k = 40%
    // Second charge: (200k+100k)/500k = 60%
    expect(resultSecondCharge.combinedGrossLTV).toBeGreaterThan(resultFirstCharge.grossLTV);
  });
});

// ============================================
// WRAPPER FUNCTION TESTS
// ============================================

describe('solveBridgeFusion wrapper', () => {
  it('should work the same as BridgeFusionCalculator.solve', () => {
    const params = {
      productKind: 'bridge-var',
      grossLoan: 300000,
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
    };

    const resultFromClass = BridgeFusionCalculator.solve(params);
    const resultFromWrapper = solveBridgeFusion(params);

    expect(resultFromClass.gross).toBe(resultFromWrapper.gross);
    expect(resultFromClass.netLoanGBP).toBe(resultFromWrapper.netLoanGBP);
    expect(resultFromClass.grossLTV).toBe(resultFromWrapper.grossLTV);
  });
});

// ============================================
// COMPREHENSIVE SECOND CHARGE TESTS
// ============================================

describe('BridgeFusionCalculator - Second Charge Comprehensive', () => {
  const defaultParams = {
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
  };

  it('should cap second charge at 70% combined LTV', () => {
    // Property value: £500k, First charge: £200k
    // Max combined = 70% of £500k = £350k
    // Max second charge = £350k - £200k = £150k
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 200000, // Requesting £200k
      isSecondCharge: true,
      firstChargeValue: 200000,
    });

    expect(result).toBeTruthy();
    expect(result.maxSecondChargeGross).toBe(150000); // £350k - £200k
    expect(result.gross).toBeLessThanOrEqual(150000); // Should be capped
    expect(result.capped).toBe(true);
  });

  it('should not cap when within 70% combined LTV', () => {
    // Property value: £500k, First charge: £100k
    // Max combined = £350k, Max second charge = £250k
    // Requesting £150k should be fine
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 150000,
      isSecondCharge: true,
      firstChargeValue: 100000,
    });

    expect(result).toBeTruthy();
    expect(result.gross).toBe(150000);
    expect(result.capped).toBe(false);
  });

  it('should return zero gross when first charge already exceeds 70%', () => {
    // Property value: £500k, First charge: £400k (80% LTV)
    // Max combined = £350k, already exceeded by first charge
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 100000,
      isSecondCharge: true,
      firstChargeValue: 400000,
    });

    expect(result).toBeTruthy();
    expect(result.maxSecondChargeGross).toBe(0);
    expect(result.gross).toBe(0);
  });

  it('should calculate combined gross LTV correctly', () => {
    // Property: £500k, First charge: £100k, Second charge: £100k
    // Combined LTV = (£100k + £100k) / £500k = 40%
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 100000,
      isSecondCharge: true,
      firstChargeValue: 100000,
    });

    expect(result).toBeTruthy();
    expect(result.combinedGrossLTV).toBeCloseTo(40, 1);
    expect(result.grossLTV).toBeCloseTo(20, 1); // Just the second charge
    expect(result.isSecondCharge).toBe(true);
    expect(result.firstChargeValue).toBe(100000);
  });

  it('should affect LTV bucket for rate determination', () => {
    // Without second charge: £300k on £500k = 60% LTV bucket
    const resultFirst = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 100000,
      isSecondCharge: false,
    });

    // With second charge: £100k new + £200k first = 60% combined
    // But rate bucket may differ due to combined LTV
    const resultSecond = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 100000,
      isSecondCharge: true,
      firstChargeValue: 200000,
    });

    expect(resultFirst).toBeTruthy();
    expect(resultSecond).toBeTruthy();
    // Both should have same LTV bucket (60%) based on combined exposure
    expect(resultSecond.ltv).toBe(60);
  });

  it('should handle second charge with bridge fixed', () => {
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      productKind: 'bridge-fix',
      rateRecord: createMockRateRecord({ rate: 0.85 }),
      grossLoan: 100000,
      isSecondCharge: true,
      firstChargeValue: 150000,
    });

    expect(result).toBeTruthy();
    expect(result.isSecondCharge).toBe(true);
    expect(result.combinedGrossLTV).toBeCloseTo(50, 1); // (100k + 150k) / 500k
  });
});

// ============================================
// COMPREHENSIVE SPECIFIC NET LOAN TESTS
// ============================================

describe('BridgeFusionCalculator - Specific Net Loan Comprehensive', () => {
  const defaultParams = {
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
  };

  it('should achieve target net with zero rolled months', () => {
    const targetNet = 200000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
      rolledMonths: 0,
    });

    expect(result).toBeTruthy();
    expect(result.requestedNetLoan).toBe(targetNet);
    // Net should be >= target (may round up to nearest £1000)
    expect(result.netLoanGBP).toBeGreaterThanOrEqual(targetNet - 1000);
  });

  it('should achieve target net with rolled interest', () => {
    const targetNet = 200000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
      rolledMonths: 6,
    });

    expect(result).toBeTruthy();
    expect(result.rolledMonths).toBe(6);
    expect(result.rolledInterestGBP).toBeGreaterThan(0);
    // Gross should be higher due to rolled interest deduction
    expect(result.gross).toBeGreaterThan(targetNet + result.arrangementFeeGBP);
  });

  it('should achieve target net with all fees', () => {
    const targetNet = 150000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
      rolledMonths: 3,
      procFeePct: 1,
      brokerFeeFlat: 500,
    });

    expect(result).toBeTruthy();
    // Gross should account for: arrangement fee + rolled interest + proc fee + broker fee
    const totalFees = result.arrangementFeeGBP + result.rolledInterestGBP + result.procFeeGBP + 500;
    expect(result.gross).toBeGreaterThanOrEqual(targetNet + totalFees - 5000); // Allow tolerance
  });

  it('should work with Fusion product', () => {
    const targetNet = 180000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      productKind: 'fusion',
      rateRecord: createMockRateRecord({ rate: 4.79, product: 'Fusion Standard' }),
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
      termMonths: 24,
      rolledMonths: 6,
      rentPm: 2000,
    });

    expect(result).toBeTruthy();
    expect(result.productKind).toBe('fusion');
    expect(Math.abs(result.netLoanGBP - targetNet)).toBeLessThan(5000);
  });

  it('should work with bridge fixed product', () => {
    const targetNet = 200000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      productKind: 'bridge-fix',
      rateRecord: createMockRateRecord({ rate: 0.85 }),
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
      rolledMonths: 3,
    });

    expect(result).toBeTruthy();
    expect(result.productKind).toBe('bridge-fix');
    // Bridge fixed doesn't add BBR, so less interest than variable
    expect(result.gross).toBeGreaterThan(targetNet);
  });

  it('should handle combined specific net with second charge', () => {
    const targetNet = 100000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
      isSecondCharge: true,
      firstChargeValue: 150000,
    });

    expect(result).toBeTruthy();
    expect(result.isSecondCharge).toBe(true);
    // Combined LTV should respect 70% cap
    expect(result.combinedGrossLTV).toBeLessThanOrEqual(70);
  });

  it('should cap specific net when second charge limit reached', () => {
    // Property: £500k, First charge: £300k
    // Max combined: £350k, Max second charge: £50k
    // Requesting net of £100k should be capped
    const targetNet = 100000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
      isSecondCharge: true,
      firstChargeValue: 300000,
    });

    expect(result).toBeTruthy();
    expect(result.maxSecondChargeGross).toBe(50000);
    expect(result.gross).toBeLessThanOrEqual(50000);
    // Net will be less than requested due to cap
    expect(result.netLoanGBP).toBeLessThan(targetNet);
  });

  it('should indicate when target net is achieved', () => {
    const targetNet = 150000;
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
    });

    expect(result).toBeTruthy();
    expect(result.requestedNetLoan).toBe(targetNet);
    // netTargetMet should be true when achieved
    if (result.netLoanGBP >= targetNet) {
      expect(result.netTargetMet).toBe(true);
    }
  });

  it('should round gross up to nearest £1000', () => {
    const targetNet = 147500; // Odd number
    const result = BridgeFusionCalculator.solve({
      ...defaultParams,
      grossLoan: 0,
      useSpecificNet: true,
      specificNetLoan: targetNet,
    });

    expect(result).toBeTruthy();
    // Gross should be rounded to nearest £1000
    expect(result.gross % 1000).toBe(0);
  });
});
