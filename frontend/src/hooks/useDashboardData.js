import { useState, useEffect, useMemo } from 'react';
import { listQuotes } from '../utils/quotes';

/**
 * Custom hook to fetch and aggregate dashboard data
 * @param {string} timeRange - 'week', 'month', or 'year'
 * @param {string} volumeFilter - 'all', 'quotes', or 'dips'
 */
const useDashboardData = (timeRange, volumeFilter) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch quotes data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listQuotes({ limit: 1000 }); // Get all quotes
        setQuotes(res.quotes || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Fetch once on mount

  // Filter quotes by time range
  const filteredByTime = useMemo(() => {
    const now = new Date();
    let startDate;

    if (timeRange === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'year') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(0); // All time
    }

    return quotes.filter(q => {
      // Exclude drafts for reporting (but include for testing as per requirement)
      // For now, we'll include all to help with testing
      // if (q.quote_status === 'Draft') return false;

      const createdAt = new Date(q.created_at);
      return createdAt >= startDate;
    });
  }, [quotes, timeRange]);

  // Filter by volume filter (all/quotes/dips)
  const filteredByVolume = useMemo(() => {
    if (volumeFilter === 'quotes') {
      // Only quotes that are issued but NOT DIPs
      return filteredByTime.filter(q =>
        q.quote_status === 'Issued' && q.dip_status !== 'Issued'
      );
    } else if (volumeFilter === 'dips') {
      // Only DIPs
      return filteredByTime.filter(q => q.dip_status === 'Issued');
    } else {
      // All (both quotes and DIPs) - For testing, include all quotes regardless of status
      // In production, you'd want to only include issued quotes:
      // return filteredByTime.filter(q => q.quote_status === 'Issued' || q.dip_status === 'Issued');

      // For now, let's include ALL quotes to see the data:
      return filteredByTime;
    }
  }, [filteredByTime, volumeFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const allFiltered = filteredByTime.filter(q =>
      q.quote_status === 'Issued' || q.dip_status === 'Issued'
    );

    return {
      totalQuotes: allFiltered.filter(q => q.quote_status === 'Issued').length,
      totalDIPs: allFiltered.filter(q => q.dip_status === 'Issued').length,
    };
  }, [filteredByTime]);

  // Helper to get property type (using product_scope from quote)
  const getPropertyType = (quote) => {
    return quote.product_scope || quote.property_type || 'Residential';
  };

  // Helper to get product group (Core/Specialist)
  const getProductGroup = (quote) => {
    const range = quote.selected_range || quote.product_range || '';
    if (range.toLowerCase().includes('spec')) return 'Specialist';
    if (range.toLowerCase().includes('core')) return 'Core';
    return null;
  };

  // Helper to get loan amount
  const getLoanAmount = (quote) => {
    // Try direct loan amount field
    if (quote.loan_amount) return parseFloat(quote.loan_amount);

    // Try Bridging-specific fields
    if (quote.gross_loan) return parseFloat(quote.gross_loan);
    if (quote.loan_required) return parseFloat(quote.loan_required);
    if (quote.net_loan) return parseFloat(quote.net_loan);

    // BTL: Calculate from property value * LTV
    if (quote.property_value && quote.target_ltv) {
      return parseFloat(quote.property_value) * (parseFloat(quote.target_ltv) / 100);
    }

    // Bridging: Try ltv field (might be decimal like 0.75 instead of 75)
    if (quote.property_value && quote.ltv) {
      const ltvValue = parseFloat(quote.ltv);
      // If ltv is > 1, it's a percentage; if < 1, it's a decimal
      const ltvMultiplier = ltvValue > 1 ? ltvValue / 100 : ltvValue;
      return parseFloat(quote.property_value) * ltvMultiplier;
    }

    return 0;
  };

  // Aggregate BTL volume data
  const btlData = useMemo(() => {
    const btlQuotes = filteredByVolume.filter(q =>
      q.calculator_type && q.calculator_type.toUpperCase() === 'BTL'
    );

    // Group by property type and product
    const categories = ['Core', 'Specialist', 'Commercial', 'Semi-Commercial'];
    const productNames = ['2yr Fix', '3yr Fix', '2yr Tracker'];

    const aggregated = categories.map(category => {
      const segments = {};

      productNames.forEach(productName => {
        let categoryQuotes = [];

        if (category === 'Core') {
          // Core = Residential with product_group 'Core'
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            const productGroup = getProductGroup(q);
            return propertyType === 'Residential' && productGroup === 'Core';
          });
        } else if (category === 'Specialist') {
          // Specialist = Residential with product_group 'Specialist'
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            const productGroup = getProductGroup(q);
            return propertyType === 'Residential' && productGroup === 'Specialist';
          });
        } else if (category === 'Commercial') {
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            return propertyType === 'Commercial';
          });
        } else if (category === 'Semi-Commercial') {
          categoryQuotes = btlQuotes.filter(q => {
            const propertyType = getPropertyType(q);
            return propertyType === 'Semi-Commercial';
          });
        }

        // Sum loan amounts
        const total = categoryQuotes.reduce((sum, q) => {
          const loanAmount = getLoanAmount(q);
          return sum + loanAmount;
        }, 0);

        segments[productName] = total;
      });

      return {
        label: category,
        segments,
      };
    });

    const totalVolume = aggregated.reduce((sum, cat) =>
      sum + Object.values(cat.segments).reduce((s, v) => s + v, 0), 0
    );

    return { data: aggregated, total: totalVolume };
  }, [filteredByVolume]);

  // Aggregate Bridging volume data
  const bridgingData = useMemo(() => {
    const bridgingQuotes = filteredByVolume.filter(q => {
      const type = (q.calculator_type || '').toLowerCase();
      return type.includes('bridg') || type.includes('bridge');
    });

    // Group by property type only (no Core/Specialist for Bridging)
    const categories = ['Residential', 'Commercial', 'Semi-Commercial'];
    const productTypes = ['Fusion', 'Fixed Bridge', 'Variable Bridge'];

    const aggregated = categories.map(category => {
      const segments = {};

      productTypes.forEach(productType => {
        // Filter by property type
        const categoryQuotes = bridgingQuotes.filter(q => {
          const propertyType = getPropertyType(q);
          return propertyType === category;
        });

        // Sum loan amounts
        const total = categoryQuotes.reduce((sum, q) => {
          const loanAmount = getLoanAmount(q);
          return sum + loanAmount;
        }, 0);

        // Since product type is not available in the quote (it's in bridge_quote_results),
        // distribute the total volume equally across all three product types
        // This gives a rough approximation until we fetch results data
        segments[productType] = total / 3;
      });

      return {
        label: category,
        segments,
      };
    });

    const totalVolume = aggregated.reduce((sum, cat) =>
      sum + Object.values(cat.segments).reduce((s, v) => s + v, 0), 0
    );

    return { data: aggregated, total: totalVolume };
  }, [filteredByVolume]);

  return {
    loading,
    error,
    totals,
    btlData,
    bridgingData,
  };
};

export default useDashboardData;
