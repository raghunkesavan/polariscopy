/**
 * Bridge & Fusion Calculation Engine --Refactored version
 *
 * Provides methods to calculate gross/net loans, interest rates,
 * monthly payments, and other key metrics for Bridge (variable/fixed)
 * and Fusion products.
 *

 */

import { VARIABLE_RATES, FIXED_RATES, FUSION_BANDS } from '../src/config/bridgeFusionRates';

export class BridgeFusionCalculator {
  /* ==========================================
   *  PRIVATE HELPERS
   * ========================================== */

  /** Round a number up to the nearest step (default: 1000). */
  static #roundUpTo(value, step = 1000) {
    return value > 0 ? Math.ceil(value / step) * step : 0;
  }

  /** Determine the LTV bucket (returns 60, 70, or 75). */
  static #getLtvBucket(gross, propertyValue) {
    const ltvPct = (gross / (propertyValue || 1)) * 100;
    if (ltvPct <= 60) return 60;
    if (ltvPct <= 70) return 70;
    return 75;
  }

  /** Resolve annual full rate for a variable bridge product. */
  static #getBridgeVarRate(bucket, subProduct, bbrPct, overrideMonthly = 0) {
    const margin =
      overrideMonthly > 0 ? overrideMonthly / 100 : VARIABLE_RATES[bucket][subProduct] || 0;
    return (margin + (bbrPct || 0) / 12) * 12;
  }

  /** Resolve annual full rate for a fixed bridge product. */
  static #getBridgeFixRate(bucket, subProduct, overrideMonthly = 0) {
    const coupon =
      overrideMonthly > 0 ? overrideMonthly / 100 : FIXED_RATES[bucket][subProduct] || 0;
    return coupon * 12;
  }

  /** Resolve full annual rate and tier name for a Fusion product. */
  static #getFusionRate(gross, isCommercial, bbrPct, overrideMonthly = 0) {
    const bands = isCommercial ? FUSION_BANDS.Commercial : FUSION_BANDS.Residential;
    const tier = bands.find((b) => gross >= b.min && gross <= b.max);
    const margin = overrideMonthly > 0 ? overrideMonthly / 100 : tier?.margin || 0.04;

    return {
      annualFull: margin + (bbrPct || 0),
      tierName: tier?.name || 'N/A',
    };
  } 

  /* ==========================================
   *  MAIN SOLVER Function 
   * ========================================== */

  /**
   * Computes loan metrics for Bridge or Fusion products.
   *
   * @param {object} args - Calculation parameters.
   * @returns {object} Result metrics.
   */
  static solve(args) {
    const {
      kind,
      grossLoanInput,
      propertyValue,
      subProduct,
      isCommercial,
      bbrPct = 0,
      overrideMonthly = 0,
      rentPm = 0,
      topSlicingPm = 0,
      termMonths = 12,
      rolledMonths = 0,
      arrangementPct = 0.02,
      deferredPct = 0,
      procFeePct = 0,
      brokerFeeFlat = 0,
    } = args;

    const gross = Number(grossLoanInput);
    const bucket = this.#getLtvBucket(gross, propertyValue);
    const bbrMonthly = (bbrPct / 100) / 12;

    let fullAnnual = 0;
    let marginMonthly = 0;
    let couponMonthly = 0;
    let tierName = null;

    // --- Determine rates based on product kind ---
    switch (kind) {
      case 'bridge-var': {
        marginMonthly =
          overrideMonthly > 0 ? overrideMonthly / 100 : VARIABLE_RATES[bucket][subProduct] || 0;
        fullAnnual = (marginMonthly + (bbrPct / 100 / 12)) * 12;
        couponMonthly = marginMonthly;
        break;
      }

      case 'bridge-fix': {
        couponMonthly =
          overrideMonthly > 0 ? overrideMonthly / 100 : FIXED_RATES[bucket][subProduct] || 0;
        fullAnnual = couponMonthly * 12;
        marginMonthly = couponMonthly;
        break;
      }

      case 'fusion': {
        const res = this.#getFusionRate(gross, isCommercial, bbrPct, overrideMonthly);
        fullAnnual = res.annualFull;
        tierName = res.tierName;
        marginMonthly =
          overrideMonthly > 0 ? overrideMonthly / 100 : (fullAnnual - bbrPct) / 12;
        couponMonthly = marginMonthly;
        break;
      }

      default:
        throw new Error(`Invalid product kind: ${kind}`);
    }

    // --- Fees ---
    const arrangementFeeGBP = gross * arrangementPct;
    const procFeeGBP = gross * (procFeePct / 100);
    const brokerFeeGBP = brokerFeeFlat;

    // --- Interest calculations ---
    const monthlyRate = fullAnnual / 12;
    const servicedMonths = termMonths - rolledMonths;

    const rolledIntCoupon = gross * couponMonthly * rolledMonths;
    const rolledIntBBR = ['bridge-var', 'fusion'].includes(kind)
      ? gross * bbrMonthly * rolledMonths
      : 0;
    const rolledInterestGBP = rolledIntCoupon + rolledIntBBR;

    const deferredGBP = kind === 'fusion' ? gross * deferredPct : 0;
    const servicedInterestGBP = gross * monthlyRate * servicedMonths;
    const totalInterest = deferredGBP + rolledInterestGBP + servicedInterestGBP;

    // --- Monthly payments ---
    const monthlyPaymentGBP =
      gross * couponMonthly +
      (['bridge-var', 'fusion'].includes(kind) ? gross * bbrMonthly : 0);

    // --- Net proceeds ---
    const netLoanGBP = Math.max(
      0,
      gross - arrangementFeeGBP - rolledInterestGBP - deferredGBP - procFeeGBP - brokerFeeGBP
    );

    // --- LTV & APR ---
    const grossLTV = (gross / (propertyValue || 1)) * 100;
    const netLTV = (netLoanGBP / (propertyValue || 1)) * 100;

    const totalAmountRepayable = gross + totalInterest;
    const aprcAnnual = ((totalAmountRepayable / netLoanGBP - 1) / (termMonths / 12)) * 100;
    const aprcMonthly = aprcAnnual / 12;

    // --- ICR (Fusion only) ---
    const icr =
      kind === 'fusion'
        ? ((rentPm + topSlicingPm) / (monthlyPaymentGBP || 1))
        : null;

    return {
      // Basic loan metrics
      gross,
      netLoanGBP,
      npb: netLoanGBP,
      grossLTV,
      netLTV,
      ltv: bucket,

      // Rates
      fullAnnualRate: fullAnnual * 100,
      fullRateMonthly: monthlyRate * 100,
      fullCouponRateMonthly: couponMonthly * 100,
      payRateMonthly: monthlyRate * 100,
      fullRateText: `${(fullAnnual * 100).toFixed(2)}%`,

      // Fees
      arrangementFeeGBP,
      procFeePct,
      procFeeGBP,
      brokerFeeGBP,

      // Interest components
      servicedMonths,
      rolledInterestGBP,
      rolledIntCoupon,
      rolledIntBBR,
      deferredGBP,
      servicedInterestGBP,
      totalInterest,

      // Payment
      monthlyPaymentGBP,

      // APR
      aprcAnnual,
      aprcMonthly,

      // Other
      tier: tierName,
      icr,
    };
  }
}

/** Named export for legacy compatibility */
export const solveBridgeFusion = BridgeFusionCalculator.solve.bind(BridgeFusionCalculator);
