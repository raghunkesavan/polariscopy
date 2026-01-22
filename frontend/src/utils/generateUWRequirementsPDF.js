/**
 * Generate UW Requirements Checklist PDF
 * 
 * This utility generates a PDF document of the UW requirements checklist
 * using @react-pdf/renderer on the client side.
 */
import { pdf } from '@react-pdf/renderer';
import React from 'react';
import UWRequirementsPDF from '../components/pdf/UWRequirementsPDF';
import {
  DEFAULT_UW_REQUIREMENTS,
  LOCALSTORAGE_UW_REQUIREMENTS_KEY,
  filterByStage,
  filterByConditions
} from '../config/uwRequirements';

/**
 * Get requirements from localStorage merged with defaults
 */
function getRequirements() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_UW_REQUIREMENTS_KEY);
    if (raw) {
      const overrides = JSON.parse(raw);
      if (Array.isArray(overrides)) {
        // Merge overrides with defaults
        const overrideMap = new Map(overrides.map(r => [r.id, r]));
        const defaultIds = new Set(DEFAULT_UW_REQUIREMENTS.map(r => r.id));
        
        // Update defaults with any overrides
        const merged = DEFAULT_UW_REQUIREMENTS.map(defaultReq => {
          const override = overrideMap.get(defaultReq.id);
          return override ? { ...defaultReq, ...override } : defaultReq;
        });
        
        // Add any custom requirements from overrides that aren't in defaults
        overrides.forEach(override => {
          if (!defaultIds.has(override.id)) {
            merged.push(override);
          }
        });
        
        return merged;
      }
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_UW_REQUIREMENTS;
}

/**
 * Generate UW Requirements PDF blob
 * 
 * @param {Object} options - Generation options
 * @param {Array} options.checkedItems - Array of checked requirement IDs
 * @param {Object} options.quoteData - Quote data for header/conditional requirements
 * @param {string} options.stage - 'DIP', 'Indicative', or null for all
 * @param {boolean} options.showGuidance - Include internal guidance notes
 * @returns {Promise<Blob>} - PDF blob
 */
export async function generateUWRequirementsPDF({
  checkedItems = [],
  quoteData = {},
  stage = null,
  showGuidance = false
}) {
  // Get requirements
  let requirements = getRequirements();
  
  // Filter by stage if specified
  if (stage) {
    requirements = filterByStage(requirements, stage);
  }
  
  // Filter by conditions based on quote data
  requirements = filterByConditions(requirements, quoteData);
  
  // Only include enabled requirements
  requirements = requirements.filter(r => r.enabled !== false);

  // Generate the PDF document
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const pdfDocument = React.createElement(UWRequirementsPDF, {
    requirements,
    checkedItems,
    quoteData,
    stage,
    generatedDate,
    showGuidance
  });

  // Generate blob
  const blob = await pdf(pdfDocument).toBlob();
  return blob;
}

/**
 * Download UW Requirements PDF
 * 
 * @param {Object} options - Generation options (same as generateUWRequirementsPDF)
 * @param {string} filename - Optional custom filename
 */
export async function downloadUWRequirementsPDF(options, filename) {
  try {
    const blob = await generateUWRequirementsPDF(options);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Generate filename
    const defaultFilename = options.quoteData?.reference_number
      ? `UW_Checklist_${options.quoteData.reference_number}.pdf`
      : `UW_Checklist_${new Date().toISOString().split('T')[0]}.pdf`;
    
    link.href = url;
    link.download = filename || defaultFilename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    return { success: true };
  } catch (error) {
    console.error('Error generating UW Requirements PDF:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Open UW Requirements PDF in new tab
 * 
 * @param {Object} options - Generation options (same as generateUWRequirementsPDF)
 */
export async function openUWRequirementsPDF(options) {
  try {
    const blob = await generateUWRequirementsPDF(options);
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Cleanup after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000); // Keep URL valid for 1 minute
    
    return { success: true };
  } catch (error) {
    console.error('Error opening UW Requirements PDF:', error);
    return { success: false, error: error.message };
  }
}
