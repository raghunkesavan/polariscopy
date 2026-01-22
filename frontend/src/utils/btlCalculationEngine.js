/**
 * BTL Loan Calculation Engine
 * Handles all BTL loan calculations including gross loan, net loan, fees, ICR, LTV, etc.
 * Based on the integration/calculationEngine.js pattern with enhanced rate table integration
 */

import { parseNumber } from './calculator/numberFormatting';
import { LOAN_TYPES, PRODUCT_GROUPS, PROPERTY_TYPES, getMarketRates } from '../config/constants';

/**
 * Map UI loan type strings to LOAN_TYPES constants
 * The UI uses different strings than the LOAN_TYPES constants
 */
function normalizeLoanType(loanType) {
  if (!loanType) return LOAN_TYPES.MAX_LTV;
  
  const normalized = loanType.toLowerCase().trim();
  
  // Map UI strings to LOAN_TYPES constants
  if (normalized.includes('max') && normalized.includes('gross')) {
    return LOAN_TYPES.MAX_LTV; // "Max gross loan" -> MAX_LTV
  }
  if (normalized.includes('net') && normalized.includes('required')) {
    return LOAN_TYPES.SPECIFIC_NET; // "Net loan required" -> SPECIFIC_NET
  }
  if (normalized.includes('specific') && normalized.includes('gross')) {
    return LOAN_TYPES.SPECIFIC_GROSS; // "Specific gross loan" -> SPECIFIC_GROSS
  }
  if (normalized.includes('specific') && normalized.includes('ltv')) {
    return LOAN_TYPES.MAX_LTV; // "Specific LTV required" -> MAX_LTV
  }
  
  // Check if it's already a LOAN_TYPES constant
  if (Object.values(LOAN_TYPES).includes(loanType)) {
    return loanType;
  }
  
  // Default to MAX_LTV
  return LOAN_TYPES.MAX_LTV;
}

export class BTLCalculationEngine {
  constructor(params) {
    this.params = params;
    this.initialize();
  }

