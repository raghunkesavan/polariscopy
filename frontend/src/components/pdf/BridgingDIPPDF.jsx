import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Link } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import { btlDipStyles } from './shared/BTLDIPStyles';
import { PDF_COLORS } from './shared/pdfColorConstants';
import PDFFooter from './shared/PDFFooter';
import * as BridgingDIPHelpers from './utils/bridgingDipHelpers';

// Logo path from public folder
const MFS_LOGO_PATH = '/assets/mfs-logo.png';

// Fixed header styles for every page
const fixedHeaderStyles = StyleSheet.create({
  fixedHeader: {
    position: 'absolute',
    top: 15,
    right: 40,
    width: 80,
    height: 32,
    zIndex: 10,
  },
  logo: {
    width: 80,
    height: 32,
    objectFit: 'contain',
  },
});

/**
 * Bridging DIP PDF - Complete Implementation matching Bridge DIP document
 * 
 * Conditional scenarios implemented:
 * - Product Type: Fusion vs Fixed Bridge vs Variable Bridge
 * - Property Type: Residential vs Commercial vs Semi-Commercial declarations
 * - Rolled Months: Show/hide based on whether interest is rolled
 * - Retention: Show/hide based on retention facility
 * - Minimum Interest Period: 3 months for Bridge, 6 months for Fusion
 * - Minimum Interest Period Fee: Only for Fusion
 * - ERC: Only for Fusion with specific thresholds
 * - ICR: Only for Fusion products
 * - Number of Applicants: 1-4 signature blocks
 * - Security: Based on borrower type (Corporate vs Personal)
 */
