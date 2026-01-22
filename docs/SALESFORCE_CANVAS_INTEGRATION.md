# Salesforce Canvas Integration Guide

## 🎯 What You've Implemented

Your SF architect provided the **Salesforce Canvas SDK**, which enables:

1. **Signed Request Authentication** - Secure token passing
2. **Context API** - Automatic Salesforce user/org/record data
3. **Cross-domain Communication** - postMessage wrapper
4. **Auto-resize** - Dynamic frame sizing
5. **Event System** - Pub/sub between SF and your app
6. **AJAX Proxy** - Make authenticated SF REST API calls

---

## 📁 Files Created

### **1. Canvas SDK** 
- `frontend/public/canvas-all.js` - Salesforce Canvas JavaScript SDK
- **Action**: Copy your architect's full SDK code into this file

### **2. React Context Provider**
- `frontend/src/contexts/SalesforceCanvasContext.jsx` - React wrapper for Canvas SDK
- Provides hooks to access Salesforce context anywhere in your app

### **3. Example Component**
- `frontend/src/components/salesforce/CanvasExample.jsx` - Shows how to use the Canvas context

### **4. Updated Files**
- `frontend/index.html` - Loads Canvas SDK
- `frontend/src/App.jsx` - Wraps app with SalesforceCanvasProvider

---

## 🏗️ Salesforce Setup (For Your SF Admin)

### **Step 1: Create Connected App**

1. Go to **Setup → App Manager → New Connected App**
2. Fill in details:
   ```
   Connected App Name: Polaris Calculator
   API Name: Polaris_Calculator
   Contact Email: your-email@mfsuk.com
   ```

3. **Enable OAuth Settings**:
   ```
   ✓ Enable OAuth Settings
   Callback URL: https://polaristest-theta.vercel.app/canvas-callback
   Selected OAuth Scopes:
     - Access and manage your data (api)
     - Perform requests on your behalf at any time (refresh_token, offline_access)
     - Access your basic information (id, profile, email, address, phone)
   ```

4. **Canvas App Settings**:
   ```
   ✓ Force.com Canvas
   Canvas App URL: https://polaristest-theta.vercel.app/calculator/btl
   Access Method: Signed Request (POST)
   Locations:
     ✓ Visualforce Page
     ✓ Layouts and Mobile Cards
     ✓ Lightning Component
   ```

5. **Lifecycle**:
   ```
   ✓ Canvas URL: https://polaristest-theta.vercel.app
   ```

### **Step 2: Get Consumer Key & Secret**

After creating the Connected App:
1. Click **Manage Consumer Details**
2. Copy **Consumer Key** and **Consumer Secret**
3. Share these with your dev team (for backend OAuth if needed)

### **Step 3: Create Visualforce Page**

```xml
<apex:page showHeader="false" sidebar="false">
    <apex:canvasApp 
        applicationName="Polaris_Calculator"
        width="100%" 
        height="800px"
        scrolling="auto"
        parameters="{'recordId':'{!$CurrentPage.parameters.id}'}"
    />
</apex:page>
```

**OR use iframe with signed request:**

```xml
<apex:page controller="PolarisCanvasController" showHeader="false" sidebar="false">
    <apex:form>
        <canvas:canvas 
            applicationName="Polaris_Calculator"
            width="100%" 
            height="800px"
            scrolling="auto"
            parameters="{recordId: $CurrentPage.parameters.id}"
        />
    </apex:form>
</apex:page>
```

### **Step 4: Create Apex Controller (Optional)**

```apex
public class PolarisCanvasController {
    public String getSignedRequest() {
        return Canvas.SignedRequest.create(
            'YOUR_CONSUMER_SECRET',
            'https://polaristest-theta.vercel.app',
            new Map<String,Object>{
                'context' => Canvas.EnvironmentContext.create(),
                'client' => Canvas.ClientContext.create()
            }
        );
    }
}
```

---

## 🎯 How to Use Canvas Context in Your Components

### **Example: BTL Calculator with Salesforce Context**

```jsx
import React, { useEffect, useState } from 'react';
import { useSalesforceCanvas } from '../../contexts/SalesforceCanvasContext';

const BTLCalculator = () => {
  const { 
    isCanvasApp, 
    user, 
    organization,
    ajaxRequest,
    publish 
  } = useSalesforceCanvas();

  const [opportunityData, setOpportunityData] = useState(null);

  useEffect(() => {
    // If running in Canvas and has record ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get('recordId');

    if (isCanvasApp && recordId) {
      fetchOpportunityData(recordId);
    }
  }, [isCanvasApp]);

  const fetchOpportunityData = async (oppId) => {
    try {
      const data = await ajaxRequest(
        `/services/data/v58.0/sobjects/Opportunity/${oppId}`,
        { method: 'GET' }
      );
      
      setOpportunityData(data);
      
      // Pre-populate calculator with Opportunity data
      // e.g., loan amount from Opportunity.Amount
    } catch (error) {
      console.error('Error fetching opportunity:', error);
    }
  };

  const handleCalculation = (result) => {
    // Normal calculation logic...
    
    // Notify Salesforce of calculation complete
    if (isCanvasApp) {
      publish('canvas.calculationComplete', {
        quoteId: result.quoteId,
        loanAmount: result.grossLoan,
        monthlyPayment: result.monthlyPayment,
        user: user?.email
      });
    }
  };

  return (
    <div>
      {isCanvasApp && opportunityData && (
        <div className="slds-box slds-m-bottom_medium">
          <p><strong>Salesforce Opportunity:</strong> {opportunityData.Name}</p>
          <p><strong>Amount:</strong> £{opportunityData.Amount?.toLocaleString()}</p>
        </div>
      )}
      
      {/* Your existing calculator UI */}
    </div>
  );
};
```