  /** Initialize all calculation parameters */
  initialize() {
    const {
      // Column/Rate identifiers
      colKey,
      selectedRate,
      overriddenRate,
      
      // Input values
      propertyValue,
      monthlyRent,
      specificNetLoan,
      specificGrossLoan,
      maxLtvInput,
      topSlicing,
      
      // Product/Type info
      loanType,
      productType,
      productScope,
      tier,
      selectedRange,
      
      // Criteria answers
      criteria,
      retentionChoice,
      retentionLtv,
      
      // Fee data
      productFeePercent,
      feeOverrides,
      
      // Limits from rate/config
      limits = {},
      
      // Manual slider values (optional)
      manualRolled,
      manualDeferred,
      
      // Broker fees
      brokerRoute,
      procFeePct,
      brokerFeePct,
      brokerFeeFlat,
    } = this.params;

    // --- Core identifiers
    this.colKey = colKey;
    this.selectedRate = selectedRate;
    this.overriddenRate = overriddenRate ?? null;
    this.productType = productType;
    this.productScope = productScope;
    this.tier = tier;
    this.selectedRange = selectedRange;
    this.criteria = criteria || {};
    this.retentionChoice = retentionChoice;
    this.retentionLtv = retentionLtv;
    
    // Normalize loan type
    this.loanType = normalizeLoanType(loanType); // Normalize UI string to LOAN_TYPES constant
    
    this.limits = limits;
    this.brokerRoute = brokerRoute;

    // --- Numeric conversions
    this.propertyValue = parseNumber(propertyValue);
    this.monthlyRent = parseNumber(monthlyRent);
    this.specificNetLoan = parseNumber(specificNetLoan);
    this.specificGrossLoan = parseNumber(specificGrossLoan);
    this.maxLtvInput = parseNumber(maxLtvInput) / 100; // Convert to decimal
    this.topSlicing = parseNumber(topSlicing);

    // --- Fee percentage handling
    const feeValue = feeOverrides?.[colKey] != null ? feeOverrides[colKey] : productFeePercent;
    this.productFeePercent = parseNumber(feeValue);
    this.feePctDecimal = this.productFeePercent / 100;

    // --- Rate setup
    this.baseRate = selectedRate?.rate;
    this.actualRate = this.overriddenRate ?? this.baseRate;
    
    // Check if tracker product
    this.isTracker = /tracker/i.test(productType || '');
    
    // Check if Core/Residential (special rules)
    this.isCore = selectedRange === 'core' || productScope === 'Core';
    this.isResidential = productScope === 'Residential';
    
    // --- Manual slider overrides
    this.manualRolled = manualRolled;
    this.manualDeferred = manualDeferred;
    
    // --- Broker fees
    this.procFeePct = parseNumber(procFeePct) || 0;
    this.brokerFeePct = parseNumber(brokerFeePct) || 0;
    this.brokerFeeFlat = parseNumber(brokerFeeFlat) || 0;

    // --- Limits and constraints from rate record (prioritize rate table values)
    this.minLoan = selectedRate?.min_loan ?? limits.MIN_LOAN ?? 50000;
    this.maxLoan = selectedRate?.max_loan ?? limits.MAX_LOAN ?? 25000000;
    this.termMonths = selectedRate?.initial_term ?? selectedRate?.term_months ?? limits.TERM_MONTHS ?? 24;
    
    // ICR requirements from rate table (primary source)
    this.minimumICR = selectedRate?.min_icr ?? (this.isTracker ? 130 : 145);
    
    // Rolled and deferred limits from rate table
    this.maxRolledMonths = selectedRate?.max_rolled_months ?? limits.MAX_ROLLED_MONTHS ?? 24;
    this.minRolledMonths = selectedRate?.min_rolled_months ?? 0;
    
    this.maxDeferredRate = selectedRate?.max_defer_int ?? limits.MAX_DEFERRED ?? 1.5;
    this.minDeferredRate = selectedRate?.min_defer_int ?? 0;
    
    // Market rates from constants
    const market = getMarketRates();
    this.standardBBR = market.STANDARD_BBR ?? 0.04;
    this.stressBBR = market.STRESS_BBR ?? 0.0425;
    
    // Max LTV from rate table or user input
    this.rateLtvLimit = selectedRate?.max_ltv ? parseNumber(selectedRate.max_ltv) / 100 : null;
    
    // Floor rate from rate table (for Core products)
    this.floorRate = selectedRate?.floor_rate ? parseNumber(selectedRate.floor_rate) : null;
    
    // Max top slicing from rate table (percentage, default 20%)
    this.maxTopSlicingPct = selectedRate?.max_top_slicing ? parseNumber(selectedRate.max_top_slicing) : 20;
    
    // Calculate maximum allowed top slicing value
    this.maxTopSlicingValue = this.monthlyRent * (this.maxTopSlicingPct / 100);
    
    // Validate and cap top slicing to maximum allowed
    if (this.topSlicing > this.maxTopSlicingValue) {
      this.topSlicing = this.maxTopSlicingValue;
    }
  }

  /** Apply floor rate from rate table */
  applyFloorRate(rate) {
    // If rate table has floor_rate column, use that value
    if (this.floorRate !== null && this.floorRate !== undefined) {
      const floorRateDecimal = this.floorRate / 100; // Convert percentage to decimal
      return Math.max(rate, floorRateDecimal);
    }
    
    // No floor rate specified
    return rate;
  }

  /** Compute display rate and stress rate with floor applied */
  computeRates() {
    const { actualRate, isTracker, standardBBR, stressBBR, isCore } = this;
    
    // For tracker, add BBR to get display rate
    const baseDisplayRate = isTracker 
      ? (actualRate / 100) + standardBBR 
      : actualRate / 100;
    
    // For stress calculations, use stress BBR for trackers
    // Stress BBR is used for BOTH core and specialist products
    const baseStressRate = isTracker 
      ? (actualRate / 100) + stressBBR 
      : baseDisplayRate;

    // Apply floor rate ONLY for core products
    // Floor rate is ONLY used for core products in gross loan calculation (ICR constraint)
    return {
      displayRate: baseDisplayRate, // Actual rate for calculations
      displayRateWithFloor: isCore ? this.applyFloorRate(baseDisplayRate) : baseDisplayRate, // Floor rate for core only
      stressRateForICR: isCore ? this.applyFloorRate(baseStressRate) : baseStressRate, // Stress rate with floor for core, without floor for specialist
    };
  }

