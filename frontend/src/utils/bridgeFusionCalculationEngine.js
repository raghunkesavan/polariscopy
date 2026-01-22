/**
 * Bridge & Fusion Calculation Engine
 * 
 * Implements comprehensive financial calculations for Bridge and Fusion products
 * based on integration/bridgeFusionCalculations.js formulas.
 * 
 * Features:
 * - LTV bucket determination (60%, 70%, 75%)
 * - Rolled interest calculations (interest added to loan upfront)
 * - Deferred interest calculations (interest paid at term end)
 * - Serviced interest calculations (interest paid monthly)
 * - APR/APRC calculations
 * - Monthly payment calculations
 * - Net proceeds calculations
 * - ICR (Interest Coverage Ratio) for Fusion products
 * - BBR (Bank Base Rate) handling for variable products
 */

import { parseNumber } from './calculator/numberFormatting';

export class BridgeFusionCalculator {
  /**
   * Round a number up to the nearest step (default: 1000)
   */
  static roundUpTo(value, step = 1000) {
    return value > 0 ? Math.ceil(value / step) * step : 0;
  }

  /**
   * Determine LTV bucket based on gross loan and property value
   * Returns 60, 70, or 75 based on LTV percentage
   */
  static getLtvBucket(gross, propertyValue) {
    if (!propertyValue || propertyValue <= 0) return 75;
    const ltvPct = (gross / propertyValue) * 100;
    if (ltvPct <= 60) return 60;
    if (ltvPct <= 70) return 70;
    return 75;
  }

  /**
   * Get the margin rate for variable bridge products
   * Returns monthly margin rate (as decimal, e.g. 0.005 = 0.5%)
   */
  static getBridgeVarMargin(ltvBucket, rateRecord) {
    // Rate from database is already the monthly margin
    // e.g., 0.5 in CSV = 0.5% monthly margin
    return (parseNumber(rateRecord.rate) || 0) / 100;
  }

  /**
   * Get the coupon rate for fixed bridge products
   * Returns monthly coupon rate (as decimal, e.g. 0.0085 = 0.85%)
   */
  static getBridgeFixCoupon(ltvBucket, rateRecord) {
    // Rate from database is the monthly coupon
    // e.g., 0.85 in CSV = 0.85% monthly coupon
    return (parseNumber(rateRecord.rate) || 0) / 100;
  }

  /**
   * Get Fusion product tier name and margin based on loan size
   * Returns object with annualRate and tierName
   */
  static getFusionTierInfo(gross, rateRecord, bbrAnnual) {
    // Fusion rates in database are the MARGIN (excluding BBR)
    // e.g., 4.79% annual margin (BBR is added separately)
    const marginAnnual = (parseNumber(rateRecord.rate) || 0) / 100;
    const fullAnnualRate = marginAnnual + bbrAnnual; // Full rate = margin + BBR
    const tierName = rateRecord.product || 'Standard';
    
    return {
      annualRate: fullAnnualRate,
      tierName: tierName,
      marginAnnual: marginAnnual // Already the margin from DB
    };
  }

