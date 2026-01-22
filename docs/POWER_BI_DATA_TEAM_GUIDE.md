# Power BI Reporting API - Data Team Guide

## 🎯 Overview

This API provides secure, read-only access to quotes data for Power BI dashboards and reporting. It uses API key authentication (separate from user logins) and is optimized for Power BI's Web connector.

---

## 🔐 Authentication

### Getting an API Key

1. **Request from Admin**: Contact a platform administrator (access level 1) to create an API key
2. **Admin creates key**: Admin logs into the platform and navigates to API Key Management
3. **Secure storage**: Store the API key securely - it's only shown once during creation

### Using the API Key

Include the API key in every request header:

```http
X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxx
```

**Security Notes:**
- Never commit API keys to version control
- Store in Power BI's secure credential storage
- Rotate keys periodically (admins can revoke/create new ones)
- Each key tracks last usage for auditing

---

## 📊 API Endpoints

### Base URL
```
Production: https://polaristest.onrender.com/api/reporting
Development: http://localhost:3001/api/reporting
```

### 1. Get Quotes Data (Paginated)

**Endpoint:** `GET /api/reporting/quotes`

**Description:** Returns flattened quotes with all calculation results. Paginated for large datasets.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `pageSize` | integer | 1000 | Results per page (max: 5000) |
| `from` | ISO 8601 date | - | Filter quotes created after this date |
| `to` | ISO 8601 date | - | Filter quotes created before this date |
| `status` | string | - | Filter by status (DRAFT, QUOTE ISSUED, DIP ISSUED) |
| `calculator_type` | string | - | Filter by type (btl, bridging) |
| `reference_number` | string | - | Search by reference number (partial match) |
| `user_id` | UUID | - | Filter by user ID |

**Example Request:**
```http
GET https://polaristest.onrender.com/api/reporting/quotes?page=1&pageSize=1000&from=2025-01-01&calculator_type=btl
X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxx
```

**Response Structure:**
```json
{
  "metadata": {
    "page": 1,
    "pageSize": 1000,
    "totalRecords": 5432,
    "totalPages": 6,
    "filters": {
      "from": "2025-01-01",
      "calculator_type": "btl"
    },
    "timestamp": "2026-01-05T10:30:00Z",
    "apiKeyName": "Power BI - Data Team"
  },
  "data": [
    {
      "reference_number": "REF-2025-001",
      "quote_id": "uuid-here",
      "quote_name": "123 High Street",
      "calculator_type": "btl",
      "stage": "QUOTE",
      "status": "QUOTE ISSUED",
      "quote_issued_at": "2025-01-05T09:00:00Z",
      "dip_issued_at": null,
      "borrower_type": "Limited Company",
      "borrower_name": "Smith Ltd",
      "company_name": "Smith Properties Ltd",
      "result_number": 1,
      "total_results": 3,
      "fee_column": "2-3%",
      "product_name": "BTL Fixed 5yr",
      "gross_loan": 400000,
      "net_loan": 392000,
      "loan_amount": 400000,
      "ltv": 75,
      "ltv_percentage": 75.5,
      "net_ltv": 74.0,
      "property_value": 530000,
      "icr": 145,
      "initial_rate": 5.49,
      "pay_rate": 5.49,
      "revert_rate": 6.99,
      "revert_rate_dd": 6.89,
      "full_rate": 5.49,
      "aprc": 6.12,
      "deferred_rate": null,
      "product_fee_percent": 2.5,
      "product_fee_pounds": 10000,
      "admin_fee": 199,
      "broker_client_fee": 0,
      "broker_commission_proc_fee_percent": 0.5,
      "broker_commission_proc_fee_pounds": 2000,
      "commitment_fee_pounds": 0,
      "exit_fee": 0,
      "monthly_interest_cost": 1830,
      "rolled_months": 0,
      "rolled_months_interest": 0,
      "deferred_interest_percent": 0,
      "deferred_interest_pounds": 0,
      "serviced_interest": 21960,
      "direct_debit": 1830,
      "erc": "5,4,3,2,1",
      "erc_fusion_only": null,
      "rent": 2500,
      "top_slicing": 0,
      "nbp": 380000,
      "total_cost_to_borrower": 32159,
      "full_term": 300,
      "created_at": "2025-01-05T08:30:00Z",
      "updated_at": "2025-01-05T09:00:00Z",
      "user_id": "uuid-here"
    }
  ]
}
```

**Data Dictionary:**

**Quote Identifiers:**
- `reference_number`: Unique quote reference
- `quote_id`: Internal database ID
- `quote_name`: Property address or name
- `calculator_type`: btl or bridging