  /** 
   * Get maximum LTV based on multiple factors:
   * - Rate table max_ltv
   * - Retention LTV rules
   * - User slider input (for Specific LTV loan type)
   * - Property type and tier
   */
  getMaxLTV() {
    const { 
      loanType, 
      maxLtvInput, 
      specificGrossLoan, 
      propertyValue,
      retentionChoice,
      retentionLtv,
      rateLtvLimit,
      productScope,
      tier,
      criteria
    } = this;
    
    // For "Specific LTV required" loan type, prioritize the slider input
    // This allows user to specify exact LTV they want
    if (loanType === LOAN_TYPES.MAX_LTV) {
      // Start with user's slider input
      let maxLtv = maxLtvInput;
      
      // Still respect rate table limit as absolute maximum
      if (rateLtvLimit !== null) {
        maxLtv = Math.min(maxLtv, rateLtvLimit);
      }
      
      // Apply retention rules if applicable
      if (retentionChoice === 'Yes' && retentionLtv) {
        const retentionLimit = parseNumber(retentionLtv) / 100;
        maxLtv = Math.min(maxLtv, retentionLimit);
      }
      
      // Check for special flat-above-commercial rules from criteria
      const hasFlatAboveCommercial = Object.keys(criteria).some(qKey => {
        const answer = criteria[qKey];
        const answerLabel = (answer?.option_label || '').toLowerCase();
        return answerLabel === 'yes' && qKey.toLowerCase().includes('flat');
      });
      
      if (hasFlatAboveCommercial) {
        // Apply tier-based LTV limits for flat above commercial
        const tierNum = parseNumber(tier);
        if (tierNum === 2) {
          maxLtv = Math.min(maxLtv, 0.65); // 65% for tier 2
        } else if (tierNum === 3) {
          maxLtv = Math.min(maxLtv, 0.75); // 75% for tier 3
        }
      }
      
      return maxLtv;
    }
    
    // For specific gross loan, calculate effective LTV from that
    if (loanType === LOAN_TYPES.SPECIFIC_GROSS && specificGrossLoan > 0 && propertyValue > 0) {
      const effectiveLtv = specificGrossLoan / propertyValue;
      // Still respect rate table limit
      if (rateLtvLimit !== null) {
        return Math.min(effectiveLtv, rateLtvLimit);
      }
      return effectiveLtv;
    }
    
    // For other loan types, start with rate table limit or user input
    let maxLtv = rateLtvLimit ?? maxLtvInput;
    
    // Apply retention LTV rules
    if (retentionChoice === 'Yes' && retentionLtv) {
      const retentionLimit = parseNumber(retentionLtv) / 100;
      maxLtv = Math.min(maxLtv, retentionLimit);
    }
    
    // Check for special flat-above-commercial rules from criteria
    const hasFlatAboveCommercial = Object.keys(criteria).some(qKey => {
      const answer = criteria[qKey];
      const answerLabel = (answer?.option_label || '').toLowerCase();
      return answerLabel === 'yes' && qKey.toLowerCase().includes('flat');
    });
    
    if (hasFlatAboveCommercial) {
      // Apply tier-based LTV limits for flat above commercial
      const tierNum = parseNumber(tier);
      if (tierNum === 2) {
        maxLtv = Math.min(maxLtv, 0.65); // 65% for tier 2
      } else if (tierNum === 3) {
        maxLtv = Math.min(maxLtv, 0.75); // 75% for tier 3
      }
    }
    
    return maxLtv;
  }

  /** Compute loan cap based on LTV rules and loan type */
  computeLoanCap() {
    const { 
      propertyValue, 
      specificGrossLoan, 
      specificNetLoan, 
      loanType, 
      maxLoan,
      feePctDecimal 
    } = this;
    
    const maxLtv = this.getMaxLTV();
    
    // Primary LTV-based cap
    const ltvCap = propertyValue > 0 ? maxLtv * propertyValue : Infinity;
    
    // Start with LTV cap and max loan constraint
    let loanCap = Math.min(ltvCap, maxLoan);
    
    // Apply specific gross loan constraint
    if (loanType === LOAN_TYPES.SPECIFIC_GROSS && specificGrossLoan > 0) {
      loanCap = Math.min(loanCap, specificGrossLoan);
    }
    
    // For specific net loan, we calculate max gross that produces the target net
    // This is handled in evaluateLoan via grossFromNet calculation
    
    return loanCap;
  }

