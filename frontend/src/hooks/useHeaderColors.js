/**
 * Hook to load and apply header colors on app startup
 * Colors are loaded from Supabase and applied to CSS custom properties
 * Supports per-loan-type colors (BTL, Bridge, Core) with dynamic columns
 */

import { useEffect } from 'react';
import { useSupabase } from '../contexts/SupabaseContext';

// Default column colors (these values are applied as CSS custom properties)
const DEFAULT_COLUMNS = [
  { bg: 'var(--token-column-navy)', text: 'var(--token-color-white)' },  // Column 1 - navy
  { bg: 'var(--token-column-navy-500)', text: 'var(--token-color-white)' },  // Column 2 - navy-500
  { bg: 'var(--token-column-orange)', text: 'var(--token-color-white)' }   // Column 3 - orange
];

// Default header colors per loan type (new format with columns array)
const DEFAULT_HEADER_COLORS = {
  btl: {
    labelBg: 'var(--token-ui-background-subtle)',
    labelText: 'var(--token-text-primary)',
    columns: [...DEFAULT_COLUMNS]
  },
  bridge: {
    labelBg: 'var(--token-ui-background-subtle)',
    labelText: 'var(--token-text-primary)',
    columns: [...DEFAULT_COLUMNS]
  },
  core: {
    labelBg: 'var(--token-ui-background-subtle)',
    labelText: 'var(--token-text-primary)',
    columns: [...DEFAULT_COLUMNS]
  }
};

// Helper to migrate old format (col1Bg, col2Bg...) to new format (columns array)
const migrateToColumnsFormat = (loanTypeColors, defaults) => {
  if (!loanTypeColors) return defaults;
  
  if (loanTypeColors.columns) {
    // Already in new format
    return {
      labelBg: loanTypeColors.labelBg || defaults.labelBg,
      labelText: loanTypeColors.labelText || defaults.labelText,
      columns: loanTypeColors.columns
    };
  }
  
  // Migrate from old format (col1Bg, col2Bg, col3Bg...)
  const columns = [];
  let i = 1;
  while (loanTypeColors[`col${i}Bg`] !== undefined || i <= 3) {
    columns.push({
      bg: loanTypeColors[`col${i}Bg`] || defaults.columns[i-1]?.bg || 'var(--token-column-navy)',
      text: loanTypeColors[`col${i}Text`] || defaults.columns[i-1]?.text || 'var(--token-color-white)'
    });
    i++;
    if (i > 10) break; // Safety limit
  }
  
  return {
    labelBg: loanTypeColors.labelBg || defaults.labelBg,
    labelText: loanTypeColors.labelText || defaults.labelText,
    columns: columns.length > 0 ? columns : defaults.columns
  };
};

// Apply colors to CSS custom properties for a specific loan type
const applyHeaderColors = (colors, loanType) => {
  const root = document.documentElement;
  const prefix = `--results-header-${loanType}`;
  
  // Apply loan-type specific label colors
  root.style.setProperty(`${prefix}-label-bg`, colors.labelBg);
  root.style.setProperty(`${prefix}-label-text`, colors.labelText);
  
  // Apply column colors (dynamic number of columns)
  const columns = colors.columns || DEFAULT_COLUMNS;
  columns.forEach((col, idx) => {
    root.style.setProperty(`${prefix}-col${idx + 1}-bg`, col.bg);
    root.style.setProperty(`${prefix}-col${idx + 1}-text`, col.text);
  });
  
  // Store the column count for CSS/JS reference
  root.style.setProperty(`${prefix}-column-count`, columns.length.toString());
};

// Apply colors for all loan types
const applyAllHeaderColors = (allColors) => {
  const loanTypes = ['btl', 'bridge', 'core'];
  loanTypes.forEach(loanType => {
    const colors = allColors[loanType] || DEFAULT_HEADER_COLORS[loanType];
    applyHeaderColors(colors, loanType);
  });
  
  // Also set the default (non-prefixed) colors for backward compatibility
  // Use BTL colors as the default
  const defaultColors = allColors.btl || DEFAULT_HEADER_COLORS.btl;
  const root = document.documentElement;
  root.style.setProperty('--results-header-label-bg', defaultColors.labelBg);
  root.style.setProperty('--results-header-label-text', defaultColors.labelText);
  
  // Apply first 3 columns to legacy properties for backward compatibility
  const columns = defaultColors.columns || DEFAULT_COLUMNS;
  for (let i = 0; i < Math.min(columns.length, 10); i++) {
    root.style.setProperty(`--results-header-col${i + 1}-bg`, columns[i].bg);
    root.style.setProperty(`--results-header-col${i + 1}-text`, columns[i].text);
  }
};

export function useHeaderColors() {
  const { supabase } = useSupabase();

  useEffect(() => {
    const loadColors = async () => {
      try {
        // First check localStorage for quick loading
        const stored = localStorage.getItem('results_table_header_colors');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Check if it's the per-loan-type format
          if (parsed.btl || parsed.bridge || parsed.core) {
            const allColors = {
              btl: migrateToColumnsFormat(parsed.btl, DEFAULT_HEADER_COLORS.btl),
              bridge: migrateToColumnsFormat(parsed.bridge, DEFAULT_HEADER_COLORS.bridge),
              core: migrateToColumnsFormat(parsed.core, DEFAULT_HEADER_COLORS.core)
            };
            applyAllHeaderColors(allColors);
          }
        }

        // Then load from Supabase for the latest values
        if (supabase) {
          const { data, error } = await supabase
            .from('results_configuration')
            .select('*')
            .eq('key', 'header_colors');

          if (!error && data && data.length > 0) {
            const allColors = { ...DEFAULT_HEADER_COLORS };
            
            // Reconstruct colors from the per-calculator-type rows
            data.forEach(row => {
              const config = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
              
              if (row.calculator_type === 'btl') {
                allColors.btl = migrateToColumnsFormat(config, DEFAULT_HEADER_COLORS.btl);
              } else if (row.calculator_type === 'bridge') {
                allColors.bridge = migrateToColumnsFormat(config, DEFAULT_HEADER_COLORS.bridge);
              } else if (row.calculator_type === 'core') {
                allColors.core = migrateToColumnsFormat(config, DEFAULT_HEADER_COLORS.core);
              }
            });
            
            applyAllHeaderColors(allColors);
            
            // Update localStorage
            localStorage.setItem('results_table_header_colors', JSON.stringify(allColors));
          }
        }
      } catch (e) {
        console.warn('Failed to load header colors:', e);
      }
    };

    loadColors();
  }, [supabase]);
}

export default useHeaderColors;
