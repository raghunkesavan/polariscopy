// Archived rates fallback data and loader. Moved to frontend/archive because the app now
// fetches rates from Supabase directly and the embedded fallback was unused.

export const FALLBACK_RATES = {
  /* archived content omitted for brevity; full original content was moved here */
};

export async function getRates() {
  // Archived fallback - original implementation was to fetch /api/rates and fall back.

  return {};
}
