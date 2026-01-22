-- Migration 010: Add Performance Indexes
-- Purpose: Add database indexes to improve query performance for common operations
-- Impact: Faster list page loads, quote lookups, and PDF generation
-- Created: 2025

-- ============================================
-- Quotes Table Indexes
-- ============================================

-- Index for sorting quotes by creation date (DESC) on list page
-- Used by: QuotesList component, export endpoint
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Index for filtering quotes by calculator type and sorting by date
-- Used by: Calculator-specific quote lists
CREATE INDEX IF NOT EXISTS idx_quotes_calculator_type_created ON quotes(calculator_type, created_at DESC);

-- Index for filtering quotes by status
-- Used by: Future status-based filtering
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);

-- Index for reference number lookups
-- Used by: Quote retrieval by reference number
CREATE INDEX IF NOT EXISTS idx_quotes_reference_number ON quotes(reference_number);

-- ============================================
-- Quote Results Table Indexes
-- ============================================

-- Index for fetching results by quote_id
-- Used by: Quote details page, PDF generation, export endpoint
CREATE INDEX IF NOT EXISTS idx_quote_results_quote_id ON quote_results(quote_id);

-- Composite index for filtering by quote and fee column
-- Used by: PDF generation with specific fee columns
CREATE INDEX IF NOT EXISTS idx_quote_results_quote_fee ON quote_results(quote_id, fee_column);

-- ============================================
-- Bridge Quotes Table Indexes
-- ============================================

-- Index for sorting bridge quotes by creation date (DESC)
-- Used by: BridgeQuotesList component, export endpoint
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_created_at ON bridge_quotes(created_at DESC);

-- Index for filtering bridge quotes by calculator type and sorting
-- Used by: Calculator-specific lists
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_calculator_type_created ON bridge_quotes(calculator_type, created_at DESC);

-- Index for filtering bridge quotes by status
-- Used by: Future status-based filtering
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_status ON bridge_quotes(status);

-- Index for reference number lookups
-- Used by: Quote retrieval by reference number
CREATE INDEX IF NOT EXISTS idx_bridge_quotes_reference_number ON bridge_quotes(reference_number);

-- ============================================
-- Bridge Quote Results Table Indexes
-- ============================================

-- Index for fetching results by quote_id
-- Used by: Quote details page, PDF generation, export endpoint
CREATE INDEX IF NOT EXISTS idx_bridge_quote_results_quote_id ON bridge_quote_results(quote_id);

-- Composite index for filtering by quote and product name
-- Used by: PDF generation with specific products
CREATE INDEX IF NOT EXISTS idx_bridge_quote_results_quote_product ON bridge_quote_results(quote_id, product_name);

-- ============================================
-- Rates Table Indexes (if not already present)
-- ============================================

-- Index for filtering rates by set_key
-- Used by: Rate matching in calculators (RATES_BTL, RATES_RETENTION, etc.)
CREATE INDEX IF NOT EXISTS idx_rates_set_key ON rates_flat(set_key);

-- Index for filtering rates by product
-- Used by: Product-specific rate lookups
CREATE INDEX IF NOT EXISTS idx_rates_product ON rates_flat(product);

-- Index for filtering rates by tier
-- Used by: Tier-based rate lookups
CREATE INDEX IF NOT EXISTS idx_rates_tier ON rates_flat(tier);

-- Index for filtering rates by property/scope
-- Used by: Property type filtering (Residential, Commercial, etc.)
CREATE INDEX IF NOT EXISTS idx_rates_property ON rates_flat(property);

-- Composite index for common rate filtering
-- Used by: Calculator rate matching (set_key + tier + product)
CREATE INDEX IF NOT EXISTS idx_rates_set_tier_product ON rates_flat(set_key, tier, product);

-- ============================================
-- Criteria Config Flat Table Indexes
-- ============================================

-- Index for filtering criteria by criteria_set (BTL, BRIDGE, etc.)
-- Used by: Calculator initialization
CREATE INDEX IF NOT EXISTS idx_criteria_criteria_set ON criteria_config_flat(criteria_set);

-- Index for filtering criteria by product_scope
-- Used by: Product-specific criteria lookups
CREATE INDEX IF NOT EXISTS idx_criteria_product_scope ON criteria_config_flat(product_scope);

-- Composite index for criteria filtering
-- Used by: Calculator criteria matching
CREATE INDEX IF NOT EXISTS idx_criteria_set_scope ON criteria_config_flat(criteria_set, product_scope);

-- ============================================
-- Performance Notes
-- ============================================
-- 1. All indexes use IF NOT EXISTS to prevent errors if they already exist
-- 2. Indexes on DESC sorting columns include DESC in the index definition
-- 3. Composite indexes are ordered by most selective column first
-- 4. These indexes will automatically be used by PostgreSQL query planner
-- 5. Monitor index usage with: SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
-- 6. To check index size: SELECT pg_size_pretty(pg_relation_size('index_name'));

-- ============================================
-- Rollback (if needed)
-- ============================================
-- DROP INDEX IF EXISTS idx_quotes_created_at;
-- DROP INDEX IF EXISTS idx_quotes_calculator_type_created;
-- DROP INDEX IF EXISTS idx_quotes_status;
-- DROP INDEX IF EXISTS idx_quotes_reference_number;
-- DROP INDEX IF EXISTS idx_quote_results_quote_id;
-- DROP INDEX IF EXISTS idx_quote_results_quote_fee;
-- DROP INDEX IF EXISTS idx_bridge_quotes_created_at;
-- DROP INDEX IF EXISTS idx_bridge_quotes_calculator_type_created;
-- DROP INDEX IF EXISTS idx_bridge_quotes_status;
-- DROP INDEX IF EXISTS idx_bridge_quotes_reference_number;
-- DROP INDEX IF EXISTS idx_bridge_quote_results_quote_id;
-- DROP INDEX IF EXISTS idx_bridge_quote_results_quote_product;
-- DROP INDEX IF EXISTS idx_rates_set_key;
-- DROP INDEX IF EXISTS idx_rates_product;
-- DROP INDEX IF EXISTS idx_rates_tier;
-- DROP INDEX IF EXISTS idx_rates_property;
-- DROP INDEX IF EXISTS idx_rates_set_tier_product;
-- DROP INDEX IF EXISTS idx_criteria_criteria_set;
-- DROP INDEX IF EXISTS idx_criteria_product_scope;
-- DROP INDEX IF EXISTS idx_criteria_set_scope;
