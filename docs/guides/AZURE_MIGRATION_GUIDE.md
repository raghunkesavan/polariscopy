# Azure Migration Guide - Polaris Calculator

## Overview
This guide outlines the steps to migrate the Polaris Specialist Mortgage Calculator to Azure App Service with CI/CD pipeline.

**Azure App Service URL**: https://wa-mfs-sf-calculator-001-f5gngdd7eyambdfb.uksouth-01.azurewebsites.net/  
**Status**: Currently disabled (403) - pending configuration

---

## 1. Environment Variables for Azure Key Vault

### Backend Environment Variables (REQUIRED)

```plaintext
# Server Configuration
PORT=8080
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://wa-mfs-sf-calculator-001-f5gngdd7eyambdfb.uksouth-01.azurewebsites.net

# Supabase Configuration (REQUIRED)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Authentication (REQUIRED)
JWT_SECRET=<generate-strong-32-char-secret>
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your-email>
SMTP_PASS=<app-password>
SUPPORT_EMAIL=<support-email>

# Optional: Redis for caching
# REDIS_URL=redis://localhost:6379

# Optional: Sentry for error tracking
# SENTRY_DSN=<your-sentry-dsn>
```

### Frontend Environment Variables (REQUIRED)

```plaintext
# Supabase (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Backend API URL
VITE_API_URL=https://wa-mfs-sf-calculator-001-f5gngdd7eyambdfb.uksouth-01.azurewebsites.net

# Production Settings
VITE_ENABLE_LOGGING=false

# Optional: Sentry
# VITE_SENTRY_DSN=<your-sentry-dsn>
```

### SQL Database Connection (When David Provides)

**Option 1: Continue Using Supabase (Recommended Initially)**
```plaintext
# Keep existing Supabase configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Option 2: Migrate to Azure SQL Database**
```plaintext
# Azure SQL Database configuration
AZURE_SQL_SERVER=<server-name>.database.windows.net
AZURE_SQL_DATABASE=polaris-calculator
AZURE_SQL_USER=polaris_app
AZURE_SQL_PASSWORD=<strong-password>
AZURE_SQL_PORT=1433
```

📖 **For full Azure SQL migration instructions, see:** `AZURE_SQL_MIGRATION_GUIDE.md`

---

## 2. Immediate Action Items

### For You (Developer):

#### A. Provide IP Address for Whitelisting
- Get your public IP: https://whatismyipaddress.com/
- Send to the infrastructure team for immediate access

#### B. Prepare Environment Credentials List
Send this document section #1 to the infrastructure team with:
- ✅ All environment variable names
- ✅ Indication of which values you'll provide vs. which they need to generate
- ⚠️ **DO NOT send actual secrets via email** - coordinate secure transfer method

#### C. Coordinate with Vishnu (Azure DevOps Repository)
Once repository is created, you'll need:
- Repository URL
- Access permissions (read/write)
- Branch policies (main branch protection recommended)

#### D. Coordinate with David (SQL Database)
Clarify database strategy:
- **Option 1**: Continue using Supabase (PostgreSQL) - provide connection details ✅ **Recommended Initially**
- **Option 2**: Migrate to Azure SQL Database - requires schema migration (4-6 weeks)

**If choosing Azure SQL migration:**
- Request Azure SQL Server details (server name, database name)
- Request credentials (username, password)  
- Confirm database tier (Standard S2+ recommended)
- Review `AZURE_SQL_MIGRATION_GUIDE.md` for complete process

**Recommendation**: Start with Supabase, plan Azure SQL as Phase 2 after App Service deployment.

#### E. Coordinate with Leon (Domain Configuration)
Decide on domain structure:
- **Option 1**: Single domain with subpaths (e.g., `calculator.mfsuk.com`)
- **Option 2**: Separate subdomains (e.g., `calculator-app.mfsuk.com`, `calculator-api.mfsuk.com`)

---

## 3. Azure Pipeline Configuration

### Project Structure Analysis
Your project is a **monorepo** with:
- `frontend/` - React + Vite application
- `backend/` - Node.js + Express API
- Shared root `package.json` with global dependencies

### Deployment Strategy Recommendation

**Recommended: Two Separate App Services**

Reasons:
1. **Independent Scaling**: Scale frontend/backend independently
2. **Security**: Backend can have stricter network rules
3. **Build Optimization**: Separate build pipelines avoid conflicts
4. **Cost Efficiency**: Different compute tiers for static frontend vs. API

### Azure Pipeline YAML Structure

#### Option 1: Single Pipeline, Two Deployments

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - frontend/*
      - backend/*

variables:
  - group: calculator-keyvault-secrets

stages:
  - stage: Build
    jobs:
      - job: BuildFrontend
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: |
              cd frontend
              npm ci
              npm run build
          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'frontend/dist'
              ArtifactName: 'frontend-drop'

      - job: BuildBackend
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: |
              cd backend
              npm ci
          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'backend'
              ArtifactName: 'backend-drop'

  - stage: Deploy
    dependsOn: Build
    jobs:
      - job: DeployFrontend
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: DownloadBuildArtifacts@1
            inputs:
              artifactName: 'frontend-drop'
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '<your-service-connection>'
              appName: 'wa-mfs-sf-calculator-frontend'
              package: '$(System.ArtifactsDirectory)/frontend-drop'

      - job: DeployBackend
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: DownloadBuildArtifacts@1
            inputs:
              artifactName: 'backend-drop'
          - task: AzureWebApp@1
            inputs:
              azureSubscription: '<your-service-connection>'
              appName: 'wa-mfs-sf-calculator-backend'
              package: '$(System.ArtifactsDirectory)/backend-drop'
```