  /** Evaluate a specific loan scenario with rolled months and deferred rate */
  evaluateLoan(rolledMonths, deferredRate) {
    const {
      propertyValue,
      monthlyRent,
      topSlicing,
      loanType,
      specificNetLoan,
      termMonths,
      minimumICR,
      feePctDecimal,
      minLoan,
    } = this;

    const { displayRate, displayRateWithFloor, stressRateForICR } = this.computeRates();
    
    // Calculate remaining months after rolled period
    const remainingMonths = Math.max(termMonths - rolledMonths, 1);
    
    // Adjust stress rate by deferred interest (deferred rate reduces payment burden)
    const deferredRateDecimal = deferredRate / 100;
    const stressAdjRate = Math.max(stressRateForICR - deferredRateDecimal, 1e-6);
    
    // --- Calculate rental-based cap (ICR constraint)
    // Use floor rate and stress BBR ONLY for gross loan calculation
    const effectiveRent = monthlyRent + (topSlicing || 0);
    const annualRent = effectiveRent * termMonths;
    
    let maxFromRent = Infinity;
    if (effectiveRent > 0 && stressAdjRate > 0 && minimumICR > 0) {
      // ICR = (Annual Rent) / (Annual Interest)
      // Rearranging: Gross = (Annual Rent) / (ICR/100 * (Rate/12) * RemainingMonths)
      // Use stressRateForICR (includes stress BBR and floor rate) for ICR constraint calculation
      maxFromRent = annualRent / ((minimumICR / 100) * (stressAdjRate / 12) * remainingMonths);
    }
    
    // --- Calculate gross from net loan (for specific net loan type)
    let grossFromNet = Infinity;
    if (loanType === LOAN_TYPES.SPECIFIC_NET && specificNetLoan > 0 && feePctDecimal < 1) {
      const payRateAdj = Math.max(displayRate - deferredRateDecimal, 0);
      
      // Net = Gross * (1 - fee% - payRate/12*rolled - deferredRate/12*term)
      // Rearranging: Gross = Net / (1 - fee% - payRate/12*rolled - deferredRate/12*term)
      const denom = 1 - feePctDecimal - (payRateAdj / 12 * rolledMonths) - (deferredRateDecimal / 12 * termMonths);
      
      if (denom > 1e-7) {
        grossFromNet = specificNetLoan / denom;
      }
    }
    
    // --- Determine eligible gross loan (minimum of all constraints)
    let eligibleGross = Math.min(
      this.computeLoanCap(),
      maxFromRent
    );
    
    // Apply specific net loan constraint
    if (loanType === LOAN_TYPES.SPECIFIC_NET) {
      eligibleGross = Math.min(eligibleGross, grossFromNet);
    }
    
    // Check minimum loan requirement
    if (eligibleGross < minLoan) {
      eligibleGross = 0;
    }
    
    // --- Calculate loan components using actual rate (no floor)
    const payRateAdj = Math.max(displayRate - deferredRateDecimal, 0);
    const productFeeAmt = eligibleGross * feePctDecimal;
    const rolledInterestAmt = eligibleGross * payRateAdj * rolledMonths / 12;
    const deferredInterestAmt = eligibleGross * deferredRateDecimal * termMonths / 12;
    const netLoan = eligibleGross - productFeeAmt - rolledInterestAmt - deferredInterestAmt;
    
    // Calculate LTV
    const ltv = propertyValue > 0 ? eligibleGross / propertyValue : null;
    
    // Calculate ICR (uses actual rate, not floor)
    const icr = this.computeICR(eligibleGross, payRateAdj, rolledMonths, remainingMonths, effectiveRent);
    
    // Calculate direct debit (monthly payment) using actual rate
    const directDebit = eligibleGross > 0 ? eligibleGross * payRateAdj / 12 : 0;
    
    // Calculate serviced months (initial term - rolled months)
    const servicedMonths = this.termMonths - rolledMonths;
    
    return {
      grossLoan: eligibleGross,
      netLoan,
      productFeeAmount: productFeeAmt,
      rolledInterestAmount: rolledInterestAmt,
      deferredInterestAmount: deferredInterestAmt,
      loanToValueRatio: ltv,
      rolledMonths,
      servicedMonths,
      deferredRate,
      paymentRateAdjusted: payRateAdj,
      icr,
      directDebit,
      ddStartMonth: rolledMonths + 1,
    };
  }