**Status Tracking:**
- `stage`: QUOTE or DIP
- `status`: DRAFT, QUOTE ISSUED, or DIP ISSUED
- `quote_issued_at`: Timestamp when quote was issued
- `dip_issued_at`: Timestamp when DIP was issued

**Borrower Information:**
- `borrower_type`: Individual, Limited Company, LLP, Trust, etc.
- `borrower_name`: Name of borrower(s)
- `company_name`: Company name if applicable

**Result Details:**
- `result_number`: Position in results (1, 2, 3...)
- `total_results`: Total number of results for this quote
- `fee_column`: Fee band (0-2%, 2-3%, 3%+)
- `product_name`: Lender product name

**Loan Details:**
- `gross_loan`: Loan amount before fees
- `net_loan`: Loan amount after product fee deduction
- `loan_amount`: Total loan amount
- `property_value`: Property valuation

**LTV Calculations:**
- `ltv`: Overall LTV percentage
- `ltv_percentage`: Gross LTV
- `net_ltv`: Net LTV (after fee deduction)

**Rates (all in % per annum):**
- `icr`: Interest Coverage Ratio
- `initial_rate`: Initial fixed/discounted rate
- `pay_rate`: Rate borrower pays
- `revert_rate`: Reversion rate (SVR)
- `revert_rate_dd`: Reversion rate with direct debit discount
- `full_rate`: Fully loaded rate
- `aprc`: Annual Percentage Rate of Charge
- `deferred_rate`: Deferred interest rate

**Fees (all in £):**
- `product_fee_percent`: Product fee as percentage
- `product_fee_pounds`: Product fee in pounds
- `admin_fee`: Lender admin fee
- `broker_client_fee`: Broker fee charged to client
- `broker_commission_proc_fee_percent`: Broker commission %
- `broker_commission_proc_fee_pounds`: Broker commission £
- `commitment_fee_pounds`: Lender commitment fee
- `exit_fee`: Exit/redemption fee

**Interest Calculations (£):**
- `monthly_interest_cost`: Monthly interest payment
- `rolled_months`: Number of months interest is rolled
- `rolled_months_interest`: Total rolled interest
- `deferred_interest_percent`: Deferred interest %
- `deferred_interest_pounds`: Deferred interest amount
- `serviced_interest`: Total serviced interest over term
- `direct_debit`: Monthly direct debit amount

**Additional Fields:**
- `erc`: Early Repayment Charges schedule
- `rent`: Monthly rental income
- `top_slicing`: Top slicing amount
- `nbp`: Net Business Proceeds
- `total_cost_to_borrower`: Total cost including all fees
- `full_term`: Full loan term in months

**Timestamps:**
- `created_at`: Quote creation timestamp
- `updated_at`: Last modification timestamp
- `user_id`: User who created the quote

---

### 2. Get Summary Statistics

**Endpoint:** `GET /api/reporting/quotes/summary`

**Description:** Returns aggregated statistics for dashboard KPIs.

**Query Parameters:**
- `from` - Start date filter
- `to` - End date filter
- `calculator_type` - Filter by calculator type

**Example Request:**
```http
GET /api/reporting/quotes/summary?from=2025-01-01&to=2025-01-31
X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxx
```

**Response:**
```json
{
  "total_quotes": 1234,
  "by_calculator_type": {
    "btl": 890,
    "bridging": 344
  },
  "by_status": {
    "draft": 456,
    "quote_issued": 678,
    "dip_issued": 100
  },
  "date_range": {
    "from": "2025-01-01",
    "to": "2025-01-31"
  },
  "generated_at": "2026-01-05T10:30:00Z"
}
```

---

### 3. Health Check

**Endpoint:** `GET /api/reporting/health`

**Description:** Verify API key is working and service is available.

**Example Request:**
```http
GET /api/reporting/health
X-API-Key: pk_live_xxxxxxxxxxxxxxxxxxxx
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-05T10:30:00Z",
  "apiKey": "Power BI - Data Team"
}
```

---

## 🔄 Rate Limits

**Reporting API:**
- **100 requests per hour** per API key
- Sufficient for hourly Power BI scheduled refreshes
- Rate limit headers included in response:
  - `RateLimit-Limit`: Maximum requests allowed
  - `RateLimit-Remaining`: Requests remaining in window
  - `RateLimit-Reset`: Timestamp when limit resets

**Rate Limit Exceeded Response:**
```json
{
  "error": "Reporting API rate limit exceeded. Please wait before making more requests.",
  "retryAfter": "1 hour"
}
```

---

## 📊 Power BI Setup Guide

### Method 1: Web Connector (Recommended)

1. **Open Power BI Desktop**

2. **Get Data → Web**