#### Option 2: Separate Pipelines (Recommended for Independent Deployments)

**frontend-pipeline.yml**
```yaml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - frontend/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: calculator-frontend-secrets

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'

  - script: |
      cd frontend
      npm ci
      npm run build
    displayName: 'Install and Build'

  - task: AzureWebApp@1
    inputs:
      azureSubscription: '<service-connection>'
      appType: 'webAppLinux'
      appName: 'wa-mfs-sf-calculator-frontend'
      package: '$(System.DefaultWorkingDirectory)/frontend/dist'
      runtimeStack: 'NODE|20-lts'
```

**backend-pipeline.yml**
```yaml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - backend/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: calculator-backend-secrets

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'

  - script: |
      cd backend
      npm ci
    displayName: 'Install Dependencies'

  - task: AzureWebApp@1
    inputs:
      azureSubscription: '<service-connection>'
      appType: 'webAppLinux'
      appName: 'wa-mfs-sf-calculator-backend'
      package: '$(System.DefaultWorkingDirectory)/backend'
      runtimeStack: 'NODE|20-lts'
      startUpCommand: 'node server.js'
```

---

## 4. Azure App Service Configuration

### Backend App Service Settings

```json
{
  "name": "wa-mfs-sf-calculator-backend",
  "runtime": "NODE|20-lts",
  "startupCommand": "node server.js",
  "alwaysOn": true,
  "httpLoggingEnabled": true,
  "detailedErrorLoggingEnabled": true,
  "applicationSettings": [
    {
      "name": "PORT",
      "value": "8080"
    },
    {
      "name": "SCM_DO_BUILD_DURING_DEPLOYMENT",
      "value": "false"
    },
    {
      "name": "WEBSITE_NODE_DEFAULT_VERSION",
      "value": "20.x"
    }
  ]
}
```

### Frontend App Service Settings

```json
{
  "name": "wa-mfs-sf-calculator-frontend",
  "runtime": "NODE|20-lts",
  "alwaysOn": true,
  "applicationSettings": [
    {
      "name": "WEBSITE_NODE_DEFAULT_VERSION",
      "value": "20.x"
    }
  ]
}
```

### Static File Serving (Frontend)

For Vite build output, you may need a simple Express server or configure Azure Static Web Apps:

**Option A: Add server.js to frontend for Azure**
```javascript
// frontend/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
```

Update `frontend/package.json`:
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "vite build"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

---

## 5. Key Vault Integration

### Accessing Secrets in App Service

Azure App Service can reference Key Vault secrets directly:

```plaintext
# Instead of hard-coded values, use Key Vault references:
@Microsoft.KeyVault(SecretUri=https://<keyvault-name>.vault.azure.net/secrets/<secret-name>/)

# Example in Azure Portal App Settings:
SUPABASE_SERVICE_ROLE_KEY = @Microsoft.KeyVault(SecretUri=https://kv-mfs-sf-calc.vault.azure.net/secrets/supabase-service-key/)
JWT_SECRET = @Microsoft.KeyVault(SecretUri=https://kv-mfs-sf-calc.vault.azure.net/secrets/jwt-secret/)
```

### Managed Identity Setup

Your App Service needs permissions to read from Key Vault:

1. Enable System-Assigned Managed Identity on App Service
2. Grant "Key Vault Secrets User" role to the App Service identity
3. Configure Key Vault access policies

---

## 6. Testing Checklist

### Pre-Deployment Testing
- [ ] Test build process locally: `npm run build` (frontend and backend)
- [ ] Verify environment variables are complete
- [ ] Test with production-like environment variables
- [ ] Verify CORS settings for Azure URLs
- [ ] Test database connectivity from Azure (if using Azure SQL)

### Post-Deployment Testing
- [ ] Health check endpoint: `GET /api/health`
- [ ] Authentication flow works
- [ ] BTL calculator functions
- [ ] Bridging calculator functions
- [ ] PDF generation works
- [ ] Quote saving/retrieval
- [ ] Admin panel accessible
- [ ] Dark mode toggle works
- [ ] All API endpoints respond correctly

---

## 7. Rollback Strategy

### Quick Rollback Options

1. **Azure DevOps**: Redeploy previous successful pipeline run
2. **App Service**: Use deployment slots (blue-green deployment)
3. **Manual**: Keep previous build artifacts for quick restoration

### Deployment Slots (Recommended)