const BridgingDIPPDF = ({ quote, dipData, brokerSettings = {} }) => {
  // Extract all values using helpers
  const h = BridgingDIPHelpers;

  const borrowerName = h.getBorrowerName(quote, dipData, brokerSettings);
  const securityAddress = h.getSecurityAddress(dipData);
  const dipDate = h.formatDateLong(dipData.dip_date);
  const dipExpiryDate = h.formatDateLong(dipData.dip_expiry_date);

  // Title number and company number
  const titleNumber = dipData.title_number || 'TBC';
  const companyNumber = dipData.company_number || '';
  const isCorporate = dipData.applicant_type === 'Corporate';

  // Loan details
  const grossLoan = h.getGrossLoan(quote);
  const netLoan = h.getNetLoan(quote);
  const propertyValue = h.getPropertyValue(quote);
  const productFeePercent = h.getProductFeePercent(quote);
  const productFeeAmount = h.getProductFeeAmount(quote);
  const ltv = h.getLTV(quote);

  // Product and term
  const productName = h.getProductName(quote);
  const isFusion = h.isFusion(quote);
  const isFixedBridge = h.isFixedBridge(quote);
  const isVariableBridge = h.isVariableBridge(quote);
  const bridgingTerm = h.getBridgingTerm(quote);
  const chargeType = h.getChargeType(quote);

  // Rate information
  const interestRate = h.getInterestRate(quote);
  const monthlyInterestCost = h.getMonthlyInterestCost(quote);
  const currentBBR = h.MARKET_RATES.STANDARD_BBR * 100;

  // For Fusion and Variable Bridge: display margin + BBR
  const isVariableRate = isFusion || isVariableBridge;
  const marginRate = isVariableRate ? interestRate : 0;
  const totalRate = isVariableRate ? marginRate + currentBBR : interestRate;

  // Interest handling
  const hasRolledMonths = h.hasRolledMonths(quote);
  const rolledMonths = h.getRolledMonths(quote);
  const rolledInterestAmount = h.getRolledInterestAmount(quote);

  // Retention
  const hasRetention = h.hasRetention(quote);
  const retentionAmount = h.getRetentionAmount(quote);

  // Fees
  const adminFee = h.getAdminFee(quote, dipData);
  const valuationFee = h.getValuationFee(quote, dipData);
  const legalFees = h.getLegalFees(quote, dipData);
  const exitFee = h.getExitFee(quote);
  const hasBrokerFees = h.hasBrokerFees(brokerSettings);
  const brokerCommission = h.getBrokerCommission(quote, brokerSettings);
  const brokerClientFee = h.getBrokerClientFee(quote, brokerSettings);
  const commitmentFee = h.parseNumber(quote.commitment_fee) || 0;

  // Property type for declarations
  const propertyType = h.getPropertyType(quote, dipData);
  const isCommercial = propertyType.toLowerCase().includes('commercial') && !propertyType.toLowerCase().includes('semi');
  const isSemiCommercial = propertyType.toLowerCase().includes('semi');
  const isResidential = !isCommercial && !isSemiCommercial;

  // Number of applicants for signature blocks
  const numApplicants = h.getNumberOfApplicants(dipData);

  // Title insurance
  const hasTitleInsurance = h.hasTitleInsurance(quote, dipData);
  const titleInsuranceCost = h.getTitleInsuranceCost(quote);

  // Minimum Interest Period - 3 months for Bridge, 6 months for Fusion
  const minimumInterestPeriod = isFusion ? 6 : 3;

  // Financial Covenants
  const maxLTV = 20; // Fixed at 20% for Bridge
  const minICR = 110; // 110% for Fusion

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo - appears on ALL pages */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Date - Compact header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 5, borderBottom: '1pt solid var(--token-border-medium)' }}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: 'var(--token-color-black)' }}>Decision in Principle</Text>
          <Text style={{ fontSize: 9, color: 'var(--token-text-muted)' }}>{dipDate}</Text>
        </View>

        {/* Proposed Loan To */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Proposed Loan to:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {borrowerName}{isCorporate && companyNumber ? ` (Company No: ${companyNumber})` : ''}
          </Text>
        </View>

        {/* Security Property */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Security Property:</Text>
          <Text style={btlDipStyles.summaryValue}>{securityAddress}</Text>
        </View>

        {/* Title Number */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Title No:</Text>
          <Text style={btlDipStyles.summaryValue}>{titleNumber}</Text>
        </View>

        {/* Current Anticipated 180-Day Market Value */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Current Anticipated 180-Day Market Value:</Text>
          <Text style={btlDipStyles.summaryValue}>{h.formatCurrency(propertyValue)}</Text>
        </View>

        {/* Introduction Text */}
        <View style={btlDipStyles.introSection}>
          <Text style={btlDipStyles.introText}>
            We Market Financial Solutions Limited (hereinafter "MFS", "we", "us") propose to arrange a loan facility 
            to you on the terms, financial particulars and conditions set out below ("the Loan").
          </Text>
          <Text style={btlDipStyles.introText}>
            The Loan itself will be subject to the receipt of a signed Decision in Principle (this document), 
            payment of the Admin and Valuation Fees referred to below, a signed contract, a valuation, 
            responses to MFS enquiries, due diligence, and will be subject to the terms and conditions of 
            a loan agreement (Loan Agreement) which shall be secured by our standard form Security and a 
            Guarantee (both defined in The Summary below).
          </Text>
        </View>

        {/* GDPR Paragraph */}
        <View style={btlDipStyles.introSection}>
          <Text style={btlDipStyles.introText}>
            This Decision in Principle sets out the obligations of Market Financial Solutions regarding data protection 
            and the rights of clients, partners, affiliate, vendor, and any third-party provider in respect of their 
            personal data under The Data Protection Act 2018 ("GDPR").
          </Text>
        </View>

        {/* Summary Introduction */}
        <View style={btlDipStyles.introSection}>
          <Text style={btlDipStyles.introText}>
            The terms of and financial particulars of the Loan are set out in The Summary below.
          </Text>
        </View>

        {/* THE SUMMARY Section - Simple underlined header */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'var(--token-color-black)', textDecoration: 'underline' }}>The Summary</Text>
        </View>

        {/* Borrower */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Borrower ("you"):</Text>
          <Text style={btlDipStyles.summaryValue}>{borrowerName}</Text>
        </View>

        {/* Product Type - Dynamic based on fee_type_selection from Issue DIP Modal */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Product Type:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {(() => {
              const feeType = dipData.fee_type_selection || '';
              if (feeType === 'Fusion') {
                return `Bridge Fusion ${propertyType}`;
              } else if (feeType === 'Fixed Bridge') {
                return `Bridging Loan ${propertyType} with fixed interest rate (as defined below)`;
              } else if (feeType === 'Variable Bridge') {
                return `Bridging Loan ${propertyType} with variable interest rate (as defined below)`;
              }
              // Fallback to old detection logic if fee_type_selection is missing
              return isFusion 
                ? `Bridge Fusion ${propertyType}` 
                : `Bridging Loan ${propertyType} with ${isFixedBridge ? 'fixed' : 'variable'} interest rate (as defined below)`;
            })()}
          </Text>
        </View>

        {/* Loan Term */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Loan Term:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {bridgingTerm} {bridgingTerm === 1 ? 'month' : 'months'}. The Loan Term may be extended by up to 12 months at the Lender's discretion. Further details are set out below.
          </Text>
        </View>

        {/* Annual Interest Rate */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Annual Interest Rate:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {isVariableRate ? (
              <>
                an annual tracker rate of {marginRate.toFixed(2)}% + Bank of England Base Rate (BBR) which is equal to a monthly coupon of {(totalRate / 12).toFixed(2)}%. Following any change to BBR, your mortgage rate and monthly payment will be adjusted on the 1st day of the next calendar month.
              </>
            ) : (
              <>
                {interestRate.toFixed(2)}% per annum for the duration of the loan.
              </>
            )}
          </Text>
        </View>

        {/* Net Loan Amount */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Net Loan Amount (advanced day 1):</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(netLoan)}{hasBrokerFees && brokerClientFee > 0 ? ' (including the Broker Client Fee, as below)' : ''}
          </Text>
        </View>

        {/* Gross Loan Amount */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Gross Loan Amount:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(grossLoan)} (on estimated valuation of {h.formatCurrency(propertyValue)}). LTV must be maintained throughout the life of the Loan. Any increase in BBR will result in an increased interest payment to maintain the initial LTV.
          </Text>
        </View>

        {/* Arrangement Fees */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Arrangement Fees:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(productFeeAmount)} ({productFeePercent.toFixed(2)}% of the Gross Loan Amount)
          </Text>
        </View>

        {/* Months Interest Rolled Up - CONDITIONAL */}
        {hasRolledMonths && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Months Interest Rolled Up:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {rolledMonths} month{rolledMonths !== 1 ? 's' : ''}, equivalent to {h.formatCurrency(rolledInterestAmount)}
            </Text>
          </View>
        )}

        {/* Serviced Monthly Payments */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Serviced Monthly Payments:</Text>
          <View style={{ width: '70%' }}>
            <Text style={btlDipStyles.summaryValue}>
              {hasRetention ? (
                <>Monthly payments of {h.formatCurrencyWithPence(monthlyInterestCost)} will be serviced from the retention facility.</>
              ) : (
                <>Monthly payments of {h.formatCurrencyWithPence(monthlyInterestCost)} will start in month {rolledMonths + 1} following drawdown of the Loan (following the month of the Rolled Up period) from a valid UK bank account.</>
              )}
            </Text>
            {isVariableRate && (
              <Text style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>*Monthly rate is rounded to 2 decimal points; however, Interest Rate is calculated on an annualised rate.</Text>
              </Text>
            )}
            {isVariableRate && (
              <Text style={{ marginTop: 8 }}>
                <Text style={btlDipStyles.summaryValue}>
                  Please note, the amount stated to service the interest monthly is as of today's date & BBR. Any increase in the BBR will require the increased interest cost to be serviced from the 1st day of the next calendar month, regardless of if you are currently in a Rolled Up initial period. Any reduction in BBR will be credited back to you upon redemption.
                </Text>
              </Text>
            )}
            {isVariableRate && (
              <Text style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>IMPORTANT: </Text>
                <Text style={{ fontSize: 8 }}>
                  monthly payments shown in this illustration can be considerably different if a variable rate changes. For every £100,000 borrowed a 0.25% increase in BBR would raise the annual cost by £250. Rates may increase by more than this, or be significantly different on the anticipated Interest Rate so make sure you can afford the monthly payment.
                </Text>
              </Text>
            )}
          </View>
        </View>

        {/* Minimum Interest Period */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Minimum Interest Period:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {minimumInterestPeriod} Months from the date of completion
          </Text>
        </View>

        {/* Minimum Interest Period Fee - FUSION ONLY */}
        {isFusion && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Minimum Interest Period Fee:</Text>
            <View style={{ width: '70%' }}>
              <Text style={btlDipStyles.summaryValue}>
                If any part of the Loan is prepaid during the Minimum Interest Period, the Borrower will pay the Lender an aggregate amount equal to:
              </Text>
              <Text style={{ ...btlDipStyles.summaryValue, marginTop: 4, marginLeft: 8 }}>
                1- the Annual Interest Rate that would have been payable on the amount prepaid from the date of prepayment and up to and including the date falling 6 months after completion; and
              </Text>
              <Text style={{ ...btlDipStyles.summaryValue, marginTop: 4, marginLeft: 8 }}>
                2- 3.0% on the amount repaid.
              </Text>
            </View>
          </View>
        )}

        {/* Broker's Commission - CONDITIONAL */}
        {hasBrokerFees && brokerCommission > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Broker's Commission:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(brokerCommission)} (to be deducted from the Arrangement Fee)
            </Text>
          </View>
        )}

        {/* Early Repayment Charge - FUSION ONLY */}
        {isFusion && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Early Repayment Charge (ERC):</Text>
            <View style={{ width: '70%' }}>
              <Text style={btlDipStyles.summaryValue}>
                1. Any time during the Minimum Interest Period: 3.0% of the amount repaid plus any interest that would have been payable on the amount repaid from the date of repayment up to and including the final day of the Minimum Interest Period
              </Text>
              <Text style={{ ...btlDipStyles.summaryValue, marginTop: 4 }}>
                2. Following the Minimum Interest Period and subject to the ERC Threshold:
              </Text>
              <Text style={{ ...btlDipStyles.summaryValue, marginLeft: 8 }}>
                a. 3.0% of the amount repaid during the first 12 months of the Loan Term;
              </Text>
              <Text style={{ ...btlDipStyles.summaryValue, marginLeft: 8 }}>
                b. 1.5% of the amount repaid months 13 to 21 of the Loan Term; and
              </Text>
              <Text style={{ ...btlDipStyles.summaryValue, marginLeft: 8 }}>
                c. no ERC thereafter.
              </Text>
            </View>
          </View>
        )}

        {/* ERC Threshold - FUSION ONLY */}
        {isFusion && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>ERC Threshold:</Text>
            <Text style={btlDipStyles.summaryValue}>
              Following the Minimum Interest Period until month 21, the Borrower can prepay an aggregate amount of up to 25% of the Gross Loan Amount without any charge.
            </Text>
          </View>
        )}

        {/* Commitment Fee - CONDITIONAL */}
        {commitmentFee > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Commitment Fee:</Text>
            <Text style={btlDipStyles.summaryValue}>
              A Commitment Fee is reasonable estimate of costs for undertaking the process necessary to prepare the Loan for completion (£{commitmentFee.toFixed(0)}) is to be paid to us or an associated company as directed by us on acceptance of this Decision in Principle. This Commitment Fee will be refunded to you by us on completion (drawdown) of the Loan if the Loan itself is completed as instructing Valuers & Solicitors and is payable on acceptance of this Decision in Principle. This represents the cost associated with instructing third party services like National Field Agency for a review of the application and fees incurred in the event of instructing any third party services will be payable by you. The Commitment Fee will not be refunded if the Loan is not completed for reasons such as the property failing to meet valuation, the Loan failing to satisfy customer due diligence, non-disclosure by you, or misrepresentation by you, or any other matter or issue r issue r issue r issue which deems us unable to proceed with providing you the Loan. The Commitment Fee will not be refunded.
            </Text>
          </View>
        )}

        {/* Valuation Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Valuation Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            A non-refundable Valuation Fee of TBC by the Underwriter is to be paid to us or an associated company as directed by us prior to instructing valuers. This represents the cost associated with instructing desktop valuers. We may also instruct third party services like National Field Agency for a review of the application and fees incurred in the event of instructing any third party services will be payable by you.
          </Text>
        </View>

        {/* Legal Fees */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Legal Fees:</Text>
          <Text style={btlDipStyles.summaryValue}>
            At the Borrower's costs, amount to be confirmed.
          </Text>
        </View>

        
           
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Security */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Security:</Text>
          <View style={{ width: '70%' }}>
            {isCorporate ? (
              <>
                <Text style={btlDipStyles.summaryValue}>
                  [A first fixed and floating Debenture (including legal charge over Security Property).]
                </Text>
                <Text style={btlDipStyles.summaryValue}>
                  [A first charge over the shares in the Borrower.]
                </Text>
              </>
            ) : (
              <Text style={btlDipStyles.summaryValue}>
                [A first legal charge of the Security Property.]
              </Text>
            )}
            <Text style={btlDipStyles.summaryValue}>[ANY OTHER SECURITY provided by [ ]]</Text>
          </View>
        </View>

{/* Title Insurance - CONDITIONAL on title_insurance === 'Yes' */}
        {hasTitleInsurance && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Title Insurance:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(titleInsuranceCost)} (made up of 0.13% of the Gross Loan amount, subject to a minimum amount of £350 plus Insurance Premium Tax, currently 12% of premium). Deducted from the Net Loan Amount at completion.
            </Text>
          </View>
        )}

        {/* Guarantee - CONDITIONAL on Corporate */}
        {isCorporate && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Guarantee:</Text>
            <Text style={btlDipStyles.summaryValue}>
              a personal guarantee from {dipData.guarantor_name || 'xxxxxxxxxxx'} for the repayment of the Gross Loan Amount plus all interest, default interest and costs and expenses.
            </Text>
          </View>
        )}

        

        {/* Financial Covenants */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Financial Covenants:</Text>
          <View style={{ width: '70%' }}>
            <Text style={btlDipStyles.summaryValue}>
              Loan to Value must not exceed {maxLTV}%.
            </Text>
            {isFusion && (
              <Text style={btlDipStyles.summaryValue}>
                Interest Cover (received passing rental as a percentage of finance costs) to be at least {minICR}% at all times.
              </Text>
            )}
          </View>
        </View>

        <PDFFooter />
      </Page>

      {/* PAGE 3 - Terms of Business */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo on every page */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>
        
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'var(--token-color-black)', textDecoration: 'underline' }}>TERMS OF BUSINESS</Text>
        </View>

        {/* DIP Expiry */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>DIP Expiry</Text>
          <Text style={btlDipStyles.termsText}>
            Please note that the terms offered are valid for 14 days from the date of this document 
            (until {dipExpiryDate}). If this document is signed and accepted by all applicants within 
            this time, the Loan as per the terms offered within The Summary above must be drawn down 
            within 28 days of the solicitor being instructed. We will regularly check with our 
            solicitors for progress. If the drawdown of the Loan isn't complete by this date you 
            (or your broker/solicitor) will need to contact us to see if an extension can be granted 
            or to make new arrangements. If the Loan is not drawn you will be liable to pay our costs 
            incurred including our solicitors' abortive legal fees and disbursements.
          </Text>
        </View>

        {/* General & Privacy - Full text from Excel */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>General & Privacy</Text>
          <Text style={btlDipStyles.termsText}>
            MFS is arranging this transaction in respect of the proposed Loan. The Loan has been approved in principle by us but remains conditional upon and subject to satisfactory due diligence, payment of any admin and valuation fees, the valuation and enquiries to us and our solicitors. We reserve the right to vary the terms or withdraw the Loan at our discretion, should enquiries, valuation, or due diligence result in any material change to the application as now presented or contradict any information disclosed by you to date, or if we need to change our rates due to unexpected impacts on our funding costs after issuing the DIP (e.g. bank base rate or associated costs increasing). If we decide to vary any of the terms, we will notify you and provide our reasons for doing so and await your consent before proceeding.
          </Text>
          <Text style={btlDipStyles.termsText}>
            By accepting these terms and signing this Decision in Principle, you authorise MFS and its subsidiaries to conduct due diligence checks and data handling either to assess the viability of the application or whilst the Loan is in effect, including:
          </Text>
          <Text style={btlDipStyles.termsTextBullet}>
            • ID, AML, Credit Searches including a payment profile, and KYC (Know Your Customer) fraud checks as well as other Public Information searches we deem necessary from different Credit Reference Agencies (CRAs).
          </Text>
          <Text style={btlDipStyles.termsTextBullet}>
            • Many checks and searches use or share relevant data with third-party external companies and against any specifications on any databases available with relation to your Loan or property. A record of each search carried out will be retained on your credit file initially as a soft footprint (should have no impact on your credit score) but over time and following application it may be set as a hard, or application, footprint (which could have an impact on your credit rating).
          </Text>
          <Text style={btlDipStyles.termsTextBullet}>
            • Data and your evidence documents may also be shared with any of our loan funding providers.
          </Text>
          <Text style={btlDipStyles.termsTextBullet}>
            • If the Loan is drawn, and whilst any balance of the Loan is outstanding, MFS may exchange information and documents about you (and any Loan guarantors) with CRAs, including recording any outstanding debt if you do not repay in full and on time. CRAs may share your information with other organisations. We may also make periodic searches at CRAs to help manage your account with us. The identities of the CRAs, their role also as fraud prevention agencies, the data they hold, the ways in which they use and share personal information, their data retention periods and your data protection rights with the CRAs are explained in the Credit Reference Agency Information Notice (CRAIN), <Link src="https://www.transunion.co.uk/CRAIN" style={btlDipStyles.link}>www.transunion.co.uk/CRAIN</Link>. You can also get further information via our privacy policy at <Link src="https://www.mfsuk.com/privacy-gdpr/" style={btlDipStyles.link}>www.mfsuk.com/privacy-gdpr/</Link>.
          </Text>
          <Text style={btlDipStyles.termsTextBullet}>
            • The personal information we have collected from you will be shared with fraud prevention agencies who will use it to prevent fraud and money-laundering and to verify your identity. If fraud is detected, you could be refused certain services, finance, or employment. Further details of how your information will be used by us and these fraud prevention agencies, and your data protection rights, can be found via our privacy policy at <Link src="https://www.mfsuk.com/privacy-gdpr/" style={btlDipStyles.link}>www.mfsuk.com/privacy-gdpr/</Link> or by going to <Link src="https://www.cifas.org.uk/fpn" style={btlDipStyles.link}>www.cifas.org.uk/fpn</Link>.
          </Text>
          <Text style={btlDipStyles.termsTextBullet}>
            • You have the right to view certain records we hold concerning you and you may request that any inaccuracies are corrected by corresponding with the relevant parties. You may contact our Data Protection Officer at <Link src="mailto:privacy@mfsuk.com" style={btlDipStyles.link}>privacy@mfsuk.com</Link> or by writing to the Data Protection Officer, Market Financial Solutions, 46 Hertford Street, Mayfair, London, W1J 7DP.
          </Text>
        </View>

        {/* Loan Purpose - Full text from Excel - CONDITIONAL based on property type */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Loan Purpose</Text>
          <Text style={btlDipStyles.termsText}>
            More than 60% of the Loan provided is being used for business purposes, and by signing this Decision in Principle you declare to us that the Loan is predominantly for the purposes of a business, profession or trade carried on, or intended to be carried on by you. The Loan will therefore be exempt from the provisions of the Financial Services & Markets Act 2000 and The Mortgage Credit Directive Order 2015 and the Consumer Credit Act 1974 and you will not get the protection afforded by those Acts. You will be required to provide and sign a declaration relating to business purposes before drawdown.
          </Text>
          {dipData.commercial_or_main_residence !== 'Yes' && (
            <>
              <Text style={btlDipStyles.termsText}>
                You confirm to us that the Security Property has never been used as a dwelling by you or any spouse, unmarried partner, civil partner, parents, grandparents, siblings, children and grandchildren or any other related person and will not be occupied by you or any of the above-stated persons or any other related person in the future.
              </Text>
              <Text style={btlDipStyles.termsText}>
                You will be required to sign a declaration to this effect before completion takes place. We will rely upon your declarations when completing the proposed Loan, and such declarations will be a condition of the lending.
              </Text>
              <Text style={btlDipStyles.termsTextBold}>
                Do not sign this Decision in Principle or any declaration unless the above paragraphs are true.
              </Text>
            </>
          )}
        </View>

        <PDFFooter />
      </Page>

      {/* PAGE 3 - Loan Amount and Deduction of Fees */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo on every page */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* Loan Amount and Deduction of Fees - Updated with Title Insurance fee */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Loan Amount and Deduction of Fees</Text>
          <Text style={btlDipStyles.termsText}>
            Please note that the financial particulars in The Summary are, at this stage, estimates only, and are subject to contract. These will only be varied in circumstances where our enquiries reveal information which differs from that provided on initial application or if there is reason to do so at our discretion.
          </Text>
          <Text style={btlDipStyles.termsText}>
            You authorise us to deduct (and/or to instruct our solicitor), any Product Fee (which includes the Broker's Commission as specified in The Summary), Legal Fees and expenses, Title Insurance fee, any Interest (months of interest rolled and deferred until loan redemption), and any other fees, costs, or expenses payable by you (which have not already been paid), from the Gross Loan Amount upon completion of the Loan.
          </Text>
        </View>

        {/* Payments to Broker - CONDITIONAL based on broker client fee amount */}
        {hasBrokerFees && (
          <View style={btlDipStyles.termsSection}>
            <Text style={btlDipStyles.termsSubtitle}>Payments to your Broker/Intermediary</Text>
            {brokerClientFee > 0 ? (
              <>
                <Text style={btlDipStyles.termsText}>
                  You authorise us to deduct the Broker Client Fee from the Net Loan Amount which is in line with your agreement with your Broker/Intermediary and payable to your Broker/Intermediary. No part of the Broker Client Fee is payable to us.
                </Text>
                <Text style={btlDipStyles.termsText}>
                  In addition to any Broker Client Fee, Market Financial Solutions or its investors pay a part of the Product Fee to your Introducer/Broker as Broker's Commission upon drawdown of the Loan, in the amount as specified in The Summary. This means that your Broker/Intermediary may be unable to provide impartial advice about the Loan to you.
                </Text>
              </>
            ) : (
              <Text style={btlDipStyles.termsText}>
                Market Financial Solutions or its investors pay a part of the Product Fee to your Introducer/Broker as Broker's Commission upon drawdown of the Loan, in the amount as specified in The Summary. This means that your Broker/Intermediary may be unable to provide impartial advice about the Loan to you.
              </Text>
            )}
          </View>
        )}

        {/* Interest Rate Applied */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Interest Rate Applied</Text>
          <Text style={btlDipStyles.termsText}>
            The rate of interest payable on the Gross Loan Amount will be the Interest Rate in The Summary. 
            Interest is calculated monthly{isVariableRate ? ', and payable from a valid UK bank account' : ', and payable by Direct Debit from a verified UK bank account'}.
          </Text>
          {isVariableRate && (
            <Text style={btlDipStyles.termsText}>
              If BBR is 0.5% per annum or less, then, for the purposes of calculating your relevant 
              rate, we will treat BBR as 0.5% per annum and apply any margin to that.
            </Text>
          )}
        </View>

        {/* Term of Loan */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Term of Loan</Text>
          <Text style={btlDipStyles.termsText}>
            The Loan shall be for the Loan Term, which will commence from the date of drawdown of 
            the Loan. Please note that this is an interest only BTL Loan facility, and you must be 
            in a position to repay the capital in full at the end of the Term. You should not assume 
            that the Loan Term will be extended.
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* PAGE 3 - Tariff of Charges */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo on every page */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>
        
        {/* Tariff of Charges Header */}
        <View style={{ marginTop: 10, marginBottom: 5 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'var(--token-color-black)', textAlign: 'center' }}>Fee Structure Table - Post Completion</Text>
        </View>

        {/* Fee Structure Table - Post Completion */}
        <View style={btlDipStyles.tariffTable}>
          <View style={btlDipStyles.tariffHeader}>
            <Text style={btlDipStyles.tariffHeaderCell}>Fee</Text>
            <Text style={btlDipStyles.tariffHeaderCellRight}>Charges from</Text>
          </View>
          
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Chaps Fee</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Data Request</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Building Insurance</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Expiry/Renewal of Buildings Insurance</Text>
            <Text style={btlDipStyles.tariffCellRight}>£500</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Duplicate or Interim Statement (per Statement)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£35</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Calculating Settlement Figures for 3rd time onwards</Text>
            <Text style={btlDipStyles.tariffCellRight}>£55</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Approval of Tenancy Agreement</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Deed of Postponement (per Deed required to be executed)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Unpaid Ground Rent or Service Charge</Text>
            <Text style={btlDipStyles.tariffCellRight}>£75</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Repayment Administration Fee (per Property being discharged)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£475</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Deeds Handling</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Part Sale / Transfer of Security (per part sale/transfer)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Consent to Another Lender (per Consent granted)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Approval of Easement</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Part Repayment (per part-payment)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£75</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Instructing Solicitors</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Mortgage Reference or Questionnaire</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Confirmation of Payment History</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Unpaid/Declined/Dishonoured Direct Debit or Cheque</Text>
            <Text style={btlDipStyles.tariffCellRight}>£25</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Set Up Fee</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Loan Administration Fee</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Asset Manager Fee</Text>
            <Text style={btlDipStyles.tariffCellRight}>£0</Text>
          </View>
        </View>

        {/* Fee Structure Table - In event of Default */}
        <View style={{ marginTop: 10, marginBottom: 5 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'var(--token-color-black)', textAlign: 'center' }}>Fee Structure Table - In event of Default</Text>
        </View>
        
        <View style={btlDipStyles.tariffTable}>
          <View style={btlDipStyles.tariffHeader}>
            <Text style={btlDipStyles.tariffHeaderCell}>Fee</Text>
            <Text style={btlDipStyles.tariffHeaderCellRight}>Charges from</Text>
          </View>
          
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Letters and Calls to Customers (per letter or call)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£35</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Letter and Calls to Third Parties (per letter or call)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£35</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Instruction of Collection Agents</Text>
            <Text style={btlDipStyles.tariffCellRight}>£100</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Issue of Default Notice</Text>
            <Text style={btlDipStyles.tariffCellRight}>£70</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Issue of Possession Proceedings</Text>
            <Text style={btlDipStyles.tariffCellRight}>£150</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Court Preparation Fee (per hearing)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£195</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Court Hearing Fee (per hearing)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Issuing a Warrant for Possession</Text>
            <Text style={btlDipStyles.tariffCellRight}>£175</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Borrowers Application to Suspend our Legal Action</Text>
            <Text style={btlDipStyles.tariffCellRight}>£155</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Repossession of Property (per property)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£175</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Administration of an Account in Possession (per month)</Text>
            <Text style={btlDipStyles.tariffCellRight}>£250</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Realisation of the Sale of a Repossessed Property</Text>
            <Text style={btlDipStyles.tariffCellRight}>£300</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Issuing a Demand to Appoint a Receiver</Text>
            <Text style={btlDipStyles.tariffCellRight}>£750</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Appointing a Receiver to Manage the Account</Text>
            <Text style={btlDipStyles.tariffCellRight}>£2,500</Text>
          </View>
          <View style={btlDipStyles.tariffRow}>
            <Text style={btlDipStyles.tariffCell}>Director's Time (where applicable) per hour</Text>
            <Text style={btlDipStyles.tariffCellRight}>£150</Text>
          </View>
          <View style={btlDipStyles.tariffRowAlt}>
            <Text style={btlDipStyles.tariffCell}>Monthly Arrears Management Fee</Text>
            <Text style={btlDipStyles.tariffCellRight}>£400</Text>
          </View>
        </View>

        <Text style={btlDipStyles.termsTextSmall}>
          Please see the enclosed Appendix – Schedule 1 for the explanation of each charge outlined within the Fee structure tables.
        </Text>

        {/* Valuation Fee and Legal Fees Section - continued on same page */}
        <View style={{ ...btlDipStyles.termsSection, marginTop: 15 }}>
          <Text style={btlDipStyles.termsSubtitle}>Valuation Fee and Legal Fees</Text>
          <Text style={btlDipStyles.termsText}>
            The fees for the valuation of the Property shall be your cost and will be collected in advance upon acceptance of this Decision in Principle. You will be responsible for our Legal Fees in relation to the Loan. These are set out in the Financial Summary. You will be responsible for these fees whether the Loan proceeds to completion or not. Our solicitors will require payment in full or your solicitors' undertaking to make payment before commencing work. With regards to the Valuation report, unless Title Insurance is used, once our Solicitors have conducted their Report on Title it will need to be sent to the valuer for their comments. Any detrimental impact, or adverse comments from the Valuer may result in MFS not being able to proceed with the Loan or varying the terms offered.
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* PAGE 4 - Additional Terms & Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Fixed Logo on every page */}
        <View style={fixedHeaderStyles.fixedHeader} fixed>
          <Image style={fixedHeaderStyles.logo} src={MFS_LOGO_PATH} />
        </View>

        {/* No Legally Binding Agreement */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>No Legally Binding Agreement</Text>
          <Text style={btlDipStyles.termsText}>
            You acknowledge and agree that we do not, and will not, provide any financial, accounting, taxation or legal advice in relation to the Loan (and this includes any advice as to the suitability of the Loan for you).
          </Text>
          <Text style={btlDipStyles.termsText}>
            You acknowledge that nothing in this Decision in Principle is to be construed so as to constitute or imply a commitment to provide the Loan, nor a representation that the Loan will be made available. Any such commitment is subject to contract, credit approval, valuation and satisfactory due diligence and documentation.
          </Text>
          <Text style={btlDipStyles.termsText}>
            This letter may be signed in counterparts and emailed scanned versions and this has the same effect as if the signatures on the counterparts were on a single copy of the letter.
          </Text>
          <Text style={btlDipStyles.termsTextBold}>
            You should seek your own independent advice in relation to this Decision in Principle.
          </Text>
        </View>

        {/* Assignment */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Assignment</Text>
          <Text style={btlDipStyles.termsText}>
            In some instances, we may arrange to assign or transfer the Loan to such entity associated with us, as we deem fit at our discretion. The Terms will not change. If we do assign the Loan you will be notified of the change of lender and be provided with contact and payment details. You may not assign the Loan or its benefit or obligations to any other party or property other than the one stated.
          </Text>
        </View>

        {/* Agency and Conflict of Interest */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Agency and Conflict of Interest</Text>
          <Text style={btlDipStyles.termsText}>
            You acknowledge that we do not act as your agent and therefore do not owe you a duty of care in this regard. When signing this Decision in Principle you expressly waive any claim you may now or in the future seek to bring. You agree to waive any claim to a conflict of interest arising out of any assignment of the Loan or the Loan itself.
          </Text>
        </View>

        {/* Indemnity */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Indemnity</Text>
          <Text style={btlDipStyles.termsText}>
            You agree to indemnify and hold us harmless (including all of our employees, and assignees and their employees' agents or directors, agents and directors) against all claims, losses, damages, liabilities, costs and expenses whether consequential or not, incurred or arising out of or related to any actual or threatened claim against us (or any of its employees, agents and directors and assignees etc.), brought by any guarantor or any other party to the Loan (except for instances where such liability arises through direct gross negligence or fraud) or in relation to the Loan. Please note, your solicitors must hold sufficient professional indemnity insurance to cover the Gross Loan Amount.
          </Text>
        </View>

        {/* Data Breach Notification */}
        <View style={btlDipStyles.termsSection}>
          <Text style={btlDipStyles.termsSubtitle}>Data Breach Notification</Text>
          <Text style={btlDipStyles.termsText}>
            All personal data breaches must be reported immediately to the Company's Data Protection Officer.
          </Text>
          <Text style={btlDipStyles.termsText}>
            Data Protection Officer Contact details:
          </Text>
          <Text style={btlDipStyles.termsText}>
            Martin Schofield
          </Text>
          <Text style={btlDipStyles.termsText}>
            Email: <Link src="mailto:privacy@mfsuk.com" style={btlDipStyles.link}>privacy@mfsuk.com</Link>
          </Text>
          <Text style={btlDipStyles.termsText}>
            Data Controller: Market Financial Solutions Limited.
          </Text>
        </View>

        {/* Signature Section - CONDITIONAL based on number of applicants */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'var(--token-color-black)', textDecoration: 'underline' }}>Signed by each Borrower</Text>
        </View>

        <View style={btlDipStyles.signatureGrid}>
          {/* Applicant 1 - Always shown */}
          <View style={btlDipStyles.signatureBlock}>
            <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
            <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
            <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
            <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
          </View>

          {/* Applicant 2 - Show if >= 2 applicants */}
          {numApplicants >= 2 && (
            <View style={btlDipStyles.signatureBlock}>
              <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
              <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
            </View>
          )}
        </View>

        {/* Additional applicants 3-4 */}
        {numApplicants >= 3 && (
          <View style={btlDipStyles.signatureGrid}>
            <View style={btlDipStyles.signatureBlock}>
              <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
              <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
              <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
            </View>

            {numApplicants >= 4 && (
              <View style={btlDipStyles.signatureBlock}>
                <Text style={btlDipStyles.signatureLine}>Signature: _____________________________</Text>
                <Text style={btlDipStyles.signatureLabel}>Name of Signatory: _____________________________</Text>
                <Text style={btlDipStyles.signatureLabel}>(Print Name)</Text>
                <Text style={btlDipStyles.signatureLabel}>Date: _____________________________</Text>
              </View>
            )}
          </View>
        )}

        <PDFFooter />
      </Page>
    </Document>
  );
};

export default BridgingDIPPDF;
