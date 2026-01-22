/**
 * BTL Calculation Engine Tests
 * Tests the PRODUCTION code at src/utils/btlCalculationEngine.js
 * 
 * Source of truth: "BTL Loan Hub 29.10.2025 Retention - issued v2.xlsx"
 */

import { describe, it, expect } from 'vitest';
import { computeBTLLoan, BTLCalculationEngine } from '../btlCalculationEngine';
import { LOAN_TYPES } from '../../config/constants';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a mock rate record simulating database rate
 */
function createMockRate(options = {}) {
  const {
    rate = 6.5,
    minLoan = 50000,
    maxLoan = 5000000,
    maxLtv = 75,
    minIcr = 145,
    termMonths = 24,
    maxRolledMonths = 12,
    minRolledMonths = 0,
    maxDeferInt = 1.5,
    minDeferInt = 0,
    adminFee = 500,
    exitFee = 0,
    floorRate = null,
  } = options;

  return {
    rate,
    min_loan: minLoan,
    max_loan: maxLoan,
    max_ltv: maxLtv,
    min_icr: minIcr,
    term_months: termMonths,
    max_rolled_months: maxRolledMonths,
    min_rolled_months: minRolledMonths,
    max_defer_int: maxDeferInt,
    min_defer_int: minDeferInt,
    admin_fee: adminFee,
    exit_fee: exitFee,
    floor_rate: floorRate,
  };
}