  /** Calculate ICR = Annual Rent / Annualized Interest */
  computeICR(grossLoan, payRateAdj, rolledMonths, remainingMonths, effectiveRent) {
    if (!effectiveRent || grossLoan <= 0 || payRateAdj <= 0) return null;
    
    const annualRent = effectiveRent * 12;
    const monthlyInterest = grossLoan * (payRateAdj / 12);
    const annualizedInterest = (monthlyInterest * remainingMonths * 12) / this.termMonths;
    
    return annualRent / annualizedInterest;
  }

  /** 
   * Run full loan computation with optimization
   * 
   * This method implements three loan calculation strategies:
   * 1. MAX_LTV: Calculate max loan based on LTV slider value (respects rate table max)
   * 2. SPECIFIC_GROSS: Use user-specified gross loan amount
   * 3. SPECIFIC_NET: Work backwards from target net loan to find gross loan
   * 
   * For non-Core-Residential products, it optimizes rolled months and deferred 
   * interest % to maximize net loan proceeds while respecting:
   * - LTV limits (from slider for MAX_LTV, or rate table absolute max)
   * - ICR requirements (from rate table)
   * - Min/max loan limits (from rate table)
   * - Floor rates (from rate table floor_rate column)
   * 
   * Market rates (BBR) are sourced from constants.js MARKET_RATES
   */
  compute() {
    const {
      isCore,
      isResidential,
      manualRolled,
      manualDeferred,
      maxRolledMonths,
      minRolledMonths,
      maxDeferredRate,
      minDeferredRate,
      termMonths,
      procFeePct,
      brokerFeePct,
      brokerFeeFlat,
      minLoan,
      maxLoan,
      isTracker,
      actualRate,
      standardBBR,
      productFeePercent,
    } = this;

    let bestLoan = null;
    // Will collect candidates when auto-optimizing so we can select
    // based on scenario-specific cost objectives rather than just max net
    const candidates = [];

    // --- Core & Residential: no rolled/deferred allowed (direct evaluation)
    if (isCore && isResidential) {
      bestLoan = this.evaluateLoan(0, 0);
    }
    // --- Manual input override (user adjusted sliders)
    else if (manualRolled != null || manualDeferred != null) {
      const rolled = Math.min(
        Math.max(minRolledMonths, Number(manualRolled) || 0),
        maxRolledMonths
      );
      const deferred = Math.min(
        Math.max(minDeferredRate, Number(manualDeferred) || 0),
        maxDeferredRate
      );
      bestLoan = this.evaluateLoan(rolled, deferred);
    }
    // --- Auto-optimize across rolled/deferred combinations
    else {
      const step = 0.01; // 0.01% increments for deferred rate (finer granularity)
      const deferredSteps = Math.round(maxDeferredRate / step);
      const maxRolledToTest = Math.min(maxRolledMonths, termMonths);

      for (let r = minRolledMonths; r <= maxRolledToTest; r++) {
        for (let i = 0; i <= deferredSteps; i++) {
          const deferredVal = minDeferredRate + (i * step);
          const candidate = this.evaluateLoan(r, deferredVal);

          // Compute a proxy for total borrower cost for objective selection.
          // This mirrors later totalCostToBorrower (excluding admin/exit/title which
          // are either constant or minor across scenarios) so we can compare.
          const procFeeValueTmp = candidate.grossLoan * (procFeePct / 100);
          const brokerFeeValueTmp = brokerFeeFlat > 0 ? brokerFeeFlat : candidate.grossLoan * (brokerFeePct / 100);
          const servicedInterestTmp = candidate.directDebit * (this.termMonths - candidate.rolledMonths);
          const titleInsuranceTmp = (candidate.grossLoan > 0 && candidate.grossLoan <= 3000000)
            ? Math.max(392, candidate.grossLoan * 0.0013 * 1.12)
            : 0;
          const costProxy = candidate.productFeeAmount + candidate.rolledInterestAmount + candidate.deferredInterestAmount + servicedInterestTmp + procFeeValueTmp + brokerFeeValueTmp + titleInsuranceTmp;

          candidates.push({
            ...candidate,
            costProxy,
            procFeeValueTmp,
            brokerFeeValueTmp,
            servicedInterestTmp,
            titleInsuranceTmp,
          });
        }
      }

      // Scenario-driven selection rules
      const tolerance = 0.5; // currency rounding tolerance
      const loanType = this.loanType;

      if (loanType === LOAN_TYPES.SPECIFIC_NET && this.specificNetLoan > 0) {
        // Prefer meeting target net with minimal cost; tie-breaker lower deferred then rolled
        const meeting = candidates.filter(c => c.netLoan >= this.specificNetLoan - tolerance);
        if (meeting.length > 0) {
          meeting.sort((a, b) => {
            if (a.costProxy !== b.costProxy) return a.costProxy - b.costProxy;
            if (a.deferredRate !== b.deferredRate) return a.deferredRate - b.deferredRate;
            if (a.rolledMonths !== b.rolledMonths) return a.rolledMonths - b.rolledMonths;
            return 0;
          });
          bestLoan = meeting[0];
        } else {
          // Fallback: maximize net then minimize cost among those within 1 of max net
          const maxNet = Math.max(...candidates.map(c => c.netLoan));
            const top = candidates.filter(c => Math.abs(c.netLoan - maxNet) < 1);
            top.sort((a,b)=> a.costProxy - b.costProxy);
            bestLoan = top[0];
        }
      }
      else if (loanType === LOAN_TYPES.SPECIFIC_GROSS && this.specificGrossLoan > 0) {
        const meeting = candidates.filter(c => Math.abs(c.grossLoan - this.specificGrossLoan) <= tolerance || c.grossLoan >= this.specificGrossLoan - tolerance);
        if (meeting.length > 0) {
          meeting.sort((a, b) => {
            if (a.costProxy !== b.costProxy) return a.costProxy - b.costProxy;
            if (a.deferredRate !== b.deferredRate) return a.deferredRate - b.deferredRate;
            if (a.rolledMonths !== b.rolledMonths) return a.rolledMonths - b.rolledMonths;
            return 0;
          });
          bestLoan = meeting[0];
        } else {
          // Fallback choose closest gross below target then minimal cost
          const below = candidates.filter(c => c.grossLoan < this.specificGrossLoan);
          if (below.length > 0) {
            const maxBelow = Math.max(...below.map(c => c.grossLoan));
            const near = below.filter(c => Math.abs(c.grossLoan - maxBelow) < 1);
            near.sort((a,b)=> a.costProxy - b.costProxy);
            bestLoan = near[0];
          } else {
            // absolute fallback minimal cost
            candidates.sort((a,b)=> a.costProxy - b.costProxy);
            bestLoan = candidates[0];
          }
        }
      }
      else { // MAX_LTV and other types: maximize gross then minimize cost among near-max
        const maxGross = Math.max(...candidates.map(c => c.grossLoan));
        const top = candidates.filter(c => Math.abs(c.grossLoan - maxGross) < 1);
        top.sort((a,b)=> {
          if (a.costProxy !== b.costProxy) return a.costProxy - b.costProxy;
          if (a.deferredRate !== b.deferredRate) return a.deferredRate - b.deferredRate;
          if (a.rolledMonths !== b.rolledMonths) return a.rolledMonths - b.rolledMonths;
          return 0;
        });
        bestLoan = top[0];
      }
    }

    if (!bestLoan) return null;
    // If bestLoan contains costProxy meta (auto mode) strip extras silently
    if (bestLoan.costProxy !== undefined) {
      const { costProxy, procFeeValueTmp, brokerFeeValueTmp, servicedInterestTmp, titleInsuranceTmp, ...clean } = bestLoan;
      bestLoan = clean; // retain original evaluated loan shape
    }

    // --- Format output rates
    const displayRate = isTracker ? actualRate + standardBBR : actualRate;
    const fullRateText = `${displayRate.toFixed(2)}%${isTracker ? ' + BBR' : ''}`;
    
    // For core products, pay rate display uses actual rate - deferred (without floor rate)
    // This ensures display shows actual rates, while calculations use floor rate
    const payRateForDisplay = Math.max(actualRate - (bestLoan.deferredRate || 0), 0);
    const payRateText = `${payRateForDisplay.toFixed(2)}%${isTracker ? ' + BBR' : ''}`;

    // --- Calculate broker fees
    const procFeeValue = bestLoan.grossLoan * (procFeePct / 100);
    const brokerFeeValue = brokerFeeFlat > 0
      ? brokerFeeFlat
      : bestLoan.grossLoan * (brokerFeePct / 100);

    // --- Flags
    const belowMin = bestLoan.grossLoan > 0 && bestLoan.grossLoan < minLoan;
    const hitMax = Math.abs(bestLoan.grossLoan - maxLoan) < 1;

    // --- Calculate additional placeholders
    // APRC calculation (simplified - actual APRC requires complex APR calculation)
    const totalInterestCost = bestLoan.rolledInterestAmount + (bestLoan.directDebit * this.termMonths);
    const totalRepayment = bestLoan.grossLoan + totalInterestCost;
    const aprc = bestLoan.grossLoan > 0 
      ? ((totalRepayment - bestLoan.grossLoan) / bestLoan.grossLoan) * (12 / this.termMonths) * 100 
      : null;

    // Admin fee (from rate if available)
    const adminFee = this.selectedRate?.admin_fee || 0;

    // ERC (Early Repayment Charge) schedule from rate columns erc_1..erc_5
    const ercFields = ['erc_1','erc_2','erc_3','erc_4','erc_5'];
    const ercSchedule = [];
    const fmtPct = (n) => {
      const v = parseNumber(n);
      if (!Number.isFinite(v)) return null;
      const s = (v % 1 === 0) ? v.toFixed(0) : v.toFixed(2);
      return `${s}%`;
    };
    ercFields.forEach((key, idx) => {
      const val = this.selectedRate?.[key];
      const f = fmtPct(val);
      if (f) {
        ercSchedule.push({ year: idx + 1, percent: f });
      }
    });
    const ercText = ercSchedule.length > 0
      ? ercSchedule.map(e => `Yr${e.year}: ${e.percent}`).join(' | ')
      : null;

    // Exit fee (from rate if available)
    const exitFee = this.selectedRate?.exit_fee || 0;

    // Revert rate (index + optional margin) from BTL rates per column
    // Supported indexes: 'BBR' (uses MARKET_RATES.STANDARD_BBR), 'MVR' (uses MARKET_RATES.CURRENT_MVR),
    // or a numeric string representing a percent value.
    const revertIndexRaw = this.selectedRate?.revert_index ?? null;
    const revertMarginPct = parseNumber(this.selectedRate?.revert_margin) || 0;
    let revertIndexBasePct = null;
    let revertIndexLabel = null; // For display e.g., 'MVR' or 'BBR'
    if (revertIndexRaw != null && revertIndexRaw !== '') {
      const idx = String(revertIndexRaw).toLowerCase();
      const marketRates = getMarketRates();
      if (idx.includes('bbr')) {
        const bbrDecimal = (this.standardBBR ?? marketRates.STANDARD_BBR);
        revertIndexBasePct = ((bbrDecimal != null ? bbrDecimal : 0) * 100); // decimals -> percent
        revertIndexLabel = 'BBR';
      } else if (idx.includes('mvr')) {
        revertIndexBasePct = (marketRates.CURRENT_MVR || 0) * 100; // decimal to percent
        revertIndexLabel = 'MVR';
      } else {
        const parsed = parseNumber(revertIndexRaw);
        if (Number.isFinite(parsed)) {
          revertIndexBasePct = parsed; // already a percent number
        }
      }
    }
    let revertRate = null;
    let revertRateText = null;
    if (revertIndexBasePct != null) {
      revertRate = revertIndexBasePct + (revertMarginPct > 0 ? revertMarginPct : 0);
      const marginText = revertMarginPct > 0 ? `+${revertMarginPct.toFixed(2)}%` : (revertMarginPct < 0 ? `${revertMarginPct.toFixed(2)}%` : '');
      if (revertIndexLabel) {
        // e.g., MVR+0.40%
        revertRateText = `${revertIndexLabel}${marginText}`;
      } else {
        // e.g., 5.25%+0.40% or just 5.25%
        const baseText = `${revertIndexBasePct.toFixed(2)}%`;
        revertRateText = `${baseText}${marginText}`;
      }
    }
    const revertRateDD = revertRate ? bestLoan.grossLoan * (revertRate / 100) / 12 : null;

    // NBP (Net Borrowing Position) - Uses min of 2% of gross loan or actual product/arrangement fee
    // This ensures we take the lower of the two values
    const nbp = bestLoan.netLoan + Math.min(bestLoan.grossLoan * 0.02, bestLoan.productFeeAmount);
    
    // NBP LTV = (NBP / Property Value) * 100
    const nbpLTV = this.propertyValue > 0 ? (nbp / this.propertyValue) * 100 : 0;

    // Serviced Interest - interest that's paid monthly (not rolled/deferred)
    const servicedInterest = bestLoan.directDebit * (this.termMonths - bestLoan.rolledMonths);

    // Title Insurance Cost per product (based on gross loan):
    // Excel logic: IF(OR(Gross<=0, Gross>3,000,000), "NA", MAX(392, Gross*0.0013*1.12))
    // We return null for NA so UI shows '—'
    let titleInsuranceCost = null;
    if (bestLoan.grossLoan > 0 && bestLoan.grossLoan <= 3000000) {
      const base = bestLoan.grossLoan * 0.0013; // 0.13%
      const withIpt = base * 1.12; // +12%
      titleInsuranceCost = Math.max(392, withIpt);
    } else {
      titleInsuranceCost = null; // outside range -> not applicable
    }

    // Total Cost to Borrower - all fees and interest
    const totalCostToBorrower = 
      bestLoan.productFeeAmount + 
      bestLoan.rolledInterestAmount + 
      bestLoan.deferredInterestAmount + 
      servicedInterest +
      adminFee + 
      exitFee + 
      procFeeValue + 
      brokerFeeValue +
      titleInsuranceCost;

    return {
      // Product info
      productName: `${this.productType}, Tier ${this.tier}`,
      productType: this.productType,
      
      // Rates
      fullRateText,
      actualRateUsed: displayRate,
      isRateOverridden: this.overriddenRate != null,
      payRateText,
      payRate: payRateForDisplay,
      
      // Loan amounts
      grossLoan: bestLoan.grossLoan,
      netLoan: bestLoan.netLoan,
      productFeeAmount: bestLoan.productFeeAmount,
      productFeePercent: productFeePercent,
      rolledInterestAmount: bestLoan.rolledInterestAmount,
      deferredInterestAmount: bestLoan.deferredInterestAmount,
      
      // Ratios
      ltv: bestLoan.loanToValueRatio,
      netLtv: bestLoan.netLoan / this.propertyValue, // Net LTV based on net loan
      icr: bestLoan.icr,
      
      // Payment info
      directDebit: bestLoan.directDebit,
      ddStartMonth: bestLoan.ddStartMonth,
      monthlyInterestCost: bestLoan.directDebit,
      
      // Slider values
      rolledMonths: bestLoan.rolledMonths,
      servicedMonths: bestLoan.servicedMonths,
      deferredCapPct: bestLoan.deferredRate,
      termMonths: this.termMonths,
      initialTerm: this.termMonths, // Initial fixed rate term
      fullTerm: this.selectedRate?.full_term || 300, // Full mortgage term (default 25 years for BTL)
      
      // Broker fees
      procFeePct,
      procFeeValue,
      brokerFeePct,
      brokerFeeValue,
      
      // Flags
      belowMin,
      hitMaxCap: hitMax,
      isManual: manualRolled != null || manualDeferred != null,
      
      // Additional fields for compatibility
      maxLtvRule: this.getMaxLTV(),
      
      // Additional placeholders
      aprc,
      adminFee,
      brokerClientFee: brokerFeeValue, // Alias for broker fee
        ercText,
      erc_1: this.selectedRate?.erc_1 || null,
      erc_2: this.selectedRate?.erc_2 || null,
      erc_3: this.selectedRate?.erc_3 || null,
      erc_4: this.selectedRate?.erc_4 || null,
      erc_5: this.selectedRate?.erc_5 || null,
      exitFee,
      nbp,
      nbpLTV,
  revertRate,
  revertRateText,
      revertRateDD,
      servicedInterest,
      titleInsuranceCost,
      totalCostToBorrower,
      totalLoanTerm: this.termMonths,
      // Min ICR requirement (raw percent e.g. 125)
      minimumIcr: this.minimumICR,
    };
  }
}

/** Wrapper export for compatibility */
export const computeBTLLoan = (params) => new BTLCalculationEngine(params).compute();
