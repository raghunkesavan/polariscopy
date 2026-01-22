import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import '../../styles/Products.css';

/**
 * ProductsTable - TanStack Table implementation of the rates table
 * 
 * @param {object} props
 * @param {Array} props.ratesData - Raw rates data from API
 * @param {string} props.subTab - Current sub-tab (core, specialist, etc.)
 * @param {boolean} props.isAdmin - Whether user is admin
 * @param {function} props.onStartEdit - Callback to start editing
 * @param {object} props.editingCell - Currently editing cell info
 * @param {string} props.editValue - Current edit value
 * @param {function} props.setEditValue - Setter for edit value
 * @param {function} props.onSaveRate - Callback to save rate
 * @param {function} props.onCancelEdit - Callback to cancel edit
 * @param {boolean} props.savingRate - Saving state
 */
const ProductsTable = ({
  ratesData,
  subTab,
  isAdmin,
  onStartEdit,
  editingCell,
  editValue,
  setEditValue,
  onSaveRate,
  onCancelEdit,
  savingRate,
}) => {
  // 1. Transform Data
  const { tableData, tiers, productTypes } = useMemo(() => {
    if (!ratesData || ratesData.length === 0) {
      return { tableData: [], tiers: [], productTypes: [] };
    }

    // --- Step A: Structure the data (same logic as original) ---
    const structured = {};
    ratesData.forEach(rate => {
      const tierNum = String(rate.tier || '1');
      const tier = tierNum.startsWith('Tier') ? tierNum : `Tier ${tierNum}`;
      const product = rate.product || 'Unknown';
      const productFee = rate.product_fee;
      const maxLtv = rate.max_ltv || 0;
      const rateValue = rate.rate || 0;
      const revertMargin = rate.revert_margin;
      const revertIndex = rate.revert_index || 'MVR';
      const maxDeferInt = rate.max_defer_int !== null && rate.max_defer_int !== undefined ? Number(rate.max_defer_int) : null;
      const maxRolledMonths = rate.max_rolled_months !== null && rate.max_rolled_months !== undefined ? Number(rate.max_rolled_months) : null;

      if (!structured[tier]) {
        structured[tier] = { products: {}, maxDeferInt, maxRolledMonths };
      } else {
        // Update tier defaults if they were null initially but we found a value now
        if (structured[tier].maxDeferInt === null && maxDeferInt !== null) {
          structured[tier].maxDeferInt = maxDeferInt;
        }
        if (structured[tier].maxRolledMonths === null && maxRolledMonths !== null) {
          structured[tier].maxRolledMonths = maxRolledMonths;
        }
      }

      if (!structured[tier].products[product]) {
        structured[tier].products[product] = {
          feeRanges: new Set(),
          ltvRates: {},
          maxDeferInt,
          maxRolledMonths
        };
      }
      if (maxDeferInt !== null && maxDeferInt !== undefined) {
        structured[tier].products[product].maxDeferInt = maxDeferInt;
      }
      if (maxRolledMonths !== null && maxRolledMonths !== undefined) {
        structured[tier].products[product].maxRolledMonths = maxRolledMonths;
      }
      if (productFee !== null && productFee !== undefined) {
        structured[tier].products[product].feeRanges.add(Number(productFee));
      }

      const ltvKey = `${maxLtv}_${productFee}`;
      if (!structured[tier].products[product].ltvRates[ltvKey]) {
        structured[tier].products[product].ltvRates[ltvKey] = {
          id: rate.id,
          ltv: maxLtv,
          fee: productFee,
          rate: rateValue,
          revertMargin,
          revertIndex,
          set_key: rate.set_key,
          tier: tier,
          product: product
        };
      }
    });

    // --- Step B: Determine Tiers and Fees ---
    let sortedTiers = Object.keys(structured).sort();
    const isCoreOrCommercial = subTab === 'core' || subTab === 'commercial';
    if (isCoreOrCommercial) {
      sortedTiers = sortedTiers.filter(tier => tier === 'Tier 1' || tier === 'Tier 2');
    }

    const allFees = new Set();
    sortedTiers.forEach(tier => {
      Object.values(structured[tier].products || {}).forEach(p => {
        if (p.feeRanges) p.feeRanges.forEach(f => allFees.add(f));
      });
    });
    const feeList = Array.from(allFees).sort((a, b) => a - b);
    const products = ['3yr Fix', '2yr Fix', '2yr Tracker'];

    // --- Step C: Build Flat Rows for TanStack Table ---
    const rows = [];

    feeList.forEach(fee => {
      // 1. Fee Range Row (Merged)
      const feeRow = { type: 'fee_header', fee, id: `fee-${fee}` };
      sortedTiers.forEach(tier => {
        const tierData = structured[tier];
        const hasAnyFee = products.some(p => tierData?.products?.[p]?.feeRanges?.has(fee));
        feeRow[tier] = hasAnyFee ? `${fee}% fee range` : '—';
      });
      rows.push(feeRow);

      // 2. Rate Row (Individual)
      const rateRow = { type: 'rate', fee, id: `rate-${fee}` };
      sortedTiers.forEach(tier => {
        products.forEach(product => {
          const productData = structured[tier]?.products?.[product];
          const rateEntry = Object.values(productData?.ltvRates || {}).find(r => Number(r.fee) === fee);
          
          // Store full rate object for editing context
          rateRow[`${tier}_${product}`] = {
            value: rateEntry?.rate,
            id: rateEntry?.id,
            isTracker: product.includes('Tracker'),
            entry: rateEntry,
            tier,
            product
          };
        });
      });
      rows.push(rateRow);

      // 3. Revert Rate Row (Merged)
      const revertRow = { type: 'revert', fee, id: `revert-${fee}` };
      sortedTiers.forEach(tier => {
        const tierData = structured[tier];
        let revertText = 'MVR';
        if (tier !== 'Tier 1') {
          const anyProduct = products.find(p => tierData?.products?.[p]);
          if (anyProduct) {
            const productData = tierData.products[anyProduct];
            const rateEntry = Object.values(productData?.ltvRates || {}).find(r => Number(r.fee) === fee);
            if (rateEntry?.revertMargin !== null && rateEntry?.revertMargin !== undefined) {
              const margin = Number(rateEntry.revertMargin);
              revertText = `MVR ${margin >= 0 ? '+' : ''}${margin}%`;
            }
          }
        }
        revertRow[tier] = revertText;
      });
      rows.push(revertRow);
    });

      // 4. Defer Row (Per Product) - Only if not core
    if (subTab !== 'core') {
      const deferRow = { type: 'defer', id: 'defer', uniform: {} };
      sortedTiers.forEach(tier => {
        const values = products.map(product => {
          const tierData = structured[tier];
          const productData = tierData?.products?.[product];
          // Prefer product-specific value, fallback to tier default
          const val = productData?.maxDeferInt ?? tierData?.maxDeferInt;
          return (val !== undefined && val !== null) ? `${val}%` : '—';
        });

        // Check uniformity - ignore '—' if we have at least one value? 
        // Or strict uniformity? User wants it joined if "same".
        // If we have ['2%', '2%', '—'] because one product is missing, 
        // treating it as uniform '2%' is usually what's desired for "Tier properties".
        const validValues = values.filter(v => v !== '—');
        const firstVal = validValues[0];
        const isUniform = validValues.length > 0 && validValues.every(v => v === firstVal);
        
        deferRow.uniform[tier] = isUniform;

        products.forEach((product, idx) => {
          // If uniform, we can just use the valid value for all cells to ensure merge looks right
          // But the merge logic only renders the first cell.
          // We just need to ensure the first cell has the value.
          if (isUniform) {
             deferRow[`${tier}_${product}`] = firstVal;
          } else {
             deferRow[`${tier}_${product}`] = values[idx];
          }
        });
      });
      rows.push(deferRow);

      // 5. Rolled Months Row (Per Product) - Only if not core
      const rolledRow = { type: 'rolled_months', id: 'rolled_months', uniform: {} };
      sortedTiers.forEach(tier => {
        const values = products.map(product => {
          const tierData = structured[tier];
          const productData = tierData?.products?.[product];
          const val = productData?.maxRolledMonths ?? tierData?.maxRolledMonths;
          return (val !== undefined && val !== null) ? `${val}m` : '—';
        });

        const validValues = values.filter(v => v !== '—');
        const firstVal = validValues[0];
        const isUniform = validValues.length > 0 && validValues.every(v => v === firstVal);

        rolledRow.uniform[tier] = isUniform;

        products.forEach((product, idx) => {
          if (isUniform) {
             rolledRow[`${tier}_${product}`] = firstVal;
          } else {
             rolledRow[`${tier}_${product}`] = values[idx];
          }
        });
      });
      rows.push(rolledRow);
    }

    return { tableData: rows, tiers: sortedTiers, productTypes: products };
  }, [ratesData, subTab]);

  // 2. Define Columns
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper();
    
    // First column: Row Label
    const cols = [
      columnHelper.accessor('label', {
        id: 'label',
        header: () => <span className="slds-assistive-text">Rate Type</span>,
        cell: info => {
          const { type, fee } = info.row.original;
          if (type === 'fee_header') return 'Fee range';
          if (type === 'rate') return 'Rate';
          if (type === 'revert') return 'Revert rate';
          if (type === 'defer') return 'Defer up to';
          if (type === 'rolled_months') return 'Rolled months';
          return '';
        },
      })
    ];

    // Tier Columns
    tiers.forEach(tier => {
      // Create a Group Column for the Tier
      cols.push(
        columnHelper.group({
          id: tier,
          header: () => (
            <div className={`slds-truncate products-rates-table__tier-header products-rates-table__tier-header--${tier.toLowerCase().replace(/\s+/g, '-')}`}>
              {tier}
            </div>
          ),
          columns: productTypes.map(product => 
            columnHelper.accessor(
              // Accessor logic depends on row type
              row => {
                if (['rate', 'defer', 'rolled_months'].includes(row.type)) return row[`${tier}_${product}`];
                return row[tier]; // For merged rows, we stored value in tier key
              },
              {
                id: `${tier}_${product}`,
                header: () => <div className="slds-truncate">{product}</div>,
                cell: info => {
                  const { type } = info.row.original;
                  const value = info.getValue();

                  // --- RENDER LOGIC ---
                  
                  // 1. Rate Row (Editable)
                  if (type === 'rate') {
                    const { value: rateVal, id: rateId, isTracker, entry } = value || {};
                    const hasRate = rateVal !== undefined && rateVal !== null;
                    const isEditing = editingCell?.rateId === rateId && editingCell?.field === 'rate';
                    
                    let displayValue = '—';
                    if (hasRate) {
                      const percentage = Number(rateVal).toFixed(2);
                      displayValue = isTracker ? `${percentage}% +BBR` : `${percentage}%`;
                    }

                    if (isEditing) {
                      return (
                        <div className="products-rate-cell__edit-container">
                          <input
                            type="number"
                            className="products-rate-cell__input"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onSaveRate();
                              if (e.key === 'Escape') onCancelEdit();
                            }}
                            step="0.01"
                            min="0"
                            max="100"
                            autoFocus
                            disabled={savingRate}
                          />
                          <div className="products-rate-cell__edit-actions">
                            <button type="button" className="products-rate-cell__save-btn" onClick={onSaveRate} disabled={savingRate}>✓</button>
                            <button type="button" className="products-rate-cell__cancel-btn" onClick={onCancelEdit} disabled={savingRate}>✕</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        className={`slds-truncate ${isAdmin && hasRate ? 'products-rate-cell__value' : ''}`}
                        style={{ cursor: isAdmin && hasRate ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (isAdmin && hasRate && rateId) {
                            onStartEdit(rateId, 'rate', rateVal, {
                              oldValue: rateVal,
                              set_key: entry?.set_key || subTab,
                              product,
                              tier,
                              fee: info.row.original.fee
                            });
                          }
                        }}
                        title={isAdmin && hasRate ? 'Click to edit' : undefined}
                      >
                        {displayValue}
                        {isAdmin && hasRate && <span className="products-rate-cell__edit-icon">✎</span>}
                      </div>
                    );
                  }

                  // 2. Merged Rows (Fee, Revert, Defer)
                  // The actual merging happens in the <tbody> loop by checking column index
                  // Here we just return the value
                  return <div className="slds-truncate">{value}</div>;
                }
              }
            )
          )
        })
      );
    });

    return cols;
  }, [tiers, productTypes, isAdmin, editingCell, editValue, savingRate, subTab]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (tiers.length === 0) {
    return (
      <div className="slds-text-align_center slds-p-around_large">
        <p className="slds-text-body_regular">No rates available for this product category</p>
      </div>
    );
  }

  return (
    <div className="slds-scrollable_x">
      <table className="products-rates-table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} className="slds-line-height_reset">
              {headerGroup.headers.map(header => {
                // Handle RowSpan for the first column ("Rate Type")
                if (header.column.id === 'label' && headerGroup.depth === 0) {
                  return (
                    <th key={header.id} scope="col" rowSpan={2} className="products-rates-table__label-col">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                }
                // Skip rendering the label placeholder in the second row
                if (header.column.id === 'label' && headerGroup.depth === 1) {
                  return null;
                }

                // Handle ColSpan for Tier Headers
                // TanStack Table handles colspan automatically for groups via header.colSpan
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    scope="col"
                    className={`slds-text-align_center ${
                      header.depth === 0 ? '' : 'products-rates-table__product-col'
                    }`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => {
            const rowType = row.original.type;
            const isAlwaysMerged = ['fee_header', 'revert'].includes(rowType);
            const isConditionallyMerged = ['defer', 'rolled_months'].includes(rowType);
            
            // Determine row class
            let rowClass = '';
            if (rowType === 'fee_header') rowClass = 'products-rates-table__fee-row';
            if (rowType === 'rate') rowClass = 'products-rates-table__rate-row';
            if (rowType === 'revert') rowClass = 'products-rates-table__revert-row';
            if (rowType === 'defer' || rowType === 'rolled_months') rowClass = 'products-rates-table__info-row';

            return (
              <tr key={row.id} className={rowClass}>
                {row.getVisibleCells().map(cell => {
                  // 1. Label Column
                  if (cell.column.id === 'label') {
                    return (
                      <th key={cell.id} scope="row" className="products-rates-table__label-cell">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </th>
                    );
                  }

                  // 2. Data Columns
                  const [tier, product] = cell.column.id.split('_');
                  const isUniform = row.original.uniform?.[tier];
                  const shouldMerge = isAlwaysMerged || (isConditionallyMerged && isUniform);

                  // If it's a merged row, we need special logic
                  if (shouldMerge) {
                    // We only render the cell if it's the FIRST product in the tier
                    // The column ID is `${tier}_${product}`
                    const productIndex = productTypes.indexOf(product);
                    
                    if (productIndex === 0) {
                      // Render with colspan 3
                      return (
                        <td key={cell.id} colSpan={3} className="slds-text-align_center">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    } else {
                      // Don't render anything for 2nd and 3rd products
                      return null;
                    }
                  }

                  // 3. Standard Rate Row (or non-uniform info row)
                  return (
                    <td key={cell.id} className={`slds-text-align_center ${
                      isAdmin && cell.getValue()?.value ? 'products-rate-cell--editable' : ''
                    }`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
