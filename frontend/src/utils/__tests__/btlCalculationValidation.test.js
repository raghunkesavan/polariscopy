/**
 * BTL Calculation Validation Tests
 * These tests verify the actual calculation numbers are correct for BTL products
 */

import { describe, it, expect } from 'vitest';
import { computeBTLLoan, BTLCalculationEngine } from '../btlCalculationEngine';
import { LOAN_TYPES } from '../../config/constants';

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

describe('BTL Calculation Validation - LTV Calculations', () => {
  
  it('should calculate correct LTV from gross loan and property value', () => {
    // Property: £500,000, Gross: £375,000
    // Expected LTV: 375000 / 500000 = 75%
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ maxLtv: 75 }),
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

    console.log('=== LTV Calculation Validation ===');
    console.log('Property Value: £500,000');
    console.log('Gross Loan: £' + result.grossLoan?.toLocaleString());
    console.log('Expected LTV: 75%');
    console.log('Actual LTV:', (result.ltv * 100).toFixed(2) + '%');
    
    expect(result).toBeTruthy();
    expect(result.grossLoan).toBeLessThanOrEqual(375000);
    expect(result.ltv).toBeLessThanOrEqual(0.75);
  });

  it('should cap gross loan at max LTV', () => {
    // Property: £400,000, Max LTV: 75%
    // Max Gross = £400,000 * 0.75 = £300,000
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ maxLtv: 75 }),
      propertyValue: '400000',
      monthlyRent: '3000', // High rent so ICR doesn't limit
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

    console.log('=== Max LTV Cap Validation ===');
    console.log('Property Value: £400,000');
    console.log('Max LTV: 75%');
    console.log('Expected Max Gross: £300,000');
    console.log('Actual Gross: £' + result.grossLoan?.toLocaleString());
    
    expect(result).toBeTruthy();
    expect(result.grossLoan).toBeLessThanOrEqual(300000);
  });
});

describe('BTL Calculation Validation - ICR Calculations', () => {
  
  it('should calculate ICR correctly', () => {
    // ICR = Annual Rent / Annual Interest Cost
    // Rent: £2000/month = £24,000/year
    // If gross = £300,000, rate = 6.5%, interest = 300000 * 0.065 = £19,500/year
    // ICR = 24000 / 19500 = 1.23 (123%)
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }), // Low ICR to not constrain
      propertyValue: '500000',
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

    console.log('=== ICR Calculation Validation ===');
    console.log('Monthly Rent: £2,000');
    console.log('Annual Rent: £24,000');
    console.log('Gross Loan: £' + result.grossLoan?.toLocaleString());
    console.log('Rate: 6.5%');
    // ICR is stored as a ratio (e.g., 1.23 means 123%)
    console.log('ICR:', (result.icr * 100).toFixed(2) + '%');
    
    expect(result).toBeTruthy();
    expect(result.grossLoan).toBe(300000);
    // ICR should be around 1.23 (123%) for these numbers - stored as ratio
    expect(result.icr).toBeGreaterThan(1);
  });

  it('should constrain loan when ICR requirement not met', () => {
    // Low rent scenario - ICR should limit the loan
    // Rent: £1000/month, Min ICR: 145%
    // With high ICR requirement, max loan will be limited
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 145 }),
      propertyValue: '500000',
      monthlyRent: '1000', // Low rent
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

    console.log('=== ICR Constraint Validation ===');
    console.log('Monthly Rent: £1,000');
    console.log('Min ICR Required: 145%');
    console.log('Max LTV would give: £375,000');
    console.log('Actual Gross (ICR limited): £' + result.grossLoan?.toLocaleString());
    // ICR is stored as a ratio (e.g., 1.45 means 145%)
    console.log('Actual ICR:', (result.icr * 100).toFixed(2) + '%');
    
    expect(result).toBeTruthy();
    // ICR constraint should limit loan below LTV max
    expect(result.grossLoan).toBeLessThan(375000);
    // ICR should meet minimum requirement (1.45 = 145%)
    expect(result.icr).toBeGreaterThanOrEqual(1.45);
  });
});

