import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Link } from '@react-pdf/renderer';
import { styles } from './shared/PDFStyles';
import { btlDipStyles } from './shared/BTLDIPStyles';
import PDFHeader from './shared/PDFHeader';
import PDFFooter from './shared/PDFFooter';
import * as BTLDIPHelpers from './utils/btlDipHelpers';

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
 * BTL DIP PDF - Matches Excel DIP sheet formatting and conditional scenarios
 * 
 * Conditional scenarios implemented:
 * - Product Type: Fixed vs Tracker rate text
 * - Revert Rate: BBR vs MVR based revert text
 * - Property Type: Residential BTL vs Commercial vs Semi-Commercial declarations
 * - Rolled Months: Show/hide based on whether interest is rolled
 * - Deferred Interest: Show/hide based on whether deferred rate is used
 * - Broker Fees: Show/hide broker commission and client fee sections
 * - Number of Applicants: 1-4 signature blocks
 * - Title Insurance: Conditional text about valuation
 */
const BTLDIPPDF = ({ quote, dipData, brokerSettings = {} }) => {
  // Extract all values using helpers
  const h = BTLDIPHelpers;
  
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
  
  // Rate information
  const isTracker = h.isTrackerProduct(quote);
  const isFixed = h.isFixedProduct(quote);
  const initialTerm = h.getInitialTerm(quote);
  const fullTerm = h.getFullTerm(quote);
  const annualRate = h.getAnnualRate(quote);
  const revertRate = h.getRevertRate(quote);
  const isMVRRevert = h.isMVRRevert(quote);
  const aprc = h.getAPRC(quote);
  const monthlyInterestCost = h.getMonthlyInterestCost(quote);
  
  // For tracker products: initial_rate contains the margin rate (stored as margin * 100)
  // For fixed products: initial_rate is the fixed rate itself
  const currentBBR = h.MARKET_RATES.STANDARD_BBR * 100;
  const currentMVR = h.MARKET_RATES.CURRENT_MVR * 100;
  
  // Get margin from initial_rate for tracker products (divide by 100 to get percentage)
  // For tracker: annualRate is stored as margin * 100 (e.g., 259 for 2.59%)
  const trackerMargin = isTracker ? (annualRate / 100) - (currentBBR / 100) : 0;
  
  // Calculate rate payable: for tracker it's margin + BBR, for fixed it's just the rate
  const ratePayable = isTracker ? trackerMargin + currentBBR : annualRate;
  
  // Interest handling
  const hasRolledMonths = h.hasRolledMonths(quote);
  const rolledMonths = h.getRolledMonths(quote);
  const rolledInterestAmount = h.getRolledInterestAmount(quote);
  const hasDeferredInterest = h.hasDeferredInterest(quote);
  const deferredRate = h.getDeferredRate(quote);
  const deferredAmount = h.getDeferredAmount(quote);
  const payRate = h.getPayRate(quote);
  
  // Fees
  const adminFee = h.getAdminFee(quote, dipData);
  const valuationFee = h.getValuationFee(quote, dipData);
  const legalFees = h.getLegalFees(quote, dipData);
  const brokerCommission = h.getBrokerCommission(quote, brokerSettings);
  const brokerClientFee = h.getBrokerClientFee(quote, brokerSettings);
  const hasBrokerFees = h.hasBrokerFees(brokerSettings);
  
  // ERC
  const ercText = h.getERCText(quote);
  const overpaymentText = h.getOverpaymentText(quote, dipData);
  
  // Direct Debit
  const directDebit = h.getDirectDebit(quote);
  const ddStartMonth = h.getDDStartMonth(quote);
  
  // Property type for declarations
  const propertyType = h.getPropertyType(quote, dipData);
  const isCommercial = propertyType === 'Commercial';
  const isSemiCommercial = propertyType === 'Semi-Commercial';
  const isResidentialBTL = propertyType === 'Residential' || propertyType === 'Residential BTL';
  
  // ICR and LTV
  const icr = h.getICR(quote);
  const ltv = h.getLTV(quote);
  
  // Number of applicants for signature blocks
  const numApplicants = h.getNumberOfApplicants(dipData);
  
  // Title insurance - now checks dipData.title_insurance dropdown
  const hasTitleInsurance = h.hasTitleInsurance(quote, dipData);
  const titleInsuranceCost = h.getTitleInsuranceCost(quote);

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

        {/* THE SUMMARY Section - Simple underlined header */}
        <View style={{ marginTop: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'var(--token-color-black)', textDecoration: 'underline' }}>The Summary</Text>
        </View>

        {/* Borrower */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Borrower ("you"):</Text>
          <Text style={btlDipStyles.summaryValue}>{borrowerName}</Text>
        </View>

        {/* Product Type - Based on property type */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Product Type:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.getProductTypeText(quote, dipData)}
          </Text>
        </View>

        {/* Full Term - Conditional text based on Fixed vs Tracker */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Full Term:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {isTracker 
              ? `${fullTerm} years, made up of an initial tracker rate of ${initialTerm} years (the "Initial Tracker Rate Period"), then followed by a variable rate (the "Revert Rate") for the remaining term.`
              : `${fullTerm} years, made up of an initial fixed rate of ${initialTerm} years (the "Initial Fixed Rate Period"), then followed by a variable rate (the "Revert Rate") for the remaining term.`
            }
          </Text>
        </View>

        {/* Annual Interest Rate - Conditional based on product type (Tracker vs Fixed) */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Annual Interest Rate:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {isTracker 
              ? `For the first ${initialTerm} ${initialTerm === 1 ? 'year' : 'years'}, a variable rate made up of the Bank of England Base Rate (BBR), currently ${currentBBR.toFixed(2)}% plus a set margin of ${trackerMargin.toFixed(2)}% giving a current rate payable of ${ratePayable.toFixed(2)}%. ${initialTerm} ${initialTerm === 1 ? 'year' : 'years'} from the date of completion, the interest rate will change to the MFS Variable Rate, currently ${currentMVR.toFixed(2)}% for the remaining ${fullTerm - initialTerm} ${(fullTerm - initialTerm) === 1 ? 'year' : 'years'}.`
              : `For the first ${initialTerm} ${initialTerm === 1 ? 'year' : 'years'} a fixed rate of ${ratePayable.toFixed(2) / 100}%. ${initialTerm} ${initialTerm === 1 ? 'year' : 'years'} from the date of completion, the interest rate will change to the MFS Variable Rate, currently ${currentMVR.toFixed(2)}% for the remaining ${fullTerm - initialTerm} ${(fullTerm - initialTerm) === 1 ? 'year' : 'years'}.`
            }
          </Text>
        </View>

        {/* APRC */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>APRC:</Text>
          <Text style={btlDipStyles.summaryValue}>{aprc}%</Text>
        </View>

        {/* Monthly Interest Cost */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Monthly Interest Cost:</Text>
          <Text style={btlDipStyles.summaryValue}>{h.formatCurrencyWithPence(monthlyInterestCost)}</Text>
        </View>

        {/* Gross Loan Amount */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Gross Loan Amount:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(grossLoan)} on estimated valuation of {h.formatCurrency(propertyValue)}. 
            The Gross Loan is the total principal owed at the end of the term, and is made up of the Net Loan advanced, and the following:
          </Text>
        </View>

        {/* Net Loan */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Net Loan (advanced day 1):</Text>
          <Text style={btlDipStyles.summaryValue}>
            {h.formatCurrency(netLoan)}{hasBrokerFees ? ' (including the Broker Client Fee, as below)' : ''}
          </Text>
        </View>

        {/* Product Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Product Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {productFeePercent.toFixed(2)}% ({h.formatCurrency(productFeeAmount)}) of the Gross Loan Amount
          </Text>
        </View>

        {/* Months Interest Rolled Up - CONDITIONAL: Only show if rolled months > 0 */}
        {hasRolledMonths && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Months Interest Rolled Up:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {rolledMonths} months, equivalent to {h.formatCurrency(rolledInterestAmount)} (deducted from Net Loan at drawdown)
            </Text>
          </View>
        )}

        {/* Deferred Interest - CONDITIONAL: Only show if deferred rate > 0 */}
        {hasDeferredInterest && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Deferred Interest/Pay Rate:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {parseFloat(deferredRate).toFixed(2)}% deferred, equivalent to {h.formatCurrency(deferredAmount)} over {initialTerm * 12} months. 
              Pay Rate now {payRate}% for {isTracker ? 'Initial Tracker Rate Period' : 'Initial Fixed Rate Period'} only 
              (used for Direct Debit payments).
            </Text>
          </View>
        )}

        {/* Broker's Commission - CONDITIONAL: Only show if broker */}
        {hasBrokerFees && brokerCommission > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Broker's Commission:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(brokerCommission)} (to be deducted from the Product Fee)
            </Text>
          </View>
        )}

        {/* Broker Client Fee - CONDITIONAL: Only show if broker client fee exists */}
        {hasBrokerFees && brokerClientFee > 0 && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Broker Client Fee:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrency(brokerClientFee)} (to be deducted from the Net Loan Amount)
            </Text>
          </View>
        )}

        {/* ERC */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Early Repayment Charge (ERC):</Text>
          <Text style={btlDipStyles.summaryValue}>{ercText}</Text>
        </View>

        {/* Overpayments */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Overpayments:</Text>
          <Text style={btlDipStyles.summaryValue}>{overpaymentText}</Text>
        </View>

        {/* Direct Debit Section - includes warning box */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Direct Debit & Start Date:</Text>
          <View style={{ width: '70%' }}>
            <Text style={btlDipStyles.summaryValue}>
              Direct Debit of {h.formatCurrency(directDebit)} will start in month {ddStartMonth} following drawdown from a valid UK bank account.
            </Text>
            <Text style={{ marginTop: 8 }}>
              <Text style={btlDipStyles.warningImportant}>IMPORTANT: </Text>
              <Text style={btlDipStyles.warningText}>
                monthly payments shown in this illustration can be considerably different if a variable rate changes. For example, for every £100,000 borrowed a 0.5% increase would raise the annual cost by £500. Rates may increase by more than this, or be significantly different on the Revert rate so make sure you can afford the monthly payment.
              </Text>
            </Text>
          </View>
        </View>

        {/* Admin Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Admin Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            A non-refundable fee of {h.formatCurrency(adminFee)} per property payable to MFS along with the Valuation Fee.
          </Text>
        </View>

        {/* Valuation Fee */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Valuation Fee:</Text>
          <Text style={btlDipStyles.summaryValue}>
            A non-refundable Valuation Fee of {valuationFee} is to be paid to us or an associated company 
            as directed by us prior to instructing valuers.
          </Text>
        </View>

        {/* Legal Fees */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Legal Fees:</Text>
          <Text style={btlDipStyles.summaryValue}>
            {legalFees === 'TBC' || legalFees === 'TBC by the Underwriter' ? legalFees : `${legalFees} to be payable by you.`}
          </Text>
        </View>

        {/* Title Insurance - CONDITIONAL based on dipData.title_insurance dropdown */}
        {hasTitleInsurance && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Title Insurance Cost:</Text>
            <Text style={btlDipStyles.summaryValue}>
              {h.formatCurrencyWithPence(titleInsuranceCost)} (to be deducted from the net loan amount)
            </Text>
          </View>
        )}

        {/* Security */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Security:</Text>
          <Text style={btlDipStyles.summaryValue}>
            A first legal charge over the Security Property.
          </Text>
        </View>

        {/* Guarantee (if Corporate) */}
        {dipData.applicant_type === 'Corporate' && dipData.guarantor_name && (
          <View style={btlDipStyles.summaryRow}>
            <Text style={btlDipStyles.summaryLabel}>Guarantee:</Text>
            <Text style={btlDipStyles.summaryValue}>
              Personal guarantee from {dipData.guarantor_name}.
            </Text>
          </View>
        )}

        {/* Financial Covenants / ICR */}
        <View style={btlDipStyles.summaryRow}>
          <Text style={btlDipStyles.summaryLabel}>Financial Covenants:</Text>
          <Text style={btlDipStyles.summaryValue}>
            Loan to Value must not exceed {ltv ? `${Math.round(ltv)}%` : '35%'}. Interest Cover to be at least {icr ? `${(icr * 100).toFixed(0)}%` : '134%'}.
          </Text>
        </View>

        <PDFFooter />
      </Page>

      {/* PAGE 2 - Terms of Business */}
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
            This margin may change once the initial rate period has expired (as stated in The Summary). 
            Interest is calculated monthly, and payable by Direct Debit from a verified UK bank account.
          </Text>
          {isTracker && (
            <Text style={btlDipStyles.termsText}>
              If BBR is 0.5% per annum or less, then, for the purposes of calculating your relevant 
              tracker rate, we will treat BBR as 0.5% per annum and apply any margin to that.
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
            Email: privacy@mfsuk.com
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

export default BTLDIPPDF;

