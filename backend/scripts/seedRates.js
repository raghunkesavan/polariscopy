import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

// Load local .env
dotenv.config();

// Rates data (fallback) - copied from project rates file
const RATES_DATA = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0589, 4: 0.0639, 3: 0.0679, 2: 0.0719 },
      "3yr Fix": { 6: 0.0639, 4: 0.0679, 3: 0.0719, 2: 0.0749 },
      "2yr Tracker": { 6: 0.0159, 4: 0.0209, 3: 0.0249, 2: 0.0289, isMargin: true },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0639, 4: 0.0679, 3: 0.0719, 2: 0.0749 },
      "3yr Fix": { 6: 0.0679, 4: 0.0719, 3: 0.0759, 2: 0.0789 },
      "2yr Tracker": { 6: 0.0209, 4: 0.0259, 3: 0.0299, 2: 0.0339, isMargin: true },
    },
  },
  "Tier 3": {
    products: {
      "2yr Fix": { 6: 0.0729, 4: 0.0779, 3: 0.0819, 2: 0.0849 },
      "3yr Fix": { 6: 0.0769, 4: 0.0809, 3: 0.0849, 2: 0.0879 },
      "2yr Tracker": { 6: 0.0239, 4: 0.0289, 3: 0.0329, 2: 0.0369, isMargin: true },
    },
  },
};

const RATES_COMMERCIAL = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0629, 4: 0.0719, 2: 0.0829 },
      "3yr Fix": { 6: 0.0679, 4: 0.0749, 2: 0.0819 },
      "2yr Tracker": { 6: 0.0304, 4: 0.0404, 2: 0.0499, isMargin: true },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0679, 4: 0.0769, 2: 0.0879 },
      "3yr Fix": { 6: 0.0729, 4: 0.0799, 2: 0.0869 },
      "2yr Tracker": { 6: 0.0334, 4: 0.0434, 2: 0.0529, isMargin: true },
    },
  },
};

const RATES_SEMI_COMMERCIAL = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0619, 4: 0.0709, 2: 0.0819 },
      "3yr Fix": { 6: 0.0669, 4: 0.0739, 2: 0.0809 },
      "2yr Tracker": { 6: 0.0304, 4: 0.0404, 2: 0.0499, isMargin: true },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0659, 4: 0.0749, 2: 0.0859 },
      "3yr Fix": { 6: 0.0709, 4: 0.0779, 2: 0.0849 },
      "2yr Tracker": { 6: 0.0334, 4: 0.0434, 2: 0.0529, isMargin: true },
    },
  },
};

const RATES_CORE = {
  "Tier 1": {
    products: {
      "2yr Fix": { 6: 0.0529, 4: 0.0619, 3: 0.0679, 2: 0.0729 },
      "3yr Fix": { 6: 0.0579, 4: 0.0649, 3: 0.0686, 2: 0.0719 },
      "2yr Tracker": { 6: 0.0149, 4: 0.0249, 3: 0.0304, 2: 0.0354, isMargin: true },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 6: 0.0589, 4: 0.0679, 3: 0.0739, 2: 0.0789 },
      "3yr Fix": { 6: 0.0639, 4: 0.0709, 3: 0.0746, 2: 0.0779 },
      "2yr Tracker": { 6: 0.0169, 4: 0.0269, 3: 0.0324, 2: 0.0374, isMargin: true },
    },
  },
};