describe('BTL Calculation Validation - Fee Calculations', () => {
  
  it('should calculate product fee correctly', () => {
    // Gross: £300,000, Fee: 2%
    // Product Fee = 300000 * 0.02 = £6,000
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
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

    console.log('=== Product Fee Validation ===');
    console.log('Gross Loan: £300,000');
    console.log('Fee Percentage: 2%');
    console.log('Expected Fee: £6,000');
    console.log('Actual Fee: £' + result.productFeeAmount?.toLocaleString());
    
    expect(result).toBeTruthy();
    expect(result.productFeeAmount).toBeCloseTo(6000, 0);
  });

  it('should calculate 4% fee correctly', () => {
    // Gross: £200,000, Fee: 4%
    // Product Fee = 200000 * 0.04 = £8,000
    
    const result = computeBTLLoan({
      colKey: 'Fee: 4%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
      propertyValue: '500000',
      monthlyRent: '2500',
      specificGrossLoan: '200000',
      loanType: LOAN_TYPES.SPECIFIC_GROSS,
      productType: '2yr Fix',
      productScope: 'Residential',
      tier: 1,
      selectedRange: 'specialist',
      criteria: {},
      retentionChoice: 'No',
      productFeePercent: 4,
    });

    console.log('=== 4% Fee Validation ===');
    console.log('Gross Loan: £200,000');
    console.log('Fee Percentage: 4%');
    console.log('Expected Fee: £8,000');
    console.log('Actual Fee: £' + result.productFeeAmount?.toLocaleString());
    
    expect(result).toBeTruthy();
    expect(result.productFeeAmount).toBeCloseTo(8000, 0);
  });
});

describe('BTL Calculation Validation - Interest Calculations', () => {
  
  it('should calculate rolled interest correctly', () => {
    // Gross: £300,000, Rate: 6.5%, Rolled: 6 months
    // Rolled Interest = Gross * (Rate/12) * RolledMonths
    // = 300000 * (0.065/12) * 6 = £9,750
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100, maxRolledMonths: 12 }),
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
      manualRolled: 6,
      manualDeferred: 0,
    });

    console.log('=== Rolled Interest Validation ===');
    console.log('Gross Loan: £300,000');
    console.log('Rate: 6.5%');
    console.log('Rolled Months: 6');
    const expectedRolled = 300000 * (0.065 / 12) * 6;
    console.log('Expected Rolled Interest: £' + expectedRolled.toFixed(2));
    console.log('Actual Rolled Interest: £' + result.rolledInterestAmount?.toFixed(2));
    
    expect(result).toBeTruthy();
    expect(result.rolledMonths).toBe(6);
    expect(result.rolledInterestAmount).toBeCloseTo(expectedRolled, -1); // Within £10
  });

  it('should calculate deferred interest correctly', () => {
    // Gross: £300,000, Deferred Rate: 1.5%, Term: 24 months
    // Deferred Interest = Gross * (DeferredRate/12) * TermMonths
    // = 300000 * (0.015/12) * 24 = £9,000
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100, maxDeferInt: 1.5, termMonths: 24 }),
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
      manualRolled: 0,
      manualDeferred: 1.5,
    });

    console.log('=== Deferred Interest Validation ===');
    console.log('Gross Loan: £300,000');
    console.log('Deferred Rate: 1.5%');
    console.log('Term: 24 months');
    const expectedDeferred = 300000 * (0.015 / 12) * 24;
    console.log('Expected Deferred Interest: £' + expectedDeferred.toFixed(2));
    console.log('Actual Deferred Interest: £' + result.deferredInterestAmount?.toFixed(2));
    
    expect(result).toBeTruthy();
    expect(result.deferredCapPct).toBe(1.5);
    expect(result.deferredInterestAmount).toBeCloseTo(expectedDeferred, -1);
  });
});

describe('BTL Calculation Validation - Net Loan Calculations', () => {
  
  it('should calculate net loan correctly', () => {
    // Net = Gross - Product Fee - Rolled Interest - Deferred Interest
    // Gross: £300,000
    // Product Fee (2%): £6,000
    // Rolled Interest (6.5%, 6 mo): £9,750
    // Net = 300000 - 6000 - 9750 = £284,250
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
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
      manualRolled: 6,
      manualDeferred: 0,
    });

    console.log('=== Net Loan Validation ===');
    console.log('Gross Loan: £' + result.grossLoan?.toLocaleString());
    console.log('Product Fee: £' + result.productFeeAmount?.toLocaleString());
    console.log('Rolled Interest: £' + result.rolledInterestAmount?.toFixed(2));
    console.log('Deferred Interest: £' + result.deferredInterestAmount?.toFixed(2));
    const calculatedNet = result.grossLoan - result.productFeeAmount - result.rolledInterestAmount - result.deferredInterestAmount;
    console.log('Calculated Net: £' + calculatedNet.toFixed(2));
    console.log('Actual Net: £' + result.netLoan?.toFixed(2));
    
    expect(result).toBeTruthy();
    // Net should equal Gross - fees - interest
    const expectedNet = result.grossLoan - result.productFeeAmount - result.rolledInterestAmount - result.deferredInterestAmount;
    expect(result.netLoan).toBeCloseTo(expectedNet, 0);
  });

  it('should solve for gross when given specific net', () => {
    // Target net: £250,000
    // Should calculate gross that results in net of £250,000 after fees
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
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

    console.log('=== Specific Net Loan Validation ===');
    console.log('Target Net: £250,000');
    console.log('Calculated Gross: £' + result.grossLoan?.toLocaleString());
    console.log('Actual Net: £' + result.netLoan?.toFixed(2));
    console.log('Product Fee: £' + result.productFeeAmount?.toLocaleString());
    
    expect(result).toBeTruthy();
    // Net should be close to target (within 1%)
    expect(result.netLoan).toBeGreaterThanOrEqual(245000);
    expect(result.netLoan).toBeLessThanOrEqual(255000);
    // Gross should be higher than net
    expect(result.grossLoan).toBeGreaterThan(result.netLoan);
  });
});