```plaintext
Production Slot: wa-mfs-sf-calculator-backend
Staging Slot: wa-mfs-sf-calculator-backend-staging

Deploy to staging → Test → Swap to production
```

---

## 8. Monitoring and Logging

### Application Insights Integration

Add to App Service configuration:
```plaintext
APPLICATIONINSIGHTS_CONNECTION_STRING=<connection-string>
```

Update backend to use Application Insights:
```javascript
// backend/server.js
import appInsights from 'applicationinsights';

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  appInsights.setup().start();
}
```

### Log Streaming

Access logs via:
- Azure Portal → App Service → Log stream
- Azure CLI: `az webapp log tail --name <app-name> --resource-group <rg-name>`

---

## 9. Security Considerations

### Network Security
- [ ] Enable HTTPS only
- [ ] Configure IP restrictions (whitelisting)
- [ ] Set up Azure Front Door / WAF (if needed)
- [ ] Configure CORS for allowed origins only

### Authentication & Authorization
- [ ] SSO integration (pending configuration)
- [ ] MFS Enterprise network access
- [ ] JWT token validation
- [ ] Role-based access control (RBAC)

### Secrets Management
- [ ] All secrets in Key Vault
- [ ] No secrets in source code
- [ ] Rotate secrets regularly
- [ ] Use Managed Identities where possible

---

## 10. Timeline and Dependencies

### Critical Path

```plaintext
Day 1-2: Information Gathering
├─ [YOU] Provide IP address for whitelisting
├─ [YOU] Confirm environment variables list
├─ [VISHNU] Create Azure DevOps repository
├─ [DAVID] Deploy SQL Database
└─ [LEON] Confirm domain requirements

Day 3-4: Configuration
├─ [INFRA] Add secrets to Key Vault
├─ [INFRA] Configure App Service settings
├─ [INFRA] Set up Managed Identity
└─ [YOU] Test access with whitelisted IP

Day 5-7: Pipeline Setup
├─ [YOU] Create azure-pipelines.yml
├─ [YOU] Test build process
├─ [VISHNU] Connect pipeline to App Service
└─ [YOU] Test deployment to staging

Day 8-10: Testing & Go-Live
├─ [ALL] Integration testing
├─ [INFRA] Configure SSO
├─ [LEON] Set up domain
└─ [ALL] Production deployment
```

---

## 11. Contact Points

| Task | Owner | Status |
|------|-------|--------|
| Azure DevOps Repository | Vishnu | Pending |
| SQL Database Deployment | David | Pending |
| Domain Configuration | Leon | Pending |
| Key Vault Secrets | Infrastructure Team | Pending |
| App Service Configuration | Infrastructure Team | Completed |
| IP Whitelisting | Infrastructure Team | Awaiting IPs |
| Code & Pipeline Setup | **You (Developer)** | In Progress |

---

## 12. Questions to Clarify

### Database Strategy
**Question**: Are we migrating from Supabase to Azure SQL, or continuing with Supabase?
- **Option 1**: Keep Supabase → Provide Supabase credentials for Key Vault
- **Option 2**: Migrate to Azure SQL → Requires schema migration scripts

**Recommendation**: Keep Supabase initially to reduce migration complexity, plan Azure SQL migration later if needed.

### Architecture Decision
**Question**: Single App Service or separate Frontend/Backend services?
- **Option 1**: Single service (monolith) - simpler but less flexible
- **Option 2**: Two services (microservices) - recommended for scalability

**Recommendation**: Two separate services based on email diagram.

### Domain Structure
**Question**: What domain(s) should we use?
- **Option 1**: `calculator.mfsuk.com` (single domain, frontend + backend as subdirs)
- **Option 2**: `calculator.mfsuk.com` + `api.calculator.mfsuk.com` (separate domains)

**Recommendation**: Separate domains for cleaner architecture.

---

## Next Steps Summary

### Immediate (This Week):
1. ✅ **Send IP address** for whitelisting to infrastructure team
2. ✅ **Send this document** (section #1) with environment variables list
3. ✅ **Confirm database strategy** with David
4. ✅ **Confirm domain preferences** with Leon
5. ✅ **Wait for Azure DevOps repo** from Vishnu

### After Repository Setup:
1. Create `azure-pipelines.yml` (use templates in section #3)
2. Add frontend `server.js` for static file serving (section #4)
3. Test build process locally
4. Configure pipeline in Azure DevOps
5. Test deployment to staging slot

### Before Go-Live:
1. Complete integration testing
2. Verify all environment variables
3. Test with production data
4. Document any issues/workarounds
5. Plan rollback strategy

---

## Additional Resources

- [Azure App Service Node.js Docs](https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Azure Key Vault Integration](https://learn.microsoft.com/en-us/azure/app-service/app-service-key-vault-references)
- [Azure DevOps Pipelines](https://learn.microsoft.com/en-us/azure/devops/pipelines/)
- [Managed Identity Setup](https://learn.microsoft.com/en-us/azure/app-service/overview-managed-identity)

---

**Document Version**: 1.0  
**Last Updated**: December 9, 2025  
**Owner**: Development Team
