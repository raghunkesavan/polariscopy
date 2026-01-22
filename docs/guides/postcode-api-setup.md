# UK Postcode Lookup API Setup

The application uses **getAddress.io** to look up actual street addresses for UK postcodes.

## Get Your Free API Key

1. Go to https://getaddress.io/
2. Click **"Sign up for free"**
3. Create an account
4. You'll get **20 free lookups per day**
5. Copy your API key from the dashboard

## Add API Key to Your Environment

### Local Development

Edit `backend/.env` and add:
```env
GETADDRESS_API_KEY=your_api_key_here
```

### Render Deployment

1. Go to Render Dashboard → Your Service
2. Go to **Environment** tab
3. Add new environment variable:
   - **Key**: `GETADDRESS_API_KEY`
   - **Value**: your API key from getAddress.io
4. Click **Save Changes**
5. Render will automatically redeploy

### Vercel Deployment (Frontend)

No changes needed — frontend calls the backend proxy, API key stays secure on server.

## API Response Format

```json
{
  "success": true,
  "addresses": [
    {
      "display": "1 Example Street, New Malden, Kingston upon Thames",
      "street": "1 Example Street, New Malden",
      "city": "Kingston upon Thames",
      "postcode": "KT3 4NX"
    }
  ]
}
```

## Alternative Free APIs

If you need more than 20 lookups/day:

- **Paid getAddress.io plans**: £5/month for 1,000 lookups
- **ideal-postcodes.co.uk**: £20/month for unlimited (requires API key + domain whitelist)
- **postcodes.io**: Free but only returns area data (no street addresses)

## Testing

```bash
# Local test
curl "http://localhost:3001/api/postcode-lookup/KT34NX"

# Production test
curl "https://polaristest.onrender.com/api/postcode-lookup/KT34NX"
```