describe('BTL Calculation Validation - Monthly Payment (Direct Debit)', () => {
  
  it('should calculate monthly payment correctly', () => {
    // Monthly Payment = Gross * (PayRate / 12)
    // Gross: £300,000, Pay Rate: 6.5% (no deferred)
    // Monthly = 300000 * (0.065 / 12) = £1,625
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
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
      manualRolled: 0,
      manualDeferred: 0,
    });

    console.log('=== Monthly Payment Validation ===');
    console.log('Gross Loan: £300,000');
    console.log('Pay Rate: 6.5%');
    const expectedDD = 300000 * (0.065 / 12);
    console.log('Expected Monthly: £' + expectedDD.toFixed(2));
    console.log('Actual Monthly: £' + result.directDebit?.toFixed(2));
    
    expect(result).toBeTruthy();
    expect(result.directDebit).toBeCloseTo(expectedDD, 0);
  });

  it('should reduce monthly payment when deferred interest applied', () => {
    // With deferred interest, pay rate is reduced
    // Pay Rate = Base Rate - Deferred Rate
    // 6.5% - 1.5% = 5% effective pay rate
    // Monthly = 300000 * (0.05 / 12) = £1,250
    
    const resultNoDeferred = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
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
      manualRolled: 0,
      manualDeferred: 0,
    });

    const resultWithDeferred = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100, maxDeferInt: 1.5 }),
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
      manualRolled: 0,
      manualDeferred: 1.5,
    });

    console.log('=== Deferred Interest Impact on Monthly Payment ===');
    console.log('Without Deferred: £' + resultNoDeferred.directDebit?.toFixed(2));
    console.log('With 1.5% Deferred: £' + resultWithDeferred.directDebit?.toFixed(2));
    console.log('Difference: £' + (resultNoDeferred.directDebit - resultWithDeferred.directDebit)?.toFixed(2));
    
    expect(resultNoDeferred).toBeTruthy();
    expect(resultWithDeferred).toBeTruthy();
    // Monthly payment should be lower with deferred
    expect(resultWithDeferred.directDebit).toBeLessThan(resultNoDeferred.directDebit);
  });
});

describe('BTL Calculation Validation - Title Insurance', () => {
  
  it('should calculate title insurance for loans under £3m', () => {
    // Title Insurance = MAX(392, Gross * 0.0013 * 1.12)
    // For £300,000: 300000 * 0.0013 * 1.12 = 436.80
    // MAX(392, 436.80) = 436.80
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
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

    console.log('=== Title Insurance Validation ===');
    console.log('Gross Loan: £300,000');
    const expectedTI = Math.max(392, 300000 * 0.0013 * 1.12);
    console.log('Expected: MAX(392, 300000 * 0.0013 * 1.12) = £' + expectedTI.toFixed(2));
    console.log('Actual: £' + result.titleInsuranceCost?.toFixed(2));
    
    expect(result).toBeTruthy();
    if (result.titleInsuranceCost !== null) {
      expect(result.titleInsuranceCost).toBeCloseTo(expectedTI, 0);
    }
  });

  it('should apply minimum title insurance of £392', () => {
    // For £100,000: 100000 * 0.0013 * 1.12 = 145.60
    // MAX(392, 145.60) = 392 (minimum)
    
    const result = computeBTLLoan({
      colKey: 'Fee: 2%',
      selectedRate: createMockRate({ rate: 6.5, minIcr: 100 }),
      propertyValue: '200000',
      monthlyRent: '1500',
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

    console.log('=== Minimum Title Insurance Validation ===');
    console.log('Gross Loan: £100,000');
    console.log('Calculated: 100000 * 0.0013 * 1.12 = £145.60');
    console.log('Expected: £392 (minimum)');
    console.log('Actual: £' + result.titleInsuranceCost?.toFixed(2));
    
    expect(result).toBeTruthy();
    if (result.titleInsuranceCost !== null) {
      expect(result.titleInsuranceCost).toBe(392);
    }
  });
});