### **Example: Update Salesforce Record from Quote**

```jsx
const saveQuoteToSalesforce = async (quoteData) => {
  const { ajaxRequest, user } = useSalesforceCanvas();

  try {
    // Create Quote record in Salesforce
    const response = await ajaxRequest(
      '/services/data/v58.0/sobjects/Quote__c',
      {
        method: 'POST',
        data: JSON.stringify({
          Name: `Quote-${quoteData.referenceNumber}`,
          Loan_Amount__c: quoteData.grossLoan,
          Property_Value__c: quoteData.propertyValue,
          LTV__c: quoteData.ltv,
          Rate__c: quoteData.rate,
          Monthly_Payment__c: quoteData.monthlyPayment,
          Created_By__c: user.userId
        })
      }
    );
    
    console.log('Quote saved to Salesforce:', response);
  } catch (error) {
    console.error('Error saving quote:', error);
  }
};
```

---

## 🧪 Testing Canvas Integration

### **Local Testing (Before SF Deployment)**

1. **Test embedded mode** without Canvas SDK:
   ```
   http://localhost:5173/calculator/btl?embedded=1
   ```
   - Navigation should hide
   - Calculator should work normally

2. **Test Canvas SDK locally** (limited):
   - Canvas SDK needs to be in iframe to fully work
   - Mock the context for local testing

### **Salesforce Sandbox Testing**

1. Deploy Connected App to Sandbox
2. Create Visualforce page
3. Access via Salesforce URL:
   ```
   https://your-sandbox.my.salesforce.com/apex/PolarisCalculator
   ```

### **Production Deployment**

1. Test thoroughly in Sandbox
2. Deploy Connected App to Production
3. Deploy Visualforce page to Production
4. Update Canvas URL to production Vercel URL

---

## 📊 Difficulty Assessment

| Task | Difficulty | Time | Who Does It |
|------|-----------|------|-------------|
| **Copy SDK code** | 🟢 Very Easy | 5 min | You (dev) |
| **Create Connected App** | 🟢 Easy | 15-30 min | SF Admin |
| **Create Visualforce page** | 🟢 Easy | 10-15 min | SF Admin |
| **Update React components** | 🟡 Medium | 2-3 hours | You (dev) |
| **Test in Sandbox** | 🟡 Medium | 1-2 hours | You + SF Admin |
| **Production deployment** | 🟢 Easy | 30 min | SF Admin |
| **TOTAL** | **🟢 Easy-Medium** | **1 day** | Team effort |

---

## ✅ Next Steps

1. **Copy Full SDK Code** into `frontend/public/canvas-all.js`
   - Replace the placeholder comment with your architect's full code

2. **Test Locally**:
   ```bash
   cd frontend
   npm run dev
   ```
   - Visit `http://localhost:5173?embedded=1`
   - Check console for "Not running as Canvas app" (expected)

3. **Deploy to Vercel**:
   ```bash
   git add .
   git commit -m "Add Salesforce Canvas SDK integration"
   git push
   ```

4. **Work with SF Admin** to create Connected App and Visualforce page

5. **Test in SF Sandbox** and verify:
   - Context loads correctly
   - User/org info displays
   - Calculator works normally
   - Frame resizes automatically

---

## 🎉 Benefits You Get

### **Better Than Basic Iframe:**
- ✅ **Secure authentication** - No tokens in URLs
- ✅ **Automatic context** - User/org data without API calls
- ✅ **Record pre-population** - Pass Opportunity ID, auto-fill calculator
- ✅ **Bidirectional events** - Your app notifies SF, SF notifies your app
- ✅ **Auto-resize** - No fixed height issues
- ✅ **Mobile support** - Works in Salesforce Mobile App

### **vs. Building in Salesforce:**
- ✅ **Keep your React app** - No LWC rewrite needed
- ✅ **Keep your styling** - Dark mode, Carbon Design, everything works
- ✅ **Faster development** - 1 day vs 6-8 weeks
- ✅ **Easier maintenance** - Update Vercel deployment, not Salesforce code

---

## 🐛 Troubleshooting

### **"Canvas SDK not loading"**
- Check `canvas-all.js` file exists in `frontend/public/`
- Verify script tag in `index.html` points to correct path
- Check browser console for JavaScript errors

### **"Context is null"**
- Canvas SDK only works inside Salesforce iframe
- Use `?embedded=1` for local testing (won't have real SF context)
- Verify Connected App is deployed and active

### **"CORS errors"**
- Ensure Salesforce domain is allowed in `frontend/vercel.json`
- Check Connected App has correct Canvas URL
- Verify Remote Site Settings in Salesforce

### **"Frame not resizing"**
- Canvas SDK has autogrow enabled by default
- Check `resize()` calls in your components
- Verify iframe permissions in Salesforce

---

**Ready to implement? The SDK is already integrated in your React app - just need your SF admin to create the Connected App!**
