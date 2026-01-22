-- =====================================================
-- Azure SQL Master Migration Script
-- Migrating from Supabase (PostgreSQL) to Azure SQL
-- =====================================================
-- 
-- IMPORTANT: Review and customize this script before execution
-- Run this script in Azure Data Studio or SQL Server Management Studio
-- 
-- Conversion Notes:
-- - uuid → uniqueidentifier
-- - gen_random_uuid() → NEWID()
-- - boolean → bit
-- - timestamp with time zone → datetimeoffset
-- - text → nvarchar(max)
-- - jsonb → nvarchar(max) with JSON validation
-- - numeric → decimal(18,2)
-- =====================================================

USE [polaris_calculator];
GO

-- =====================================================
-- 1. CREATE USERS TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        email NVARCHAR(255) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        name NVARCHAR(255),
        access_level INT NOT NULL CHECK (access_level BETWEEN 1 AND 5),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        last_login DATETIMEOFFSET,
        is_active BIT DEFAULT 1
    );

    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_access_level ON users(access_level);
    
    PRINT '✓ Users table created';
END
ELSE
    PRINT '! Users table already exists';
GO

-- =====================================================
-- 2. CREATE BTL_QUOTES TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'btl_quotes')
BEGIN
    CREATE TABLE btl_quotes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET() NOT NULL,
        name NVARCHAR(MAX),
        user_id UNIQUEIDENTIFIER,
        status NVARCHAR(MAX),
        calculator_type NVARCHAR(MAX),
        product_scope NVARCHAR(MAX),
        retention_choice NVARCHAR(MAX),
        retention_ltv INT,
        tier INT,
        property_value DECIMAL(18,2),
        monthly_rent DECIMAL(18,2),
        top_slicing DECIMAL(18,2),
        loan_calculation_requested NVARCHAR(MAX),
        specific_gross_loan DECIMAL(18,2),
        specific_net_loan DECIMAL(18,2),
        target_ltv INT,
        product_type NVARCHAR(MAX),
        add_fees_toggle BIT,
        fee_calculation_type NVARCHAR(MAX),
        additional_fee_amount DECIMAL(18,2),
        selected_range NVARCHAR(MAX),
        criteria_answers NVARCHAR(MAX) CONSTRAINT chk_btl_quotes_criteria_json CHECK (ISJSON(criteria_answers) = 1 OR criteria_answers IS NULL),
        rates_and_products NVARCHAR(MAX) CONSTRAINT chk_btl_quotes_rates_json CHECK (ISJSON(rates_and_products) = 1 OR rates_and_products IS NULL),
        borrower_name NVARCHAR(MAX),
        applicant1 NVARCHAR(MAX),
        applicant2 NVARCHAR(MAX),
        applicant3 NVARCHAR(MAX),
        applicant4 NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        updated_at DATETIMEOFFSET,
        reference_number NVARCHAR(50),
        is_dip BIT DEFAULT 0,
        dip_submitted_at DATETIMEOFFSET,
        dip_status NVARCHAR(50),
        product_range NVARCHAR(100),
        lender_legal_fee NVARCHAR(MAX),
        client_first_name NVARCHAR(255),
        client_last_name NVARCHAR(255),
        client_email NVARCHAR(255),
        client_phone NVARCHAR(50),
        broker_company_name NVARCHAR(255),
        quote_issued_by UNIQUEIDENTIFIER,
        quote_issued_at DATETIMEOFFSET,
        quote_version INT DEFAULT 1,
        applicant_type NVARCHAR(50),
        created_by_user_id UNIQUEIDENTIFIER,
        updated_by_user_id UNIQUEIDENTIFIER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (created_by_user_id) REFERENCES users(id),
        FOREIGN KEY (updated_by_user_id) REFERENCES users(id),
        FOREIGN KEY (quote_issued_by) REFERENCES users(id)
    );

    CREATE INDEX idx_btl_quotes_user_id ON btl_quotes(user_id);
    CREATE INDEX idx_btl_quotes_created_at ON btl_quotes(created_at DESC);
    CREATE INDEX idx_btl_quotes_reference_number ON btl_quotes(reference_number);
    CREATE INDEX idx_btl_quotes_status ON btl_quotes(status);
    
    PRINT '✓ BTL Quotes table created';
END
ELSE
    PRINT '! BTL Quotes table already exists';
GO

