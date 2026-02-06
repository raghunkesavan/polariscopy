import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const CalculatorLandingPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLastEcho = async () => {
      try {
        //const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const baseUrl = 'https://polariscopy.onrender.com';
        const response = await fetch(`${baseUrl}/api/salesforce/echo/last`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        const payload = data?.payload || {};
        const quoteTypeRaw =
          payload.quoteType ||
          payload.quote_type ||
          payload.calculator_type ||
          payload.calculatorType ||
          '';
        const quoteType = quoteTypeRaw.toString().toLowerCase();

        if (!isMounted || !quoteType) return;

        if (quoteType.includes('btl') || quoteType.includes('buy-to-let') || quoteType.includes('buy to let')) {
          navigate('/calculator/btl', { replace: true });
          return;
        }

        if (quoteType.includes('bridge') || quoteType.includes('bridging') || quoteType.includes('fusion')) {
          navigate('/calculator/bridging', { replace: true });
        }
      } catch (err) {
        // Ignore auto-redirect errors and allow manual selection
      } finally {
        // no-op
      }
    };

    fetchLastEcho();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [navigate]);
  const calculatorFeatures = [
    { icon: 'clock', title: 'Instant Results', desc: 'Get quotes in seconds' },
    { icon: 'shield', title: 'Accurate Rates', desc: 'Real-time pricing' },
    { icon: 'graph', title: 'Detailed Breakdown', desc: 'Full cost analysis' },
    { icon: 'file', title: 'Save & Export', desc: 'PDF generation' }
  ];

  const howItWorks = [
    { step: '1', title: 'Enter Details', desc: 'Property value, loan amount, and purpose', icon: 'edit' },
    { step: '2', title: 'View Options', desc: 'Compare rates across multiple products', icon: 'table' },
    { step: '3', title: 'Generate Quote', desc: 'Create professional PDF quotes instantly', icon: 'file' }
  ];

  return (
    <div className="slds-p-around_none" style={{ backgroundColor: 'var(--token-ui-background-neutral)', minHeight: '100vh' }}>
      {/* Premium Hero Section */}
      <div 
        className="slds-p-around_none" 
        style={{ 
          background: 'linear-gradient(135deg, var(--token-color-brand-navy) 0%, #003d8f 50%, var(--token-color-brand-orange) 100%)',
          position: 'relative',
          overflow: 'hidden',
          padding: '5rem 2rem'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '400px',
          height: '400px',
          background: 'rgba(232, 78, 15, 0.15)',
          borderRadius: '50%',
          filter: 'blur(80px)'
        }} />
        
        <div className="slds-p-vertical_xx-large slds-p-horizontal_large slds-text-align_center" style={{ position: 'relative', zIndex: 1, paddingBottom: '4rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ 
              display: 'inline-block', 
              background: 'rgba(232, 78, 15, 0.15)', 
              padding: '8px 20px', 
              borderRadius: '30px',
              marginBottom: '2rem',
              border: '1px solid rgba(232, 78, 15, 0.3)'
            }}>
              <span style={{ color: 'var(--token-color-brand-orange)', fontSize: 'var(--token-font-size-sm)', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>🚀 SMART CALCULATORS</span>
            </div>
            
            <h1 
              className="slds-text-heading_large slds-m-bottom_medium" 
              style={{ 
                fontSize: '3rem', 
                fontWeight: '700',
                color: 'white',
                lineHeight: '1.2',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem',
                letterSpacing: '-0.02em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              Property Finance Calculators
            </h1>
            <p 
              className="slds-text-heading_medium slds-m-bottom_large" 
              style={{ 
                fontSize: '1.125rem',
                fontWeight: '400',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: '1.7',
                maxWidth: '700px',
                margin: '0 auto 3rem',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              Bespoke bridging loans and buy-to-let mortgages for complex circumstances.
              Get instant, accurate quotes with our advanced calculators.
            </p>
            
            {/* Feature Pills */}
            <div className="slds-grid slds-gutters_medium slds-wrap slds-grid_align-center" style={{ maxWidth: '800px', margin: '0 auto' }}>
              {calculatorFeatures.map((feature, i) => (
                <div key={i} className="slds-col" style={{ padding: '0.5rem', minWidth: '140px' }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    justifyContent: 'center'
                  }}>
                    <svg className="slds-icon slds-icon_xx-small" aria-hidden="true" style={{ fill: 'var(--token-color-brand-orange)', flexShrink: 0 }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${feature.icon}`}></use>
                    </svg>
                    <span style={{ color: 'white', fontSize: 'var(--token-font-size-sm)', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', whiteSpace: 'nowrap' }}>{feature.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="slds-p-horizontal_large" style={{ maxWidth: '1400px', margin: '-60px auto 0', position: 'relative', zIndex: 10, padding: '0 2rem' }}>
        <div className="slds-grid slds-gutters_large slds-wrap justify-content-center" style={{ marginBottom: '5rem' }}>
          {/* BTL Calculator Card */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2" style={{ marginBottom: '2rem', padding: '0 1rem' }}>
            <Link to="/calculator/btl" className="slds-text-link_reset display-block height-100">
              <article 
                className="slds-card height-100 transition-all"
                style={{ 
                  border: 'none', 
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'white',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 50px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', height: '6px' }} />
                
                <div className="slds-p-around_large" style={{ padding: '2.5rem 2rem' }}>
                  <div className="slds-media" style={{ marginBottom: '1.5rem' }}>
                    <div className="slds-media__figure">
                      <span 
                        className="slds-icon_container" 
                        style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', width: '48px', height: '48px' }}
                      >
                        🏠
                      </span>
                    </div>
                    <div className="slds-media__body slds-grid slds-grid_vertical-align-center">
                      <h2 className="slds-text-heading_medium" style={{ color: 'var(--token-color-brand-navy)', fontWeight: '600', fontSize: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                        Buy-to-Let Calculator
                      </h2>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.9375rem', color: 'var(--token-text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    Flexible buy-to-let mortgages designed to support both new and experienced landlords.
                    Ideal for complex circumstances including foreign nationals, expats, and offshore companies.
                  </p>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <ul className="slds-list_vertical slds-has-block-links_space">
                      {['Loan amounts from £150k to £3m per property', 'Up to 75% LTV', 'Deferred interest options', 'Bespoke underwriting'].map((item, i) => (
                        <li key={i} className="slds-item display-flex align-items-center" style={{ marginBottom: '0.75rem' }}>
                          <svg className="slds-icon slds-icon_x-small" style={{ fill: 'var(--token-success)', flexShrink: 0, marginRight: '0.75rem' }} aria-hidden="true">
                            <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#check"></use>
                          </svg>
                          <span style={{ color: 'var(--token-text-primary)', fontSize: 'var(--token-font-size-sm)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div style={{ padding: '0 2rem 2rem', marginTop: 'auto' }}>
                  <Link 
                    to="/calculator/btl"
                    className="slds-button slds-button_brand" 
                    style={{ 
                      background: 'linear-gradient(135deg, var(--token-color-brand-navy) 0%, #003d8f 100%)', 
                      borderColor: 'var(--token-color-brand-navy)',
                      height: '48px',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(0, 32, 91, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      width: '100%',
                      textDecoration: 'none'
                    }}
                  >
                    Launch Calculator →
                  </Link>
                </div>
              </article>
            </Link>
          </div>

          {/* Bridging Calculator Card */}
          <div className="slds-col slds-size_1-of-1 slds-medium-size_1-of-2" style={{ marginBottom: '2rem', padding: '0 1rem' }}>
            <Link to="/calculator/bridging" className="slds-text-link_reset display-block height-100">
              <article 
                className="slds-card height-100 transition-all"
                style={{ 
                  border: 'none', 
                  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'white',
                  transform: 'translateY(0)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', height: '6px' }} />
                
                <div style={{ padding: '2.5rem 2rem', flex: '1', display: 'flex', flexDirection: 'column' }}>
                  <div className="slds-media" style={{ marginBottom: '1.5rem' }}>
                    <div className="slds-media__figure">
                      <span 
                        className="slds-icon_container" 
                        style={{ background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', width: '48px', height: '48px' }}
                      >
                        ⚡
                      </span>
                    </div>
                    <div className="slds-media__body slds-grid slds-grid_vertical-align-center">
                      <h2 className="slds-text-heading_medium" style={{ color: 'var(--token-color-brand-navy)', fontWeight: '600', fontSize: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                        Bridging Calculator
                      </h2>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: '0.9375rem', color: 'var(--token-text-secondary)', lineHeight: '1.7', marginBottom: '1.5rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    Fast, flexible bridging finance for residential and commercial properties.
                    We can issue funds in as little as 3 days to help you seize opportunities.
                  </p>
                  
                  <div style={{ marginBottom: '2rem' }}>
                    <ul className="slds-list_vertical slds-has-block-links_space">
                      {['Loans from £100k to £50m', 'Up to 75% LTV', 'Residential & Commercial', 'Auction & Refurbishment'].map((item, i) => (
                        <li key={i} className="slds-item display-flex align-items-center" style={{ marginBottom: '0.75rem' }}>
                          <svg className="slds-icon slds-icon_x-small" style={{ fill: 'var(--token-success)', flexShrink: 0, marginRight: '0.75rem' }} aria-hidden="true">
                            <use xlinkHref="/assets/icons/utility-sprite/svg/symbols.svg#check"></use>
                          </svg>
                          <span style={{ color: 'var(--token-text-primary)', fontSize: 'var(--token-font-size-sm)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div style={{ padding: '0 2rem 2rem', marginTop: 'auto' }}>
                  <Link 
                    to="/calculator/bridging"
                    className="slds-button slds-button_brand" 
                    style={{ 
                      background: 'linear-gradient(135deg, var(--token-color-brand-orange) 0%, #d13a00 100%)', 
                      borderColor: 'var(--token-color-brand-orange)',
                      height: '48px',
                      fontSize: '0.9375rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 12px rgba(232, 78, 15, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                      width: '100%',
                      textDecoration: 'none'
                    }}
                  >
                    Launch Calculator →
                  </Link>
                </div>
              </article>
            </Link>
          </div>
        </div>

        {/* How It Works Section */}
        <div style={{ marginTop: '5rem' }}>
          <div className="slds-text-align_center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2rem', color: 'var(--token-color-brand-navy)', fontWeight: '600', marginBottom: '1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
              How It Works
            </h2>
            <p style={{ fontSize: '1.0625rem', color: 'var(--token-text-secondary)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              Simple, fast, accurate — get professional quotes in 3 easy steps
            </p>
          </div>
          
          <div className="slds-grid slds-gutters_large slds-wrap" style={{ marginBottom: '4rem' }}>
            {howItWorks.map((step, idx) => (
              <div key={idx} className="slds-col slds-size_1-of-1 slds-medium-size_1-of-3" style={{ position: 'relative', padding: '0 1rem' }}>
                <div className="slds-text-align_center" style={{ padding: '2rem 1.5rem' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto 1.5rem',
                    background: 'linear-gradient(135deg, var(--token-color-brand-navy) 0%, var(--token-color-brand-orange) 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 25px rgba(0,32,91,0.2)',
                    position: 'relative'
                  }}>
                    <svg className="slds-icon slds-icon_medium" aria-hidden="true" style={{ fill: 'white' }}>
                      <use xlinkHref={`/assets/icons/utility-sprite/svg/symbols.svg#${step.icon}`}></use>
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'var(--token-color-brand-orange)',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--token-font-size-sm)',
                      fontWeight: '700',
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(232,78,15,0.3)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                    }}>{step.step}</div>
                  </div>
                  <h3 style={{ fontSize: 'var(--token-font-size-lg)', color: 'var(--token-color-brand-navy)', fontWeight: '600', marginBottom: '0.75rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--token-text-secondary)', lineHeight: '1.7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div 
          className="slds-text-align_center"
          style={{
            marginTop: '5rem',
            marginBottom: '5rem',
            padding: '4rem 2rem',
            background: 'linear-gradient(135deg, var(--token-color-brand-navy) 0%, #003d8f 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0,32,91,0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'rgba(232, 78, 15, 0.2)',
            borderRadius: '50%',
            filter: 'blur(60px)'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '2rem', color: 'white', fontWeight: '600', marginBottom: '1rem', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
              Need Expert Advice?
            </h2>
            <p style={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.9)', marginBottom: '2rem', maxWidth: '650px', margin: '0 auto 2.5rem', lineHeight: '1.7', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
              Our dedicated underwriters are available to discuss complex cases and provide bespoke solutions tailored to your circumstances.
            </p>
            <div className="slds-grid slds-gutters_medium slds-wrap slds-grid_align-center">
              <div className="slds-col">
                <a 
                  href="mailto:info@mfsuk.com" 
                  className="slds-button slds-button_neutral"
                  style={{
                    background: 'white',
                    color: 'var(--token-color-brand-navy)',
                    fontWeight: '600',
                    padding: '14px 32px',
                    fontSize: '0.9375rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: 'none',
                    display: 'inline-block',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  📧 info@mfsuk.com
                </a>
              </div>
              <div className="slds-col">
                <a 
                  href="tel:+442070601234" 
                  className="slds-button"
                  style={{
                    background: 'var(--token-color-brand-orange)',
                    color: 'white',
                    fontWeight: '600',
                    padding: '14px 32px',
                    fontSize: '0.9375rem',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(232,78,15,0.4)',
                    display: 'inline-block',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                  }}
                >
                  📞 +44 (0)20 7060 1234
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculatorLandingPage;