const RATES_RETENTION_65 = {
  Residential: {
    "Tier 1": {
      products: {
        "2yr Fix": { 5.5: 0.0529, 3.5: 0.0559, 2.5: 0.0589, 1.5: 0.0619 },
        "3yr Fix": { 5.5: 0.0569, 3.5: 0.0599, 2.5: 0.0629, 1.5: 0.0659 },
        "2yr Tracker": { 5.5: 0.0119, 3.5: 0.0149, 2.5: 0.0179, 1.5: 0.0209, isMargin: true },
      },
    },
    "Tier 2": {
      products: {
        "2yr Fix": { 5.5: 0.0559, 3.5: 0.0589, 2.5: 0.0619, 1.5: 0.0649 },
        "3yr Fix": { 5.5: 0.0599, 3.5: 0.0629, 2.5: 0.0659, 1.5: 0.0689 },
        "2yr Tracker": { 5.5: 0.0149, 3.5: 0.0179, 2.5: 0.0209, 1.5: 0.0239, isMargin: true },
      },
    },
    "Tier 3": {
      products: {
        "2yr Fix": { 5.5: 0.0609, 3.5: 0.0639, 2.5: 0.0669, 1.5: 0.0699 },
        "3yr Fix": { 5.5: 0.0649, 3.5: 0.0679, 2.5: 0.0709, 1.5: 0.0739 },
        "2yr Tracker": { 5.5: 0.0189, 3.5: 0.0219, 2.5: 0.0249, 1.5: 0.0279, isMargin: true },
      },
    },
  },
  Commercial: {
    "Tier 1": {
      products: {
        "2yr Fix": { 5.5: 0.0629, 3.5: 0.0719, 1.5: 0.0829 },
        "3yr Fix": { 5.5: 0.0679, 3.5: 0.0749, 1.5: 0.0819 },
        "2yr Tracker": { 5.5: 0.0304, 3.5: 0.0404, 1.5: 0.0499, isMargin: true },
      },
    },
    "Tier 2": {
      products: {
        "2yr Fix": { 5.5: 0.0679, 3.5: 0.0769, 1.5: 0.0879 },
        "3yr Fix": { 5.5: 0.0729, 3.5: 0.0799, 1.5: 0.0869 },
        "2yr Tracker": { 5.5: 0.0334, 3.5: 0.0434, 1.5: 0.0529, isMargin: true },
      },
    },
  },
  "Semi-Commercial": {
    "Tier 1": {
      products: {
        "2yr Fix": { 5.5: 0.0619, 3.5: 0.0709, 1.5: 0.0819 },
        "3yr Fix": { 5.5: 0.0669, 3.5: 0.0739, 1.5: 0.0809 },
        "2yr Tracker": { 5.5: 0.0304, 3.5: 0.0404, 1.5: 0.0499, isMargin: true },
      },
    },
    "Tier 2": {
      products: {
        "2yr Fix": { 5.5: 0.0659, 3.5: 0.0749, 1.5: 0.0859 },
        "3yr Fix": { 5.5: 0.0709, 3.5: 0.0779, 1.5: 0.0849 },
        "2yr Tracker": { 5.5: 0.0334, 3.5: 0.0434, 1.5: 0.0529, isMargin: true },
      },
    },
  },
};

const RATES_RETENTION_75 = {
  Residential: {
    "Tier 1": {
      products: {
        "2yr Fix": { 5.5: 0.0539, 3.5: 0.0569, 2.5: 0.0599, 1.5: 0.0629 },
        "3yr Fix": { 5.5: 0.0579, 3.5: 0.0609, 2.5: 0.0639, 1.5: 0.0669 },
        "2yr Tracker": { 5.5: 0.0129, 3.5: 0.0159, 2.5: 0.0189, 1.5: 0.0219, isMargin: true },
      },
    },
    "Tier 2": {
      products: {
        "2yr Fix": { 5.5: 0.0569, 3.5: 0.0599, 2.5: 0.0629, 1.5: 0.0659 },
        "3yr Fix": { 5.5: 0.0609, 3.5: 0.0639, 2.5: 0.0669, 1.5: 0.0699 },
        "2yr Tracker": { 5.5: 0.0159, 3.5: 0.0189, 2.5: 0.0219, 1.5: 0.0249, isMargin: true },
      },
    },
    "Tier 3": {
      products: {
        "2yr Fix": { 5.5: 0.0619, 3.5: 0.0649, 2.5: 0.0679, 1.5: 0.0709 },
        "3yr Fix": { 5.5: 0.0659, 3.5: 0.0689, 2.5: 0.0719, 1.5: 0.0749 },
        "2yr Tracker": { 5.5: 0.0199, 3.5: 0.0229, 2.5: 0.0259, 1.5: 0.0289, isMargin: true },
      },
    },
  },
  Commercial: {
    "Tier 1": {
      products: {
        "2yr Fix": { 5.5: 0.0629, 3.5: 0.0719, 1.5: 0.0829 },
        "3yr Fix": { 5.5: 0.0679, 3.5: 0.0749, 1.5: 0.0819 },
        "2yr Tracker": { 5.5: 0.0304, 3.5: 0.0404, 1.5: 0.0499, isMargin: true },
      },
    },
    "Tier 2": {
      products: {
        "2yr Fix": { 5.5: 0.0679, 3.5: 0.0769, 1.5: 0.0879 },
        "3yr Fix": { 5.5: 0.0729, 3.5: 0.0799, 1.5: 0.0869 },
        "2yr Tracker": { 5.5: 0.0334, 3.5: 0.0434, 1.5: 0.0529, isMargin: true },
      },
    },
  },
  "Semi-Commercial": {
    "Tier 1": {
      products: {
        "2yr Fix": { 5.5: 0.0619, 3.5: 0.0709, 1.5: 0.0819 },
        "3yr Fix": { 5.5: 0.0669, 3.5: 0.0739, 1.5: 0.0809 },
        "2yr Tracker": { 5.5: 0.0304, 3.5: 0.0404, 1.5: 0.0499, isMargin: true },
      },
    },
    "Tier 2": {
      products: {
        "2yr Fix": { 5.5: 0.0659, 3.5: 0.0749, 1.5: 0.0859 },
        "3yr Fix": { 5.5: 0.0709, 3.5: 0.0779, 1.5: 0.0849 },
        "2yr Tracker": { 5.5: 0.0334, 3.5: 0.0434, 1.5: 0.0529, isMargin: true },
      },
    },
  },
};

