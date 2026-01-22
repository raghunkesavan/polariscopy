# Project Polaris - Mortgage Calculator Platform

A full-stack mortgage calculation platform for BTL (Buy-to-Let) and Bridging loans, built with React, Express, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- Supabase account ([create one here](https://supabase.com))

### Installation

1. **Clone and install dependencies:**
   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

2. **Configure environment variables:**
   
   Frontend (`.env`):
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:3001
   ```
   
   Backend (`.env`):
   ```env
   PORT=3001
   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Start development servers:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev

   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

---

## 📁 Project Structure

```
/
├── frontend/              # React frontend (Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions & calculation engines
│   │   ├── pages/         # Page components
│   │   └── styles/        # SCSS stylesheets
│   └── vitest.config.js   # Test configuration
├── backend/               # Express backend
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   ├── config/            # Configuration
│   └── scripts/           # Database seed scripts
├── database/              # 🗄️ Database files (organized)
│   ├── schema/            # Initial table creation scripts
│   ├── migrations/        # Sequential migrations (001-028)
│   ├── utilities/         # Verification scripts
│   └── seeds/             # CSV seed data files
└── docs/                  # 📚 Documentation (organized)
    ├── architecture/      # System design & calculations
    ├── features/          # Feature documentation
    ├── guides/            # How-to guides & tutorials
    └── improvements/      # Improvement plans & reviews
```

---

## ✨ Features

### Calculators
- **BTL Calculator** - Buy-to-Let mortgage calculations
  - Max Gross/Net Loan calculations
  - Interest Coverage Ratio (ICR) at 125% and 145%
  - LTV calculations with tier-based rates
  - Product range filtering (Core vs Specialist)
  - Fee calculations and APRC
  
- **Bridging Calculator** - Short-term bridging loans
  - First and second charge calculations
  - Rolled, deferred, and serviced interest
  - Multi-property support
  - Term-based rate calculations

### User Management
- Role-based access control (Admin, Manager, User, Underwriter)
- User authentication (Supabase Auth)
- User profiles and settings

### Quote Management
- Save and retrieve quotes
- Quote reference numbers
- DIP (Decision in Principle) issuance
- Export quotes to Word documents

### Admin Features
- Rate table management (BTL & Bridging)
- Criteria management
- Global settings configuration
- Broker settings management

---

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test                    # Run tests once
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# Backend tests
cd backend
npm test
npm run test:coverage
```

**Current test coverage:** ~5% (improvement needed)  
**Target coverage:** 80%+

📚 **See:** [Testing Guide](docs/guides/testing-guide.md) for detailed instructions

---

## 📚 Documentation

All project documentation is now organized in the [`docs/`](docs/) directory:

### 🎯 Start Here
- **New to the project?** → [docs/improvements/project-structure-review.md](docs/improvements/project-structure-review.md)
- **Want to write tests?** → [docs/guides/testing-guide.md](docs/guides/testing-guide.md)
- **Need to refactor code?** → [docs/guides/refactoring-example.js](docs/guides/refactoring-example.js)

### 📖 Browse Documentation
- [Architecture](docs/architecture/) - System design, calculation engines, deployment
- [Features](docs/features/) - Feature-specific documentation
- [Guides](docs/guides/) - How-to guides and tutorials
- [Improvements](docs/improvements/) - Project improvement plans
- [Database](database/) - SQL schema, migrations, and database documentation

**Full index:** [docs/README.md](docs/README.md)

---

## 🛠️ Development

### Available Scripts

**Frontend:**
```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run preview       # Preview production build
npm test              # Run tests
npm run test:watch    # Watch mode
```

**Backend:**
```bash
npm run dev           # Start with auto-reload
npm start             # Production start
npm run seed:rates    # Seed rates data
npm test              # Run tests
```

### Tech Stack

**Frontend:**
- React 18.2
- Vite 5.0
- Carbon Design System
- React Router 6
- Vitest (testing)

**Backend:**
- Node.js 20+
- Express 4
- Supabase (Database & Auth)
- Winston (logging)

---

## 🔐 Security

- Row Level Security (RLS) enabled in Supabase
- Service role key never exposed to frontend
- Rate limiting on API endpoints
- JWT-based authentication
- Role-based access control

⚠️ **Never commit `.env` files to git**

---

## 🚀 Deployment

The application is configured for deployment on:
- **Frontend:** Vercel (automatic deployments)
- **Backend:** Render or similar Node.js host

See [docs/architecture/deployment.md](docs/architecture/deployment.md) for detailed deployment instructions.

---

## 📊 Known Issues & Improvements

### High Priority
- [ ] Refactor large components (BTL_Calculator: 1,906 lines → target: <300 lines)
- [ ] Increase test coverage from 5% to 80%+
- [ ] Break down Constants.jsx (1,840 lines)

### Medium Priority
- [ ] Optimize bundle size with code splitting
- [ ] Improve error handling
- [ ] Add E2E tests

See [docs/improvements/project-structure-review.md](docs/improvements/project-structure-review.md) for the complete improvement plan.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Write tests for new code (see [Testing Guide](docs/guides/testing-guide.md))
3. Follow the existing code structure
4. Submit a pull request

---

## 📄 License

[Add your license here]

---

## 📞 Support

For questions or issues, please refer to the documentation in the [`docs/`](docs/) directory or contact the development team.