import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DEFAULT_UW_REQUIREMENTS,
  UW_STAGES,
  LOCALSTORAGE_UW_REQUIREMENTS_KEY,
  filterByStage,
  filterByConditions
} from '../config/uwRequirements';

/**
 * localStorage key for checked items per quote
 */
const getCheckedItemsKey = (quoteId) => `uw.checklist.${quoteId}`;

/**
 * Read UW requirements from localStorage
 */
function getRequirements() {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_UW_REQUIREMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fall through to defaults
  }
  return DEFAULT_UW_REQUIREMENTS;
}

/**
 * Read checked items from localStorage for a specific quote
 */
function getCheckedItems(quoteId) {
  if (!quoteId) return [];
  try {
    const raw = localStorage.getItem(getCheckedItemsKey(quoteId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Return empty
  }
  return [];
}

/**
 * Save checked items to localStorage for a specific quote
 */
function saveCheckedItems(quoteId, items) {
  if (!quoteId) return;
  localStorage.setItem(getCheckedItemsKey(quoteId), JSON.stringify(items));
}

/**
 * Custom hook for managing UW requirements checklist state
 * 
 * @param {Object} options
 * @param {string} options.quoteId - The quote/DIP ID for persisting checked state
 * @param {string} options.stage - 'DIP' or 'Indicative'
 * @param {Object} options.quoteData - Quote data for evaluating conditions
 * @returns {Object} Hook state and methods
 */
export default function useUWRequirements({
  quoteId,
  stage = UW_STAGES.DIP,
  quoteData = {}
} = {}) {
  const [requirements, setRequirements] = useState(DEFAULT_UW_REQUIREMENTS);
  const [checkedItems, setCheckedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load requirements and checked items on mount
  useEffect(() => {
    setRequirements(getRequirements());
    if (quoteId) {
      setCheckedItems(getCheckedItems(quoteId));
    }
    setLoading(false);

    // Listen for requirements updates
    const handleStorage = (e) => {
      if (e.key === LOCALSTORAGE_UW_REQUIREMENTS_KEY) {
        setRequirements(getRequirements());
      }
      if (quoteId && e.key === getCheckedItemsKey(quoteId)) {
        setCheckedItems(getCheckedItems(quoteId));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [quoteId]);

  // Filter requirements by stage and conditions
  const applicableRequirements = useMemo(() => {
    return filterByConditions(filterByStage(requirements, stage), quoteData);
  }, [requirements, stage, quoteData]);

  // Calculate progress stats
  const stats = useMemo(() => {
    const total = applicableRequirements.length;
    const checked = applicableRequirements.filter(r => checkedItems.includes(r.id)).length;
    const required = applicableRequirements.filter(r => r.required).length;
    const requiredChecked = applicableRequirements.filter(r => r.required && checkedItems.includes(r.id)).length;
    
    return {
      total,
      checked,
      required,
      requiredChecked,
      percentComplete: total > 0 ? Math.round((checked / total) * 100) : 0,
      requiredPercentComplete: required > 0 ? Math.round((requiredChecked / required) * 100) : 0,
      isComplete: checked === total,
      isRequiredComplete: requiredChecked === required,
      outstanding: total - checked,
      requiredOutstanding: required - requiredChecked
    };
  }, [applicableRequirements, checkedItems]);

  // Toggle a requirement's checked state
  const toggleItem = useCallback((id) => {
    setCheckedItems(prev => {
      const newItems = prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id];
      
      if (quoteId) {
        saveCheckedItems(quoteId, newItems);
      }
      return newItems;
    });
  }, [quoteId]);

  // Set a specific item's checked state
  const setItemChecked = useCallback((id, checked) => {
    setCheckedItems(prev => {
      let newItems;
      if (checked && !prev.includes(id)) {
        newItems = [...prev, id];
      } else if (!checked && prev.includes(id)) {
        newItems = prev.filter(i => i !== id);
      } else {
        return prev;
      }
      
      if (quoteId) {
        saveCheckedItems(quoteId, newItems);
      }
      return newItems;
    });
  }, [quoteId]);

  // Check all items
  const checkAll = useCallback(() => {
    const allIds = applicableRequirements.map(r => r.id);
    setCheckedItems(allIds);
    if (quoteId) {
      saveCheckedItems(quoteId, allIds);
    }
  }, [applicableRequirements, quoteId]);

  // Uncheck all items
  const uncheckAll = useCallback(() => {
    setCheckedItems([]);
    if (quoteId) {
      saveCheckedItems(quoteId, []);
    }
  }, [quoteId]);

  // Check if a specific item is checked
  const isChecked = useCallback((id) => {
    return checkedItems.includes(id);
  }, [checkedItems]);

  // Get requirement by ID
  const getRequirement = useCallback((id) => {
    return requirements.find(r => r.id === id);
  }, [requirements]);

  return {
    // State
    requirements: applicableRequirements,
    allRequirements: requirements,
    checkedItems,
    loading,
    stats,
    
    // Methods
    toggleItem,
    setItemChecked,
    checkAll,
    uncheckAll,
    isChecked,
    getRequirement
  };
}
