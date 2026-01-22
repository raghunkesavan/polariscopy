Seeding rates into Supabase

Steps to create the table and seed the rates data from this project.

1) Create the `rates` table
   - Open your Supabase project, go to "SQL" > "New query"
   - Run the schema creation scripts from `../database/schema/` in order
   - Run migrations from `../database/migrations/` sequentially (001 → 028)
   - See `../database/README.md` for detailed migration instructions

2) Ensure your local `backend/.env` contains the following (do NOT commit):

   SUPABASE_URL=your-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

3) From the repo root, run:

```powershell
cd backend
npm install
npm run seed:rates
```

This will upsert the rate sets (keys like `RATES_DATA`, `RATES_COMMERCIAL`, etc.) into the `rates` table.

4) Start the backend and visit the rates endpoint

```powershell
npm run dev
# then in your browser: http://localhost:3001/api/rates
```

Notes:
- The seed script uses the service role key (very powerful). Keep it secret and rotate immediately if it has been exposed.
- If you need the seed script to use a different table schema, update `scripts/seedRates.js`.