  /**
   * Main calculation method for Bridge and Fusion products
   * 
   * @param {Object} params - Calculation parameters
   * @param {string} params.productKind - 'bridge-var', 'bridge-fix', or 'fusion'
   * @param {number} params.grossLoan - Gross loan amount
   * @param {number} params.propertyValue - Property value
   * @param {Object} params.rateRecord - Rate record from database
   * @param {boolean} params.isCommercial - Is commercial property
   * @param {number} params.bbrAnnual - Annual BBR as decimal (e.g., 0.04 = 4%)
   * @param {number} params.rentPm - Monthly rent
   * @param {number} params.topSlicingPm - Monthly top slicing income
   * @param {number} params.termMonths - Loan term in months
   * @param {number} params.rolledMonths - Months of rolled interest
   * @param {number} params.arrangementPct - Arrangement fee as percentage (decimal)
   * @param {number} params.deferredAnnualRate - Deferred interest rate (annual decimal)
   * @param {number} params.procFeePct - Proc fee percentage
   * @param {number} params.brokerFeeFlat - Flat broker fee amount
   * @param {number} params.brokerClientFee - Broker client fee from additional fees
   * @param {number} params.adminFee - Admin fee amount
   * 
   * @returns {Object} Calculation results
   */
  static solve(params) {
    const {
      productKind,
      grossLoan,
      propertyValue,
      rateRecord,
      isCommercial = false,
      bbrAnnual = 0.04, // Default 4% BBR
      rentPm = 0,
      topSlicingPm = 0,
      termMonths = 12,
      rolledMonths = 0,
      arrangementPct = 0.02, // Default 2%
      deferredAnnualRate = 0,
      procFeePct = 0,
      brokerFeeFlat = 0,
      brokerClientFee = 0,
      adminFee = 0,
      useSpecificNet = false,
      specificNetLoan = 0,
      commitmentFeePounds = 0,
      exitFeePercent = 0,
      // Optional broker settings so percentage-based fees can be calculated from final gross
      brokerSettings = null,
      // Second charge context
      isSecondCharge = false,
      firstChargeValue = 0,
    } = params;

    let gross = parseNumber(grossLoan);
    const pv = parseNumber(propertyValue);
    const rent = parseNumber(rentPm);
    const topSlice = parseNumber(topSlicingPm);
    const term = parseNumber(termMonths) || 12;
    const rolled = Math.min(parseNumber(rolledMonths) || 0, term);
    const adminFeeAmt = parseNumber(adminFee) || 0;
    const targetNet = parseNumber(specificNetLoan);
    const commitmentFee = parseNumber(commitmentFeePounds) || 0;
    const exitFeePct = parseNumber(exitFeePercent) || 0;
  const firstChargeValNum = parseNumber(firstChargeValue) || 0;
  const secondChargeFlag = !!isSecondCharge;

    // Validate inputs
    if (isNaN(gross) || gross <= 0) {
      if (useSpecificNet && !isNaN(targetNet) && targetNet > 0) {
        // We'll calculate gross from net below - start with target net + estimated fees
        // Typical fees are ~5-10%, so start with targetNet * 1.15 to ensure we iterate upward
        gross = Math.ceil(targetNet * 1.15 / 1000) * 1000; // Round up to nearest £1000
      } else {
        // Return empty result
        return {
          gross: 0,
          netLoanGBP: 0,
          npb: 0,
          grossLTV: 0,
          netLTV: 0,
          ltv: 0,
          fullAnnualRate: 0,
          fullRateMonthly: 0,
          fullCouponRateMonthly: 0,
          payRateMonthly: 0,
          marginMonthly: 0,
          bbrMonthly: 0,
          fullRateText: 'N/A',
          arrangementFeeGBP: 0,
          arrangementFeePct: 0,
          procFeePct: 0,
          procFeeGBP: 0,
          brokerFeeGBP: 0,
          adminFee: 0,
          productFeePercent: 0,
          productFeePounds: 0,
          termMonths: term,
          rolledMonths: 0,
          servicedMonths: term,
          rolledInterestGBP: 0,
          rolledIntCoupon: 0,
          rolledIntBBR: 0,
          deferredGBP: 0,
          deferredInterestRate: 0,
          servicedInterestGBP: 0,
          totalInterest: 0,
          monthlyPaymentGBP: 0,
          directDebit: 0,
          aprcAnnual: 0,
          aprcMonthly: 0,
          totalAmountRepayable: 0,
          tier: null,
          tierName: null,
          icr: null,
          productKind,
          propertyValue: pv,
          rent: rent,
          topSlicing: topSlice,
          error: 'No valid gross loan or specific net loan provided'
        };
      }
    }

    // If using specific net loan, we need to reverse-calculate the gross loan
    // Net = Gross - ArrangementFee - RolledInterest - DeferredInterest - ProcFee - BrokerFee - AdminFee - TitleInsurance
    // Use algebraic formula: Gross = Net / (1 - totalDeductionRate)
    if (useSpecificNet && targetNet > 0) {
      // Calculate estimated deduction rate (arrangement fee % + rolled interest rate * months)
      // First, estimate the rate tier by assuming gross ≈ net * 1.2
      const estimatedGrossForRate = targetNet * 1.2;
      const estimatedLtvBucket = this.getLtvBucket(estimatedGrossForRate + (secondChargeFlag ? firstChargeValNum : 0), pv);
      
      let estimatedMonthlyRate = 0;
      if (productKind === 'bridge-var') {
        estimatedMonthlyRate = this.getBridgeVarMargin(estimatedLtvBucket, rateRecord) + (bbrAnnual / 12);
      } else if (productKind === 'bridge-fix') {
        estimatedMonthlyRate = this.getBridgeFixCoupon(estimatedLtvBucket, rateRecord);
      } else if (productKind === 'fusion') {
        const tierInfo = this.getFusionTierInfo(estimatedGrossForRate, rateRecord, bbrAnnual);
        estimatedMonthlyRate = (tierInfo.marginAnnual / 12) + (bbrAnnual / 12);
      }
      
      const deferredMonthlyRate = deferredAnnualRate / 12;
      const estimatedRolledRate = estimatedMonthlyRate * rolled;
      const estimatedDeferredRate = productKind === 'fusion' ? deferredMonthlyRate * term : 0;
      
      // Total deduction rate (as percentage of gross)
      const totalDeductionRate = arrangementPct + estimatedRolledRate + estimatedDeferredRate + (procFeePct / 100);
      
      // Use algebraic formula for initial estimate
      let estimatedGross = targetNet / (1 - totalDeductionRate);
      
      // Iterate to find precise gross loan (accounts for flat fees and title insurance)
      for (let i = 0; i < 10; i++) {
        const tempGross = estimatedGross;
        
        // Calculate all fees based on current gross estimate
        const tempArrangementFee = tempGross * arrangementPct;
        const tempProcFee = tempGross * (procFeePct / 100);
        const tempBrokerFee = parseNumber(brokerFeeFlat) || 0;
        
        // Calculate broker client fee from broker settings
        let tempBrokerClientFee = parseNumber(brokerClientFee) || 0;
        if (brokerSettings?.addFeesToggle && brokerSettings?.additionalFeeAmount) {
          const feeAmount = parseNumber(brokerSettings.additionalFeeAmount);
          if (brokerSettings.feeCalculationType === 'percentage' && tempGross > 0) {
            tempBrokerClientFee = tempGross * (feeAmount / 100);
          } else {
            tempBrokerClientFee = feeAmount;
          }
        }
        
        // Calculate title insurance
        let tempTitleInsurance = 0;
        if (tempGross > 0 && tempGross <= 3000000) {
          const base = tempGross * 0.0013;
          tempTitleInsurance = Math.max(392, base * 1.12);
        }
        
        // Get rate for this gross (rate may change with LTV tier)
        const ltvForRate = this.getLtvBucket(tempGross + (secondChargeFlag ? firstChargeValNum : 0), pv);
        let tempMonthlyRate = 0;
        
        if (productKind === 'bridge-var') {
          tempMonthlyRate = this.getBridgeVarMargin(ltvForRate, rateRecord) + (bbrAnnual / 12);
        } else if (productKind === 'bridge-fix') {
          tempMonthlyRate = this.getBridgeFixCoupon(ltvForRate, rateRecord);
        } else if (productKind === 'fusion') {
          const tierInfo = this.getFusionTierInfo(tempGross, rateRecord, bbrAnnual);
          tempMonthlyRate = (tierInfo.marginAnnual / 12) + (bbrAnnual / 12);
        }
        
        // Calculate rolled and deferred interest
        const tempRolledInterest = tempGross * tempMonthlyRate * rolled;
        const tempDeferredMonthlyRate = deferredAnnualRate / 12;
        const tempDeferred = productKind === 'fusion' ? tempGross * tempDeferredMonthlyRate * term : 0;
        
        // Calculate net with ALL fees
        const calculatedNet = tempGross - tempArrangementFee - tempRolledInterest - tempDeferred - tempProcFee - tempBrokerFee - tempBrokerClientFee - adminFeeAmt - tempTitleInsurance;
        
        // Check if we're close enough (within £1)
        const diff = Math.abs(calculatedNet - targetNet);
        if (diff < 1) {
          gross = Math.ceil(tempGross / 1000) * 1000; // Round up to nearest £1000
          break;
        }
        
        // Adjust estimate based on difference
        const adjustment = targetNet - calculatedNet;
        estimatedGross = tempGross + adjustment;
        
        if (i === 9) {
          // Last iteration - round up
          gross = Math.ceil(estimatedGross / 1000) * 1000;
        }
      }
    }

    // === SECOND CHARGE MAX EXPOSURE CAP ===
    // Business rule: combined exposure (first charge + new gross loan) must not exceed 70% LTV.
    // If user supplied a gross above cap, we reduce (cap) it before any fee/interest calculations.
    // If first charge already exceeds 70%, the loan amount must be zero.
    let capApplied = false;
    let maxSecondChargeGross = null;
    if (secondChargeFlag && pv > 0) {
      const seventyPctPv = pv * 0.70;
      maxSecondChargeGross = Math.max(0, seventyPctPv - firstChargeValNum);
      if (gross > maxSecondChargeGross) {
        gross = maxSecondChargeGross; // Cap
        capApplied = true;
      }
      if (useSpecificNet && targetNet > 0 && gross === 0) {
        // Cannot meet requested specific net due to cap, gross forced to zero
      }
    }

    // === PRECISION ADJUSTMENT FOR SPECIFIC NET (1000 increments) ===
    // After initial solve & cap, if requested net not achieved, increase gross in £1,000 steps
    // until net >= targetNet or cap reached. This ensures monotonic increments and avoids under-delivery.
    let requestedNetLoan = useSpecificNet && targetNet > 0 ? targetNet : null;
    let netTargetMet = false;
    let safetyIterations = 0;
    if (useSpecificNet && targetNet > 0 && gross > 0) {
      const computeNetForGross = (gCandidate) => {
        // Recompute bucket & rates for candidate gross
        const ltvBucketCandidate = this.getLtvBucket(gCandidate + (secondChargeFlag ? firstChargeValNum : 0), pv);
        let couponMonthlyCand = 0;
        let marginMonthlyCand = 0;
        let bbrMonthlyCand = bbrAnnual / 12;
        let marginAnnualCand = 0;
        switch (productKind) {
          case 'bridge-var':
            marginMonthlyCand = this.getBridgeVarMargin(ltvBucketCandidate, rateRecord);
            couponMonthlyCand = marginMonthlyCand;
            break;
          case 'bridge-fix':
            couponMonthlyCand = this.getBridgeFixCoupon(ltvBucketCandidate, rateRecord);
            marginMonthlyCand = couponMonthlyCand;
            bbrMonthlyCand = 0;
            break;
          case 'fusion': {
            const tierInfo = this.getFusionTierInfo(gCandidate, rateRecord, bbrAnnual);
            marginAnnualCand = tierInfo.marginAnnual;
            marginMonthlyCand = tierInfo.marginAnnual / 12;
            couponMonthlyCand = marginMonthlyCand;
            bbrMonthlyCand = bbrAnnual / 12;
            break;
          }
        }
        // Rolled & deferred interest approximations for candidate
        const deferredMonthlyRateCand = deferredAnnualRate / 12;
        const rolledIntCouponCand = gCandidate * (couponMonthlyCand - deferredMonthlyRateCand) * rolled;
        const rolledIntBBRCand = ['bridge-var', 'fusion'].includes(productKind) ? gCandidate * bbrMonthlyCand * rolled : 0;
        const rolledInterestCand = rolledIntCouponCand + rolledIntBBRCand;
        const deferredCand = productKind === 'fusion' ? gCandidate * deferredMonthlyRateCand * term : 0;
        const arrangementFeeCand = gCandidate * arrangementPct;
        const procFeeCand = gCandidate * (procFeePct / 100);
        // Broker client fee from brokerSettings if percentage
        let brokerClientFeeCand = parseNumber(brokerClientFee) || 0;
        if (brokerSettings?.addFeesToggle && brokerSettings?.additionalFeeAmount) {
          const feeAmount = parseNumber(brokerSettings.additionalFeeAmount);
          if (brokerSettings.feeCalculationType === 'percentage' && gCandidate > 0) {
            brokerClientFeeCand = gCandidate * (feeAmount / 100);
          } else {
            brokerClientFeeCand = feeAmount;
          }
        }
        let titleInsuranceCand = null;
        if (gCandidate > 0 && gCandidate <= 3000000) {
          const base = gCandidate * 0.0013;
          titleInsuranceCand = Math.max(392, base * 1.12);
        }
        const netCand = Math.max(0, gCandidate - arrangementFeeCand - rolledInterestCand - deferredCand - procFeeCand - (parseNumber(brokerFeeFlat) || 0) - brokerClientFeeCand - adminFeeAmt - (titleInsuranceCand || 0));
        return { netCand };
      };

      // Evaluate current gross first
      let { netCand: currentNet } = computeNetForGross(gross);
      if (currentNet >= targetNet - 0.5) {
        netTargetMet = true;
        // If we overshot significantly, try to reduce gross in 1000 steps
        if (currentNet > targetNet + 500) {
          while (currentNet > targetNet + 500 && gross > 1000) {
            const testGross = gross - 1000;
            const { netCand: testNet } = computeNetForGross(testGross);
            if (testNet < targetNet - 0.5) {
              // Going down would undershoot, so current gross is optimal
              break;
            }
            gross = testGross;
            currentNet = testNet;
            safetyIterations++;
            if (safetyIterations > 200) break;
          }
        }
      } else {
        // Increment in 1000 steps
        while (currentNet < targetNet - 0.5) {
          // Respect second charge cap
          if (secondChargeFlag && maxSecondChargeGross != null && gross + 1000 > maxSecondChargeGross) {
            gross = maxSecondChargeGross; // final cap adjustment
            capApplied = true;
            ({ netCand: currentNet } = computeNetForGross(gross));
            break; // cannot go further
          }
          gross += 1000;
          ({ netCand: currentNet } = computeNetForGross(gross));
          safetyIterations++;
          if (safetyIterations > 200) break; // guardrail
        }
        if (currentNet >= targetNet - 0.5) netTargetMet = true;
      }
    }

    // === PRIMARY BRIDGE MAX LTV CAP (Non-second charge) ===
    // For standard bridge products (variable/fixed, not fusion and not second charge) read max LTV from rate record.
    // If user enters a gross above the max LTV of property value, reduce and flag.
    let bridgePrimaryCapApplied = false;
    let bridgePrimaryCapGross = null;
    if (!secondChargeFlag && pv > 0 && ['bridge-var','bridge-fix'].includes(productKind)) {
      const maxLtvFromRate = parseNumber(rateRecord?.max_ltv ?? rateRecord?.maxltv ?? rateRecord?.max_LTV);
      // Default to 75% if not specified in rate record
      const maxLtvPercent = Number.isFinite(maxLtvFromRate) && maxLtvFromRate > 0 ? maxLtvFromRate : 75;
      const maxBridgeGross = pv * (maxLtvPercent / 100);
      bridgePrimaryCapGross = maxBridgeGross;
      if (gross > maxBridgeGross) {
        gross = maxBridgeGross;
        bridgePrimaryCapApplied = true;
      }
    }

    // === FUSION MAX LTV CAP ===
    // Fusion products have LTV limits based on property type (from rate record max_ltv)
    // Residential: 75%, Commercial/Semi-Commercial: 70%
    let fusionCapApplied = false;
    let fusionCapGross = null;
    if (!secondChargeFlag && pv > 0 && productKind === 'fusion') {
      const maxLtvFromRate = parseNumber(rateRecord?.max_ltv ?? rateRecord?.maxltv ?? rateRecord?.max_LTV);
      if (Number.isFinite(maxLtvFromRate) && maxLtvFromRate > 0) {
        const maxFusionGross = pv * (maxLtvFromRate / 100);
        fusionCapGross = maxFusionGross;
        if (gross > maxFusionGross) {
          gross = maxFusionGross;
          fusionCapApplied = true;
        }
      }
    }

  // Calculate LTV bucket. For second charge products the bucket is determined on the combined exposure
  const exposureForBucket = gross + (secondChargeFlag ? firstChargeValNum : 0);
  const ltvBucket = this.getLtvBucket(exposureForBucket, pv);

    // Determine rates based on product kind
    let fullAnnualRate = 0; // Full annual rate (including BBR for variable)
    let couponMonthly = 0; // Monthly coupon/margin rate
    let marginMonthly = 0; // Monthly margin (for variable products)
    let marginAnnual = 0; // Annual margin (for Fusion pay rate calculation)
    let tierName = null;
    let bbrMonthly = bbrAnnual / 12;

    switch (productKind) {
      case 'bridge-var': {
        // Variable Bridge: margin + BBR
        marginMonthly = this.getBridgeVarMargin(ltvBucket, rateRecord);
        couponMonthly = marginMonthly;
        fullAnnualRate = (marginMonthly + bbrMonthly) * 12;
        break;
      }

      case 'bridge-fix': {
        // Fixed Bridge: fixed coupon rate
        couponMonthly = this.getBridgeFixCoupon(ltvBucket, rateRecord);
        marginMonthly = couponMonthly;
        fullAnnualRate = couponMonthly * 12;
        bbrMonthly = 0; // No BBR for fixed products
        break;
      }

      case 'fusion': {
        // Fusion: variable rate with tier-based pricing
        const tierInfo = this.getFusionTierInfo(gross, rateRecord, bbrAnnual);
        fullAnnualRate = tierInfo.annualRate;
        tierName = tierInfo.tierName;
        marginAnnual = tierInfo.marginAnnual; // Store annual margin for pay rate calculation
        marginMonthly = tierInfo.marginAnnual / 12;
        couponMonthly = marginMonthly;
        bbrMonthly = bbrAnnual / 12;
        break;
      }

      default:
        throw new Error(`Invalid product kind: ${productKind}`);
    }

    // === FEE CALCULATIONS ===
    const arrangementFeeGBP = gross * arrangementPct;
    const procFeeGBP = gross * (procFeePct / 100);
    const brokerFeeGBP = parseNumber(brokerFeeFlat) || 0;
    // Broker Client Fee: compute from final gross if broker settings are provided
    let brokerClientFeeGBP = parseNumber(brokerClientFee) || 0;
    if (brokerSettings?.addFeesToggle && brokerSettings?.additionalFeeAmount) {
      const feeAmount = parseNumber(brokerSettings.additionalFeeAmount);
      if (brokerSettings.feeCalculationType === 'percentage' && gross > 0) {
        brokerClientFeeGBP = gross * (feeAmount / 100);
      } else {
        brokerClientFeeGBP = feeAmount;
      }
    }

    // === TITLE INSURANCE COST (same formula as BTL) ===
    let titleInsuranceCost = null;
    if (gross > 0 && gross <= 3000000) {
      const base = gross * 0.0013; // 0.13%
      const withIpt = base * 1.12; // +12% IPT
      titleInsuranceCost = Math.max(392, withIpt);
    } else {
      titleInsuranceCost = null; // outside range -> not applicable
    }

    // === INTEREST CALCULATIONS ===
    // Serviced months calculation:
    // - For Bridge: bridging loan term - rolled months
    // - For Fusion: min term (24 months) - rolled months
    const fusionMinTerm = 24;
    const servicedMonths = productKind === 'fusion'
      ? Math.max(fusionMinTerm - rolled, 0)
      : Math.max(term - rolled, 0);
    
    // Deferred interest (annual rate applied to full term, typically for Fusion)
    const deferredMonthlyRate = deferredAnnualRate / 12;
    const deferredGBP = productKind === 'fusion' 
      ? gross * deferredMonthlyRate * term 
      : 0;

    // Rolled interest (upfront interest added to loan)
    // Coupon portion (margin only)
    const rolledIntCoupon = gross * (couponMonthly - deferredMonthlyRate) * rolled;
    
    // BBR portion (for variable products only)
    const rolledIntBBR = ['bridge-var', 'fusion'].includes(productKind)
      ? gross * bbrMonthly * rolled
      : 0;
    
    const rolledInterestGBP = rolledIntCoupon + rolledIntBBR;

    // Serviced interest (monthly interest paid during term)
    // For Fusion: exclude deferred rate from serviced interest
    // For Bridge: use full rate (no deferred component)
    const servicedRate = productKind === 'fusion' 
      ? (fullAnnualRate - deferredAnnualRate) 
      : fullAnnualRate;
    const servicedInterestGBP = gross * (servicedRate / 12) * servicedMonths;

    // Total interest over loan term
    const totalInterest = deferredGBP + rolledInterestGBP + servicedInterestGBP;

    // Full interest components over the entire term (not just rolled)
    // Full Int Coupon = Coupon interest over full term (margin/coupon * gross * term)
    const fullIntCoupon = gross * (couponMonthly - deferredMonthlyRate) * term;
    
    // Full Int BBR = BBR interest over full term (for variable products)
    const fullIntBBR = ['bridge-var', 'fusion'].includes(productKind)
      ? gross * bbrMonthly * term
      : 0;

    // === NET PROCEEDS ===
    const netLoanGBP = Math.max(
      0,
      gross - arrangementFeeGBP - rolledInterestGBP - deferredGBP - procFeeGBP - brokerFeeGBP - brokerClientFeeGBP - adminFeeAmt - (titleInsuranceCost || 0)
    );

    // === MONTHLY PAYMENT ===
    // Monthly payment = serviced interest divided by serviced months
    // When interest is rolled or deferred, monthly payment should be reduced
    const monthlyPaymentGBP = servicedMonths > 0 
      ? servicedInterestGBP / servicedMonths 
      : 0;

    // === LTV CALCULATIONS ===
  const grossLTV = pv > 0 ? (gross / pv) * 100 : 0;
  const combinedGrossLTV = secondChargeFlag && pv > 0 ? (exposureForBucket / pv) * 100 : grossLTV;
    const netLTV = pv > 0 ? (netLoanGBP / pv) * 100 : 0;

    // === APR/APRC CALCULATION ===
    // APRC = Annual Percentage Rate of Charge
    // Formula: ((Total Repayable / Net Proceeds) - 1) / (Term in years) * 100
    const totalAmountRepayable = gross + totalInterest;
    const aprcAnnual = netLoanGBP > 0 
      ? ((totalAmountRepayable / netLoanGBP - 1) / (term / 12)) * 100
      : 0;
    const aprcMonthly = aprcAnnual / 12;

    // === ICR (Interest Coverage Ratio) - Fusion only ===
    // Formula: ((rent + topslice) * 24) / (((yearly_rate - deferred) * grossloan * 2) - rolled_interest)
    // This represents: 2 years of income / 2 years of net interest costs
    let icr = null;
    if (productKind === 'fusion') {
      const totalIncome = rent + topSlice;
      if (totalIncome > 0) {
        // Calculate 2 years of income
        const annualIncome = totalIncome * 24; // 24 months = 2 years
        
        // Calculate 2 years of interest costs (net of deferred) minus rolled
        const yearlyRate = fullAnnualRate; // Already as decimal (e.g., 0.10 for 10%)
        const twoYearsInterest = (yearlyRate - deferredAnnualRate) * gross * 2;
        const netInterestCost = twoYearsInterest - rolledInterestGBP;
        
        if (netInterestCost > 0) {
          icr = (annualIncome / netInterestCost) * 100;
        }
      }
    }

    // === RETURN RESULTS ===
    // NBP = Net Loan + max(2% of gross loan, arrangement fee)
    const maxFeeForNBP = Math.max(gross * 0.02, arrangementFeeGBP);
    const nbp = netLoanGBP + maxFeeForNBP;
    
    // NBP LTV = (NBP / Property Value) * 100
    const nbpLTV = pv > 0 ? (nbp / pv) * 100 : 0;
    
    return {
      // Basic loan metrics
      gross,
      capped: capApplied,
      maxSecondChargeGross,
      bridgePrimaryCapGross,
      bridgePrimaryCapApplied,
      fusionCapGross,
      fusionCapApplied,
      netLoanGBP,
      npb: nbp, // Net Proceeds to Borrower
      nbpLTV, // NBP LTV percentage
      grossLTV,
      netLTV: (netLoanGBP / pv) * 100, // Net LTV based on net loan
      ltv: ltvBucket,
  combinedGrossLTV,
  isSecondCharge: secondChargeFlag,
  firstChargeValue: firstChargeValNum,
      requestedNetLoan,
      netTargetMet,

      // Rates
      fullAnnualRate: fullAnnualRate * 100, // As percentage
      fullRateMonthly: (fullAnnualRate / 12) * 100, // Monthly percentage
      fullCouponRateMonthly: couponMonthly * 100, // Coupon/margin monthly percentage
      
      // Pay Rate: For Fusion = annual margin - deferred (shown yearly), For Bridge = coupon monthly
      payRateMonthly: productKind === 'fusion' 
        ? ((marginAnnual - deferredAnnualRate) * 100)  // Fusion: annual % (margin - deferred)
        : (couponMonthly * 100), // Bridge: monthly coupon rate %
      
      marginMonthly: marginMonthly * 100, // Margin monthly percentage
      bbrMonthly: bbrMonthly * 100, // BBR monthly percentage
      
      // fullRateText: Show annual margin for Fusion, monthly coupon for Bridge
      fullRateText: productKind === 'fusion'
        ? `${(marginAnnual * 100).toFixed(2)}% + BBR` // Fusion: annual margin
        : `${(couponMonthly * 100).toFixed(2)}%${productKind === 'bridge-var' ? ' + BBR' : ''}`, // Bridge: monthly

      // Fees
      arrangementFeeGBP,
      arrangementFeePct: arrangementPct * 100,
      procFeePct,
      procFeeGBP,
      brokerFeeGBP,
      brokerClientFee: brokerClientFeeGBP,
      adminFee: adminFeeAmt,
      productFeePercent: arrangementPct * 100,
      productFeePounds: arrangementFeeGBP,
      titleInsuranceCost,

      // Commitment Fee and Exit Fee (from user inputs)
      commitmentFeePercent: commitmentFee > 0 ? (commitmentFee / gross) * 100 : 0,
      commitmentFeePounds: commitmentFee,
      exitFeePercent: exitFeePct,
      exitFee: gross * (exitFeePct / 100),

      // ERC (Early Repayment Charges) - Fusion only (pulled from rate record, not hardcoded)
      erc1Percent: productKind === 'fusion' ? (parseNumber(rateRecord.erc_1) || 0) : 0,
      erc2Percent: productKind === 'fusion' ? (parseNumber(rateRecord.erc_2) || 0) : 0,
  erc1Pounds: productKind === 'fusion' ? gross * ((parseNumber(rateRecord.erc_1) || 0) / 100) : 0,
  erc2Pounds: productKind === 'fusion' ? gross * ((parseNumber(rateRecord.erc_2) || 0) / 100) : 0,

      // Interest components
      termMonths: term,
      initialTerm: term, // Initial term (same as termMonths for bridging)
      fullTerm: rateRecord?.full_term || term, // Full term from rate record
      rolledMonths: rolled,
      servicedMonths,
      rolledInterestGBP,
      rolledIntCoupon,
      rolledIntBBR,
      fullIntCoupon,
      fullIntBBR,
      deferredGBP,
      deferredInterestRate: deferredAnnualRate * 100,
      servicedInterestGBP,
      totalInterest,

      // Payment
      monthlyPaymentGBP,
      directDebit: monthlyPaymentGBP,

      // APR
      aprcAnnual,
      aprcMonthly,
      totalAmountRepayable,

      // Other
      tier: tierName,
      tierName: tierName,
      icr,
      productKind,
      
      // Additional fields for UI display
      propertyValue: pv,
      rent: rent,
      topSlicing: topSlice,
    };
  }

