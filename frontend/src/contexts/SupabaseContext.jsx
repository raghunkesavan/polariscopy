import { createClient } from '@supabase/supabase-js';
import React, { createContext, useContext } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SupabaseContext = createContext({
  supabase: null,
  user: null,
});

export function SupabaseProvider({ children }) {
  // Provide a mock authenticated user state
  const mockUser = { role: 'authenticated' };

  const value = {
    supabase,
    user: mockUser,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}