-- =====================================================
-- 3. CREATE BRIDGING_QUOTES TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'bridging_quotes')
BEGIN
    CREATE TABLE bridging_quotes (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET() NOT NULL,
        name NVARCHAR(MAX),
        user_id UNIQUEIDENTIFIER,
        status NVARCHAR(MAX),
        calculator_type NVARCHAR(MAX),
        product_scope NVARCHAR(MAX),
        property_value DECIMAL(18,2),
        gross_loan DECIMAL(18,2),
        monthly_rent DECIMAL(18,2),
        top_slicing DECIMAL(18,2),
        use_specific_net_loan BIT,
        specific_net_loan DECIMAL(18,2),
        bridging_loan_term INT,
        charge_type NVARCHAR(MAX),
        sub_product NVARCHAR(MAX),
        criteria_answers NVARCHAR(MAX) CONSTRAINT chk_bridging_quotes_criteria_json CHECK (ISJSON(criteria_answers) = 1 OR criteria_answers IS NULL),
        results NVARCHAR(MAX) CONSTRAINT chk_bridging_quotes_results_json CHECK (ISJSON(results) = 1 OR results_json IS NULL),
        borrower_name NVARCHAR(MAX),
        applicant1 NVARCHAR(MAX),
        applicant2 NVARCHAR(MAX),
        applicant3 NVARCHAR(MAX),
        applicant4 NVARCHAR(MAX),
        notes NVARCHAR(MAX),
        updated_at DATETIMEOFFSET,
        reference_number NVARCHAR(50),
        is_dip BIT DEFAULT 0,
        dip_submitted_at DATETIMEOFFSET,
        dip_status NVARCHAR(50),
        product_range NVARCHAR(100),
        lender_legal_fee NVARCHAR(MAX),
        client_first_name NVARCHAR(255),
        client_last_name NVARCHAR(255),
        client_email NVARCHAR(255),
        client_phone NVARCHAR(50),
        broker_company_name NVARCHAR(255),
        quote_issued_by UNIQUEIDENTIFIER,
        quote_issued_at DATETIMEOFFSET,
        quote_version INT DEFAULT 1,
        applicant_type NVARCHAR(50),
        created_by_user_id UNIQUEIDENTIFIER,
        updated_by_user_id UNIQUEIDENTIFIER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (created_by_user_id) REFERENCES users(id),
        FOREIGN KEY (updated_by_user_id) REFERENCES users(id),
        FOREIGN KEY (quote_issued_by) REFERENCES users(id)
    );

    CREATE INDEX idx_bridging_quotes_user_id ON bridging_quotes(user_id);
    CREATE INDEX idx_bridging_quotes_created_at ON bridging_quotes(created_at DESC);
    CREATE INDEX idx_bridging_quotes_reference_number ON bridging_quotes(reference_number);
    CREATE INDEX idx_bridging_quotes_status ON bridging_quotes(status);
    
    PRINT '✓ Bridging Quotes table created';
END
ELSE
    PRINT '! Bridging Quotes table already exists';
GO

-- =====================================================
-- 4. CREATE RATES TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'rates')
BEGIN
    CREATE TABLE rates (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        lender NVARCHAR(255),
        sub_product NVARCHAR(255),
        product_type NVARCHAR(100),
        product_range NVARCHAR(100),
        rate_type NVARCHAR(50),
        product_term INT,
        initial_rate_term INT,
        product_fee_percent_0_2 DECIMAL(18,2),
        product_fee_percent_2_3 DECIMAL(18,2),
        product_fee_percent_3_plus DECIMAL(18,2),
        initial_rate_0_2 DECIMAL(18,4),
        initial_rate_2_3 DECIMAL(18,4),
        initial_rate_3_plus DECIMAL(18,4),
        svr_rate DECIMAL(18,4),
        min_loan DECIMAL(18,2),
        max_loan DECIMAL(18,2),
        min_property_value DECIMAL(18,2),
        max_property_value DECIMAL(18,2),
        max_ltv INT,
        min_icr INT,
        lender_legal_fee NVARCHAR(MAX),
        lender_valuation_fee DECIMAL(18,2),
        servicing_fee_percent DECIMAL(18,4),
        product_tier INT,
        criteria NVARCHAR(MAX) CONSTRAINT chk_rates_criteria_json CHECK (ISJSON(criteria) = 1 OR criteria IS NULL),
        product_features NVARCHAR(MAX) CONSTRAINT chk_rates_features_json CHECK (ISJSON(product_features) = 1 OR product_features IS NULL),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        title_insurance BIT DEFAULT 0,
        row_order INT,
        min_property_value_slider DECIMAL(18,2),
        max_property_value_slider DECIMAL(18,2),
        min_loan_slider DECIMAL(18,2),
        max_loan_slider DECIMAL(18,2),
        erc_year_1 DECIMAL(18,2),
        erc_year_2 DECIMAL(18,2),
        erc_year_3 DECIMAL(18,2),
        erc_year_4 DECIMAL(18,2),
        erc_year_5 DECIMAL(18,2)
    );

    CREATE INDEX idx_rates_lender ON rates(lender);
    CREATE INDEX idx_rates_product_type ON rates(product_type);
    CREATE INDEX idx_rates_product_range ON rates(product_range);
    CREATE INDEX idx_rates_created_at ON rates(created_at DESC);
    
    PRINT '✓ Rates table created';