describe('BTL Calculation Engine', () => {
  // Mock rate with all required fields
  const mockRate = createMockRate();

  describe('Max LTV Loan Type', () => {
    it('should calculate gross loan based on LTV', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75, // 75%
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.grossLoan).toBeGreaterThan(0);
      // Max gross should be ~375,000 (75% of 500k)
      expect(result.grossLoan).toBeLessThanOrEqual(375000);
      expect(result.ltv).toBeCloseTo(result.grossLoan / 500000, 4);
    });
  });

  describe('Specific Gross Loan Type', () => {
    it('should use specified gross loan amount', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        specificGrossLoan: '300000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.grossLoan).toBeCloseTo(300000, 0);
    });
  });

  describe('Specific Net Loan Type', () => {
    it('should work backwards from net to find gross', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
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

      expect(result).toBeTruthy();
      expect(result.netLoan).toBeCloseTo(250000, 0);
      expect(result.grossLoan).toBeGreaterThan(250000); // Gross > Net due to fees
    });
  });

  describe('Core Residential Floor Rate', () => {
    it('should apply 5% floor to Core Residential products for ICR calculations', () => {
      // Floor rate is used in ICR stress calculations, not displayed rate
      // The effect is that core products with low rates get lower max loans
      // because ICR is calculated with the higher floor rate
      // Use lower rent (£1000) to ensure ICR is the binding constraint, not LTV
      const lowRateMock = { ...mockRate, rate: 3.5, floor_rate: 5 }; // Rate 3.5% with 5% floor
      
      const resultCore = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: lowRateMock,
        propertyValue: '500000',
        monthlyRent: '1000', // Low rent to make ICR the constraint
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'core', // Core product - floor rate applies to ICR
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      const resultSpecialist = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: lowRateMock,
        propertyValue: '500000',
        monthlyRent: '1000', // Same low rent
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist', // Specialist - no floor rate
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(resultCore).toBeTruthy();
      expect(resultSpecialist).toBeTruthy();
      
      // Core product should have lower gross loan due to floor rate making ICR stricter
      // (higher rate in ICR calc = lower max loan from rental)
      expect(resultCore.grossLoan).toBeLessThan(resultSpecialist.grossLoan);
      
      // Display rate shows actual rate (not floor) for transparency
      expect(resultCore.actualRateUsed).toBe(3.5);
    });

    it('should NOT apply floor to Specialist products', () => {
      const lowRateMock = { ...mockRate, rate: 3.5 };
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: lowRateMock,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist', // Specialist - no floor
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.actualRateUsed).toBeLessThan(5); // Should be ~3.5%
    });
  });

  describe('ICR Constraint', () => {
    it('should limit loan based on rental income', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '1000', // Low rent - should limit loan
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

      expect(result).toBeTruthy();
      // With low rent, loan should be limited by ICR
      expect(result.grossLoan).toBeLessThan(375000); // Less than max LTV cap
      expect(result.icr).toBeGreaterThanOrEqual(1.45); // Should meet 145% ICR
    });
  });

  describe('Retention Products', () => {
    it('should apply 65% LTV cap for retention 65', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        retentionLtv: '65', // 65% retention
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'Yes',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Max should be 65% of 500k = 325k
      expect(result.grossLoan).toBeLessThanOrEqual(325000);
      expect(result.ltv).toBeLessThanOrEqual(0.65);
    });
  });

  describe('Fee Calculations', () => {
    it('should calculate product fee correctly', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        specificGrossLoan: '300000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // 2% of 300k = 6000
      expect(result.productFeeAmount).toBeCloseTo(6000, 0);
    });
  });

  describe('Optimization', () => {
    it('should optimize rolled and deferred to maximize net loan', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '3000',
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

      expect(result).toBeTruthy();
      expect(result.rolledMonths).toBeDefined();
      expect(result.deferredCapPct).toBeDefined();
      // Net should be less than gross due to fees and interest
      expect(result.netLoan).toBeLessThan(result.grossLoan);
    });
  });

  describe('Manual Mode', () => {
    it('should use manual rolled/deferred values when provided', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
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
        manualDeferred: 1.0,
      });

      expect(result).toBeTruthy();
      expect(result.rolledMonths).toBe(6);
      expect(result.deferredCapPct).toBeCloseTo(1.0, 1);
      expect(result.isManual).toBe(true);
    });
  });

  // ============================================
  // TRACKER PRODUCT TESTS
  // ============================================

  describe('Tracker Products', () => {
    it('should add BBR to tracker rates', () => {
      const trackerRate = createMockRate({ rate: 3.64, minIcr: 125 }); // 3.64% margin
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: trackerRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Tracker', // Tracker product
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Should include BBR (4%) in rate display
      // Full rate = 3.64% + 4% BBR = 7.64%
      expect(result.fullRateText).toContain('BBR');
    });

    it('should have lower ICR requirement for trackers', () => {
      const trackerRate = createMockRate({ rate: 3.64, minIcr: 125 }); // 125% ICR for tracker
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: trackerRate,
        propertyValue: '500000',
        monthlyRent: '1500', // Moderate rent
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Tracker',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // ICR should be at least 125% (tracker requirement)
      if (result.icr) {
        expect(result.icr).toBeGreaterThanOrEqual(1.25);
      }
    });
  });

  // ============================================
  // PROPERTY TYPE TESTS
  // ============================================

  describe('Property Types', () => {
    it('should handle Semi-Commercial property', () => {
      const semiCommRate = createMockRate({ rate: 7.59, maxLtv: 70 });
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: semiCommRate,
        propertyValue: '500000',
        monthlyRent: '3000',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Semi-Commercial',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Should cap at 70% LTV for semi-commercial
      expect(result.ltv).toBeLessThanOrEqual(0.70);
    });

    it('should handle Commercial property', () => {
      const commRate = createMockRate({ rate: 8.14, maxLtv: 65 });
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: commRate,
        propertyValue: '800000',
        monthlyRent: '5000',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Commercial',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Should cap at 65% LTV for commercial
      expect(result.ltv).toBeLessThanOrEqual(0.65);
    });
  });

  // ============================================
  // TITLE INSURANCE TESTS
  // ============================================

  describe('Title Insurance', () => {
    it('should calculate title insurance for loans under £3m', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '400000',
        monthlyRent: '2000',
        specificGrossLoan: '300000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Title insurance = MAX(392, gross * 0.0013 * 1.12)
      // = MAX(392, 300000 * 0.0013 * 1.12) = MAX(392, 436.80) = 436.80
      expect(result.titleInsuranceCost).toBeCloseTo(436.80, 0);
    });

    it('should apply minimum title insurance fee £392', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '150000',
        monthlyRent: '800',
        specificGrossLoan: '100000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // 100000 * 0.0013 * 1.12 = 145.60 < 392, so use minimum
      expect(result.titleInsuranceCost).toBe(392);
    });

    it('should return null for title insurance on loans over £3m', () => {
      const highValueRate = createMockRate({ maxLoan: 10000000 });
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: highValueRate,
        propertyValue: '5000000',
        monthlyRent: '25000',
        specificGrossLoan: '3500000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.titleInsuranceCost).toBeNull();
    });
  });

  // ============================================
  // OUTPUT FIELD TESTS
  // ============================================

  describe('Output Fields', () => {
    it('should include all required output fields', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
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

      expect(result).toBeTruthy();
      
      // Core loan amounts
      expect(result).toHaveProperty('grossLoan');
      expect(result).toHaveProperty('netLoan');
      expect(result).toHaveProperty('productFeeAmount');
      expect(result).toHaveProperty('ltv');
      expect(result).toHaveProperty('icr');
      
      // Payment info
      expect(result).toHaveProperty('directDebit');
      expect(result).toHaveProperty('ddStartMonth');
      
      // Slider values
      expect(result).toHaveProperty('rolledMonths');
      expect(result).toHaveProperty('deferredCapPct');
      expect(result).toHaveProperty('termMonths');
      
      // Rates
      expect(result).toHaveProperty('fullRateText');
      expect(result).toHaveProperty('actualRateUsed');
      expect(result).toHaveProperty('payRateText');
      
      // Additional fields
      expect(result).toHaveProperty('titleInsuranceCost');
      expect(result).toHaveProperty('servicedInterest');
      expect(result).toHaveProperty('totalCostToBorrower');
      expect(result).toHaveProperty('productName');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle zero property value', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '0',
        monthlyRent: '2000',
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

      // With zero property value, LTV cap becomes Infinity
      // So the loan is constrained by ICR only (based on rent)
      // This is valid business behavior - loan amount calculated from rental income
      expect(result).toBeTruthy();
      expect(result.grossLoan).toBeGreaterThan(0); // ICR-constrained loan
      expect(result.ltv).toBeNull(); // LTV cannot be calculated without property value
    });

    it('should handle zero monthly rent', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '0',
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

      // With zero rent, ICR constraint returns Infinity (no rental constraint)
      // So the loan is constrained by LTV cap only (75% of £500k = £375k)
      // This is valid business behavior for development/land purchases
      expect(result).toBeTruthy();
      expect(result.grossLoan).toBe(375000); // 75% LTV cap
      expect(result.icr).toBeNull(); // ICR cannot be calculated without rent
    });

    it('should cap LTV at rate table maximum', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate, // max_ltv: 75
        propertyValue: '500000',
        monthlyRent: '5000',
        maxLtvInput: 100, // User requests 100%
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      // Should cap at 75% from rate table
      expect(result.ltv).toBeLessThanOrEqual(0.75);
    });

    it('should respect minimum loan limit', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate, // min_loan: 50000
        propertyValue: '60000', // 75% = £45k, below minimum
        monthlyRent: '400',
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

      // Should either return 0 or flag below minimum
      if (result && result.grossLoan > 0) {
        expect(result.belowMin).toBe(true);
      }
    });

    it('should respect maximum loan limit', () => {
      const highValueRate = createMockRate({ maxLoan: 5000000 });
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: highValueRate,
        propertyValue: '10000000', // 75% = £7.5m
        monthlyRent: '50000',
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

      expect(result).toBeTruthy();
      expect(result.grossLoan).toBeLessThanOrEqual(5000000);
    });
  });

  // ============================================
  // TIER TESTS
  // ============================================

  describe('Tiers', () => {
    it('should handle Tier 1 (Standard)', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
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

      expect(result).toBeTruthy();
      expect(result.productName).toContain('Tier 1');
    });

    it('should handle Tier 2 (Solutions)', () => {
      const tier2Rate = createMockRate({ rate: 7.14 });
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: tier2Rate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 2,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.productName).toContain('Tier 2');
    });

    it('should handle Tier 3 (Specialist)', () => {
      const tier3Rate = createMockRate({ rate: 7.44 });
      
      const result = computeBTLLoan({
        colKey: 'Fee: 2%',
        selectedRate: tier3Rate,
        propertyValue: '500000',
        monthlyRent: '2500',
        maxLtvInput: 75,
        loanType: LOAN_TYPES.MAX_LTV,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 3,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 2,
      });

      expect(result).toBeTruthy();
      expect(result.productName).toContain('Tier 3');
    });
  });

  // ============================================
  // FEE PERCENTAGE TESTS
  // ============================================

  describe('Fee Percentages', () => {
    it('should calculate 4% fee correctly', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 4%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        specificGrossLoan: '300000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 4,
      });

      expect(result).toBeTruthy();
      expect(result.productFeeAmount).toBeCloseTo(12000, 0); // 4% of 300k
    });

    it('should calculate 6% fee correctly', () => {
      const result = computeBTLLoan({
        colKey: 'Fee: 6%',
        selectedRate: mockRate,
        propertyValue: '500000',
        monthlyRent: '2500',
        specificGrossLoan: '300000',
        loanType: LOAN_TYPES.SPECIFIC_GROSS,
        productType: '2yr Fix',
        productScope: 'Residential',
        tier: 1,
        selectedRange: 'specialist',
        criteria: {},
        retentionChoice: 'No',
        productFeePercent: 6,
      });

      expect(result).toBeTruthy();
      expect(result.productFeeAmount).toBeCloseTo(18000, 0); // 6% of 300k
    });
  });
});