3. **Configure Connection:**
   - URL: `https://your-domain.com/api/reporting/quotes?pageSize=5000`
   - Advanced → Add HTTP headers:
     - Header: `X-API-Key`
     - Value: `pk_live_xxxxxxxxxxxxxxxxxxxx`

4. **Transform Data:**
   - Expand the `data` column
   - Select columns needed for your report
   - Set data types appropriately

5. **Load Data** and create visuals

### Method 2: Pagination (for large datasets)

Use Power Query M to fetch all pages:

```m
let
    // Configuration
    BaseUrl = "https://your-domain.com/api/reporting/quotes",
    ApiKey = "pk_live_xxxxxxxxxxxxxxxxxxxx",
    PageSize = 5000,
    
    // Function to get a single page
    GetPage = (pageNum as number) =>
        let
            Url = BaseUrl & "?page=" & Number.ToText(pageNum) & "&pageSize=" & Number.ToText(PageSize),
            Headers = [#"X-API-Key" = ApiKey],
            Response = Json.Document(Web.Contents(Url, [Headers=Headers])),
            Data = Response[data],
            Metadata = Response[metadata]
        in
            [Data = Data, Metadata = Metadata],
    
    // Get first page to determine total pages
    FirstPage = GetPage(1),
    TotalPages = FirstPage[Metadata][totalPages],
    
    // Generate list of all page numbers
    PageNumbers = {1..TotalPages},
    
    // Fetch all pages
    AllPages = List.Transform(PageNumbers, each GetPage(_)[Data]),
    
    // Combine all pages
    CombinedData = List.Combine(AllPages),
    
    // Convert to table
    TableFromList = Table.FromList(CombinedData, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    ExpandedRecords = Table.ExpandRecordColumn(TableFromList, "Column1", 
        {"reference_number", "quote_name", "calculator_type", "status", "gross_loan", "net_loan", "ltv_percentage", "property_value", "created_at"})
in
    ExpandedRecords
```

### Scheduled Refresh Settings

**Recommended:**
- Refresh frequency: Every 1 hour (or as needed)
- Each refresh uses 1-6 API calls depending on data volume
- Monitor rate limits in Power BI Service refresh history

---

## 🔧 Troubleshooting

### Error: "API key required"
- Ensure `X-API-Key` header is included
- Check header name is exactly `X-API-Key` (case-sensitive)
- Verify API key is not expired

### Error: "Invalid or inactive API key"
- Contact admin to verify key is active
- Check if key has been revoked
- Request new key if needed

### Error: "Rate limit exceeded"
- Wait for rate limit window to reset (1 hour)
- Reduce refresh frequency
- Contact admin to discuss increasing limits

### Empty Results
- Check date filters (use ISO 8601 format: `2025-01-05`)
- Verify status filter values match exactly
- Test without filters first

### Timeout Errors
- Reduce `pageSize` parameter
- Add date filters to reduce result set
- Contact admin if persistent

---

## 📈 Best Practices

### Performance Optimization
1. **Use date filters**: Always filter by `from`/`to` dates for recent data
2. **Pagination**: Use `pageSize=5000` for optimal performance
3. **Selective columns**: Only expand columns you need in Power BI
4. **Incremental refresh**: Configure Power BI incremental refresh for large datasets

### Data Freshness
1. **Schedule appropriately**: Hourly refresh for operational reports, daily for analytical
2. **Monitor usage**: Track API key usage via admin panel
3. **Cache wisely**: Power BI Service caches data between refreshes

### Security
1. **Credential storage**: Use Power BI Service credential storage for API keys
2. **Access control**: Limit who can edit data source credentials
3. **Key rotation**: Rotate keys quarterly or after team member changes
4. **Audit logs**: Review API key usage regularly

---

## 🆘 Support

### For Data Team Issues:
- API key not working → Contact platform admin
- Need additional fields → Request from development team
- Rate limits too restrictive → Discuss with admin
- Performance issues → Check query filters and pagination

### For Admin Tasks:
- Create/revoke API keys → See [ADMIN_API_KEY_GUIDE.md](./ADMIN_API_KEY_GUIDE.md)
- Monitor usage → Check admin dashboard
- Rotate keys → Revoke old, create new, update Power BI credentials

---

## 📝 Change Log

**2026-01-05** - Initial release
- Paginated quotes endpoint
- Summary statistics endpoint
- API key authentication
- Rate limiting (100/hour)

---

## 🔗 Related Documentation
- Admin API Key Management: [ADMIN_API_KEY_GUIDE.md](./ADMIN_API_KEY_GUIDE.md)
- Power BI Examples: [POWER_BI_EXAMPLES.md](./POWER_BI_EXAMPLES.md)
- API Reference: [API_REFERENCE.md](./API_REFERENCE.md)