const RATES_CORE_RETENTION_65 = {
  "Tier 1": {
    products: {
      "2yr Fix": { 5.5: 0.0529, 3.5: 0.0619, 2.5: 0.0679, 1.5: 0.0729 },
      "3yr Fix": { 5.5: 0.0579, 3.5: 0.0649, 2.5: 0.0686, 1.5: 0.0719 },
      "2yr Tracker": { 5.5: 0.0149, 3.5: 0.0249, 2.5: 0.0304, 1.5: 0.0354, isMargin: true },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 5.5: 0.0589, 3.5: 0.0679, 2.5: 0.0739, 1.5: 0.0789 },
      "3yr Fix": { 5.5: 0.0639, 3.5: 0.0709, 2.5: 0.0746, 1.5: 0.0779 },
      "2yr Tracker": { 5.5: 0.0169, 3.5: 0.0269, 2.5: 0.0324, 1.5: 0.0374, isMargin: true },
    },
  },
};

const RATES_CORE_RETENTION_75 = {
  "Tier 1": {
    products: {
      "2yr Fix": { 5.5: 0.0529, 3.5: 0.0619, 2.5: 0.0679, 1.5: 0.0729 },
      "3yr Fix": { 5.5: 0.0579, 3.5: 0.0649, 2.5: 0.0686, 1.5: 0.0719 },
      "2yr Tracker": { 5.5: 0.0149, 3.5: 0.0249, 2.5: 0.0304, 1.5: 0.0354, isMargin: true },
    },
  },
  "Tier 2": {
    products: {
      "2yr Fix": { 5.5: 0.0589, 3.5: 0.0679, 2.5: 0.0739, 1.5: 0.0789 },
      "3yr Fix": { 5.5: 0.0639, 3.5: 0.0709, 2.5: 0.0746, 1.5: 0.0779 },
      "2yr Tracker": { 5.5: 0.0169, 3.5: 0.0269, 2.5: 0.0324, 1.5: 0.0374, isMargin: true },
    },
  },
};

const toUpsert = [
  ['RATES_DATA', RATES_DATA],
  ['RATES_COMMERCIAL', RATES_COMMERCIAL],
  ['RATES_SEMI_COMMERCIAL', RATES_SEMI_COMMERCIAL],
  ['RATES_CORE', RATES_CORE],
  ['RATES_RETENTION_65', RATES_RETENTION_65],
  ['RATES_RETENTION_75', RATES_RETENTION_75],
  ['RATES_CORE_RETENTION_65', RATES_CORE_RETENTION_65],
  ['RATES_CORE_RETENTION_75', RATES_CORE_RETENTION_75],
];

async function main() {
  console.log('Seeding rates into Supabase...');

  for (const [key, data] of toUpsert) {
    const payload = { key, data };
    const { error } = await supabase.from('rates').upsert(payload, { onConflict: 'key' });
    if (error) {
      console.error('Upsert error for', key, error);
      process.exitCode = 1;
    } else {
      console.log('Upserted', key);
    }
  }

  console.log('Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