END
ELSE
    PRINT '! Rates table already exists';
GO

-- =====================================================
-- 5. CREATE APP_CONSTANTS TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'app_constants')
BEGIN
    CREATE TABLE app_constants (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        constant_key NVARCHAR(255) UNIQUE NOT NULL,
        constant_value NVARCHAR(MAX) NOT NULL,
        description NVARCHAR(MAX),
        category NVARCHAR(100),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_by UNIQUEIDENTIFIER,
        FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    CREATE INDEX idx_app_constants_key ON app_constants(constant_key);
    CREATE INDEX idx_app_constants_category ON app_constants(category);
    
    PRINT '✓ App Constants table created';
END
ELSE
    PRINT '! App Constants table already exists';
GO

-- =====================================================
-- 6. CREATE SUPPORT_REQUESTS TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'support_requests')
BEGIN
    CREATE TABLE support_requests (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        bug_type NVARCHAR(100),
        suggestion NVARCHAR(MAX),
        page NVARCHAR(100) DEFAULT 'Products',
        is_read BIT DEFAULT 0,
        status NVARCHAR(50) DEFAULT 'pending',
        admin_notes NVARCHAR(MAX),
        resolved_by UNIQUEIDENTIFIER,
        resolved_at DATETIMEOFFSET,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE INDEX idx_support_requests_is_read ON support_requests(is_read);
    CREATE INDEX idx_support_requests_status ON support_requests(status);
    CREATE INDEX idx_support_requests_created_at ON support_requests(created_at DESC);
    
    PRINT '✓ Support Requests table created';
END
ELSE
    PRINT '! Support Requests table already exists';
GO

-- =====================================================
-- 7. CREATE AUDIT_LOGS TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER,
        action NVARCHAR(100) NOT NULL,
        table_name NVARCHAR(100),
        record_id NVARCHAR(100),
        old_values NVARCHAR(MAX) CONSTRAINT chk_audit_logs_old_json CHECK (ISJSON(old_values) = 1 OR old_values IS NULL),
        new_values NVARCHAR(MAX) CONSTRAINT chk_audit_logs_new_json CHECK (ISJSON(new_values) = 1 OR new_values IS NULL),
        ip_address NVARCHAR(45),
        user_agent NVARCHAR(MAX),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
    
    PRINT '✓ Audit Logs table created';
END
ELSE
    PRINT '! Audit Logs table already exists';
GO

-- =====================================================
-- 8. CREATE PASSWORD_RESET_TOKENS TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'password_reset_tokens')
BEGIN
    CREATE TABLE password_reset_tokens (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        token NVARCHAR(255) UNIQUE NOT NULL,
        expires_at DATETIMEOFFSET NOT NULL,
        used BIT DEFAULT 0,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
    CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
    
    PRINT '✓ Password Reset Tokens table created';
END
ELSE
    PRINT '! Password Reset Tokens table already exists';
GO

-- =====================================================
-- 9. CREATE RATE_AUDIT_LOG TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'rate_audit_log')
BEGIN
    CREATE TABLE rate_audit_log (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        rate_id UNIQUEIDENTIFIER NOT NULL,
        action NVARCHAR(50) NOT NULL,
        changed_by UNIQUEIDENTIFIER NOT NULL,
        old_values NVARCHAR(MAX) CONSTRAINT chk_rate_audit_old_json CHECK (ISJSON(old_values) = 1 OR old_values IS NULL),
        new_values NVARCHAR(MAX) CONSTRAINT chk_rate_audit_new_json CHECK (ISJSON(new_values) = 1 OR new_values IS NULL),
        change_summary NVARCHAR(MAX),
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        FOREIGN KEY (rate_id) REFERENCES rates(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE INDEX idx_rate_audit_log_rate_id ON rate_audit_log(rate_id);
    CREATE INDEX idx_rate_audit_log_changed_by ON rate_audit_log(changed_by);
    CREATE INDEX idx_rate_audit_log_created_at ON rate_audit_log(created_at DESC);
    
    PRINT '✓ Rate Audit Log table created';
END
ELSE
    PRINT '! Rate Audit Log table already exists';
GO

-- =====================================================
-- 10. CREATE UW_REQUIREMENTS TABLE
-- =====================================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'uw_requirements')
BEGIN
    CREATE TABLE uw_requirements (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        quote_id UNIQUEIDENTIFIER NOT NULL,
        quote_type NVARCHAR(20) NOT NULL CHECK (quote_type IN ('btl', 'bridging')),
        requirement_text NVARCHAR(MAX) NOT NULL,
        category NVARCHAR(100),
        is_completed BIT DEFAULT 0,
        completed_by UNIQUEIDENTIFIER,
        completed_at DATETIMEOFFSET,
        notes NVARCHAR(MAX),
        created_by UNIQUEIDENTIFIER NOT NULL,
        created_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        updated_at DATETIMEOFFSET DEFAULT SYSDATETIMEOFFSET(),
        display_order INT DEFAULT 0,
        FOREIGN KEY (completed_by) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE INDEX idx_uw_requirements_quote_id ON uw_requirements(quote_id);
    CREATE INDEX idx_uw_requirements_quote_type ON uw_requirements(quote_type);
    CREATE INDEX idx_uw_requirements_is_completed ON uw_requirements(is_completed);
    
    PRINT '✓ UW Requirements table created';
END
ELSE
    PRINT '! UW Requirements table already exists';
GO

-- =====================================================
-- 11. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create a generic trigger function for updating updated_at
-- In Azure SQL, we need to create triggers per table

-- Trigger for users table
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_users_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER trg_users_updated_at
    ON users
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE users
        SET updated_at = SYSDATETIMEOFFSET()
        FROM users u
        INNER JOIN inserted i ON u.id = i.id;
    END
    ');
    PRINT '✓ Trigger for users.updated_at created';
END
GO

-- Trigger for btl_quotes table
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_btl_quotes_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER trg_btl_quotes_updated_at
    ON btl_quotes
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE btl_quotes
        SET updated_at = SYSDATETIMEOFFSET()
        FROM btl_quotes bq
        INNER JOIN inserted i ON bq.id = i.id;
    END
    ');
    PRINT '✓ Trigger for btl_quotes.updated_at created';
END
GO

-- Trigger for bridging_quotes table
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_bridging_quotes_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER trg_bridging_quotes_updated_at
    ON bridging_quotes
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE bridging_quotes
        SET updated_at = SYSDATETIMEOFFSET()
        FROM bridging_quotes bq
        INNER JOIN inserted i ON bq.id = i.id;
    END
    ');
    PRINT '✓ Trigger for bridging_quotes.updated_at created';
END
GO

-- Trigger for rates table
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_rates_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER trg_rates_updated_at
    ON rates
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE rates
        SET updated_at = SYSDATETIMEOFFSET()
        FROM rates r
        INNER JOIN inserted i ON r.id = i.id;
    END
    ');
    PRINT '✓ Trigger for rates.updated_at created';
END
GO

-- =====================================================
-- 12. INSERT DEFAULT ADMIN USER
-- =====================================================

-- Password: 'admin123' (hashed with bcrypt)
-- IMPORTANT: Change this password after first login!
IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@polaris.local')
BEGIN
    INSERT INTO users (email, password_hash, name, access_level, is_active)
    VALUES (
        'admin@polaris.local',
        '$2b$10$j5U0WeQ3Re7fiez0IQgG0el.jITKgGkHHeRJNODgY8vIeKEXirn26',
        'Admin User',
        1,
        1
    );
    PRINT '✓ Default admin user created (admin@polaris.local / admin123)';
END
ELSE
    PRINT '! Admin user already exists';
GO

-- =====================================================
-- 13. VERIFICATION QUERIES
-- =====================================================

PRINT '';
PRINT '==============================================';
PRINT 'Migration Complete - Verification Results:';
PRINT '==============================================';

SELECT 'users' AS TableName, COUNT(*) AS RowCount FROM users
UNION ALL
SELECT 'btl_quotes', COUNT(*) FROM btl_quotes
UNION ALL
SELECT 'bridging_quotes', COUNT(*) FROM bridging_quotes
UNION ALL
SELECT 'rates', COUNT(*) FROM rates
UNION ALL
SELECT 'app_constants', COUNT(*) FROM app_constants
UNION ALL
SELECT 'support_requests', COUNT(*) FROM support_requests
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'password_reset_tokens', COUNT(*) FROM password_reset_tokens
UNION ALL
SELECT 'rate_audit_log', COUNT(*) FROM rate_audit_log
UNION ALL
SELECT 'uw_requirements', COUNT(*) FROM uw_requirements;

PRINT '';
PRINT '==============================================';
PRINT 'Next Steps:';
PRINT '1. Review all tables and verify structure';
PRINT '2. Run data export script from Supabase';
PRINT '3. Run data import script to Azure SQL';
PRINT '4. Update backend application configuration';
PRINT '5. Test all application features';
PRINT '==============================================';
GO
