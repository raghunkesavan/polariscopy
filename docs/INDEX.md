# Documentation Index

This directory contains all project documentation organized by category.

## 📁 Directory Structure

### `/architecture`
System architecture, diagrams, and design decisions
- `architecture.md` - Main architecture document
- `architecture.html` - Architecture visualization
- `architecture-complete.html` - Complete architecture diagram
- `architecture-complete.pdf` - Architecture diagram (PDF)

### `/design`
Design system, tokens, and Figma integration
- `DESIGN_TOKEN_GUIDELINES.md` - Design token usage guidelines
- `FIGMA_DESIGN_TOKENS_GUIDE.md` - Figma token integration guide
- `FIGMA_TOKEN_ALIGNMENT_ANALYSIS.md` - Token alignment analysis
- `FIGMA_TOKEN_STATUS.md` - Current status of Figma tokens

### `/features`
Feature-specific documentation and specifications

### `/guides`
How-to guides and integration documentation
- `PDF_INTEGRATION_GUIDE.md` - PDF generation integration guide
- `GITHUB_SPARK_PROMPT.md` - GitHub Spark setup
- `SALESFORCE_EMBEDDING.md` - Salesforce embedding guide

### `/implementation`
Implementation details, status updates, and summaries
- `BTL_IMPLEMENTATION_GUIDE.md` - BTL calculator implementation
- `BTL_REFACTORING_STATUS.md` - BTL refactoring status
- `PDF_GENERATION_PLAN.md` - PDF generation planning
- `PDF_IMPLEMENTATION_SUMMARY.md` - PDF implementation summary
- `PHASE6_FINAL_PUSH_SUMMARY.md` - Phase 6 completion summary

### `/improvements`
Improvement proposals and enhancement documentation

### `/testing`
Test documentation and completion reports
- `BTL_COMPONENT_TESTS_COMPLETE.md` - BTL component test completion
- `BTL_TESTING_COMPLETE.md` - BTL testing completion report

## 📋 Quick Reference

### For Developers
- **Getting Started**: See `/README.md` (root)
- **Architecture Overview**: `/architecture/architecture.md`
- **Design Tokens**: `/design/DESIGN_TOKEN_GUIDELINES.md`
- **AI Agent Instructions**: `/.github/AI_AGENT_INSTRUCTIONS.md`
- **Token System**: `/TOKEN_SYSTEM.md` (root)

### For Features
- **BTL Calculator**: `/implementation/BTL_IMPLEMENTATION_GUIDE.md`
- **PDF Generation**: `/guides/PDF_INTEGRATION_GUIDE.md`
- **Salesforce Integration**: `/guides/SALESFORCE_EMBEDDING.md`

### For Testing
- **Test Status**: `/testing/BTL_TESTING_COMPLETE.md`
- **Component Tests**: `/testing/BTL_COMPONENT_TESTS_COMPLETE.md`

## 🔍 Finding Documentation

1. **Architecture & Design Decisions** → `/architecture`
2. **How to Implement Features** → `/implementation`
3. **Step-by-Step Guides** → `/guides`
4. **Design System & Styling** → `/design`
5. **Test Coverage & Status** → `/testing`
6. **Feature Specifications** → `/features`
7. **Planned Improvements** → `/improvements`

## 📝 Creating New Documentation

When adding new documentation, place it in the appropriate directory:

```
✅ CORRECT:
docs/features/new-feature.md
docs/guides/how-to-guide.md
docs/implementation/feature-implementation.md

❌ WRONG:
NEW_FEATURE_DOCS.md (in root)
FEATURE_GUIDE_COMPLETE.md (in root)
```

See `/.github/AI_AGENT_INSTRUCTIONS.md` for detailed documentation standards.

## 🗂️ Root Directory Files

Only essential files remain in root:
- `README.md` - Project overview
- `TOKEN_SYSTEM.md` - Design token reference (quick access)
- `package.json` - Project dependencies
- `vercel.json` - Deployment config
- `.github/` - GitHub workflows and AI instructions

All other documentation is organized in this `/docs` directory.