  /**
   * Convenience method to calculate for a specific rate record
   * Automatically determines product kind from rate record
   */
  static calculateForRate(rateRecord, inputs) {
    const {
      grossLoan,
      propertyValue,
      monthlyRent = 0,
      topSlicing = 0,
      useSpecificNet = false,
      specificNetLoan = 0,
      termMonths,
      bbrAnnual = 0.04,
      procFeePct = 1,
      brokerFeeFlat = 0,
      brokerClientFee = 0,
      rolledMonthsOverride,
      deferredRateOverride,
      commitmentFeePounds = 0,
      exitFeePercent = 0,
      overriddenRate = null,
      productFeeOverridePercent = null,
      // Broker settings for automatic fee calculation
      brokerSettings = null,
      // Second charge inputs
      chargeType = '',
      firstChargeValue = 0,
    } = inputs;

    // Normalize override inputs
    const originalRateValue = parseNumber(rateRecord.rate);
    const parsedOverrideRate = parseNumber(overriddenRate);
    const appliedRateValue = Number.isFinite(parsedOverrideRate)
      ? parsedOverrideRate
      : (Number.isFinite(originalRateValue) ? originalRateValue : 0);

    const originalProductFeeValue = parseNumber(rateRecord.product_fee);
    const parsedProductFeeOverride = parseNumber(productFeeOverridePercent);
    const appliedProductFeeValue = Number.isFinite(parsedProductFeeOverride)
      ? parsedProductFeeOverride
      : (Number.isFinite(originalProductFeeValue) ? originalProductFeeValue : 2);

    const normalizedRateRecord = {
      ...rateRecord,
      rate: appliedRateValue,
      product_fee: appliedProductFeeValue,
      original_rate: Number.isFinite(originalRateValue) ? originalRateValue : null,
      original_product_fee: Number.isFinite(originalProductFeeValue) ? originalProductFeeValue : null,
      applied_rate: appliedRateValue,
      applied_product_fee: appliedProductFeeValue,
    };

    // Calculate broker client fee from broker settings if provided
    let calculatedBrokerClientFee = brokerClientFee;
    if (brokerSettings?.addFeesToggle && brokerSettings?.additionalFeeAmount) {
      const grossValue = parseNumber(grossLoan);
      const feeAmount = parseNumber(brokerSettings.additionalFeeAmount);
      
      if (brokerSettings.feeCalculationType === 'percentage' && grossValue > 0) {
        calculatedBrokerClientFee = grossValue * (feeAmount / 100);
      } else {
        calculatedBrokerClientFee = feeAmount;
      }
    }

    // Calculate broker commission percentage from broker settings
    let calculatedProcFeePct = procFeePct;
    if (brokerSettings?.clientType === 'Broker') {
      calculatedProcFeePct = parseNumber(brokerSettings.brokerCommissionPercent) || 0.9;
    } else if (brokerSettings?.clientType === 'Direct') {
      calculatedProcFeePct = 0;
    }

    // Determine product kind from rate record
    const setKey = (normalizedRateRecord.set_key || '').toString().toLowerCase();
    let productKind = 'bridge-fix';
    
    if (setKey === 'fusion') {
      productKind = 'fusion';
    } else if (setKey.includes('var')) {
      productKind = 'bridge-var';
    } else if (setKey.includes('fix')) {
      productKind = 'bridge-fix';
    }

    // Determine if commercial
    const property = (normalizedRateRecord.property || '').toString().toLowerCase();
    const isCommercial = property.includes('commercial') && !property.includes('semi');

    // Get term: Use max_term from rate record (Bridge/Fusion use min_term/max_term, not initial_term)
    const term = productKind === 'fusion' 
      ? (termMonths || parseNumber(normalizedRateRecord.max_term) || 24)
      : (termMonths || parseNumber(normalizedRateRecord.max_term) || 12);

    // Get arrangement fee from rate record (allow override)
    const arrangementPct = (Number.isFinite(appliedProductFeeValue) ? appliedProductFeeValue : 0) / 100;

    // Get admin fee from rate record
    const adminFee = parseNumber(normalizedRateRecord.admin_fee) || 0;

    // Determine rolled months and deferred rate
    let rolledMonths = 0;
    let deferredAnnualRate = 0;

    if (productKind === 'fusion') {
      // Fusion typically has rolled interest (6-12 months, independent of term)
      const minRolled = parseNumber(normalizedRateRecord.min_rolled_months) || 6;
      const maxRolled = parseNumber(normalizedRateRecord.max_rolled_months) || 12;
      rolledMonths = rolledMonthsOverride !== undefined 
        ? Math.min(Math.max(rolledMonthsOverride, minRolled), maxRolled)
        : minRolled;

      // Fusion: deferred interest defaults to 0, user can adjust up to max_defer_int
      const maxDefer = parseNumber(normalizedRateRecord.max_defer_int) || 0;
      deferredAnnualRate = deferredRateOverride !== undefined
        ? Math.min(deferredRateOverride / 100, maxDefer / 100)
        : 0; // Default to 0, not max
    } else {
      // Bridge products: rolled months cannot exceed loan term
      const minRolled = parseNumber(normalizedRateRecord.min_rolled_months) || 3;
      const maxRolledFromRate = parseNumber(normalizedRateRecord.max_rolled_months) || 18;
      const maxRolled = Math.min(maxRolledFromRate, term); // Cap at loan term
      
      rolledMonths = rolledMonthsOverride !== undefined
        ? Math.min(Math.max(rolledMonthsOverride, minRolled), maxRolled)
        : minRolled;
      
      // Bridge products: deferred interest is always 0 (not supported)
      deferredAnnualRate = 0;
    }

    // Run the calculation
    const results = this.solve({
      productKind,
      grossLoan,
      propertyValue,
  rateRecord: normalizedRateRecord,
      isCommercial,
      bbrAnnual,
      rentPm: monthlyRent,
      topSlicingPm: topSlicing,
      termMonths: term,
      rolledMonths,
      arrangementPct,
      deferredAnnualRate,
      procFeePct: calculatedProcFeePct,
      brokerFeeFlat,
      brokerClientFee: calculatedBrokerClientFee,
      adminFee,
      useSpecificNet,
      specificNetLoan,
      commitmentFeePounds,
      exitFeePercent,
      brokerSettings,
      isSecondCharge: (chargeType || normalizedRateRecord.charge_type || '').toString().toLowerCase().includes('second'),
      firstChargeValue,
    });

    return {
      ...results,
      applied_rate: appliedRateValue,
      original_rate: Number.isFinite(originalRateValue) ? originalRateValue : null,
      applied_product_fee: appliedProductFeeValue,
      original_product_fee: Number.isFinite(originalProductFeeValue) ? originalProductFeeValue : null,
    };
  }
}

/**
 * Named export for compatibility
 */
export const solveBridgeFusion = BridgeFusionCalculator.solve.bind(BridgeFusionCalculator);
export const calculateBridgeFusionForRate = BridgeFusionCalculator.calculateForRate.bind(BridgeFusionCalculator);
