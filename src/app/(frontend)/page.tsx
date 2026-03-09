import React from 'react'

export default async function HomePage() {
  return (
    <div className="landing">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="/" className="logo">
            <span className="logo-mark">C</span>
            <span className="logo-text">Conto</span>
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#invoicing">Invoicing</a>
            <a href="#reporting">Reporting</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="nav-actions">
            <a href="/admin" className="btn-ghost">Sign In</a>
            <a href="/admin" className="btn-primary">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-dot" />
          Project Finance Platform
        </div>
        <h1 className="hero-title">
          <span className="hero-line hero-line-1">Every project.</span>
          <span className="hero-line hero-line-2">
            Every <em>cent</em>.
          </span>
          <span className="hero-line hero-line-3">Accounted for.</span>
        </h1>
        <p className="hero-sub">
          Invoicing, expense tracking, and financial reporting — unified in one
          elegant workspace built for teams that value clarity.
        </p>
        <div className="hero-cta">
          <a href="/admin" className="btn-large">
            Start Free Trial
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <span className="hero-note">No credit card required</span>
        </div>

        {/* Hero Visual — Floating Dashboard Preview */}
        <div className="hero-visual">
          <div className="dash-card dash-main">
            <div className="dash-header">
              <span className="dash-title">Project Overview</span>
              <span className="dash-period">Mar 2026</span>
            </div>
            <div className="dash-amount">$47,250.00</div>
            <div className="dash-label">Total Revenue This Month</div>
            <div className="dash-bar-group">
              <div className="dash-bar-row">
                <span className="dash-bar-label">Invoiced</span>
                <div className="dash-bar"><div className="dash-bar-fill" style={{ width: '85%' }} /></div>
                <span className="dash-bar-val">$40,162</span>
              </div>
              <div className="dash-bar-row">
                <span className="dash-bar-label">Collected</span>
                <div className="dash-bar"><div className="dash-bar-fill collected" style={{ width: '68%' }} /></div>
                <span className="dash-bar-val">$32,130</span>
              </div>
              <div className="dash-bar-row">
                <span className="dash-bar-label">Expenses</span>
                <div className="dash-bar"><div className="dash-bar-fill expenses" style={{ width: '30%' }} /></div>
                <span className="dash-bar-val">$14,175</span>
              </div>
            </div>
          </div>

          <div className="dash-card dash-float-1">
            <div className="dash-mini-header">
              <span className="status-dot status-paid" />
              Invoice #1042
            </div>
            <div className="dash-mini-amount">$3,200.00</div>
            <div className="dash-mini-label">Acme Corp — Paid</div>
          </div>

          <div className="dash-card dash-float-2">
            <div className="dash-mini-header">
              <span className="status-dot status-pending" />
              Invoice #1043
            </div>
            <div className="dash-mini-amount">$8,750.00</div>
            <div className="dash-mini-label">DesignLab — Due in 5 days</div>
          </div>
        </div>
      </section>

      {/* Marquee Strip */}
      <div className="marquee-strip">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div className="marquee-content" key={i}>
              <span>Invoicing</span>
              <span className="marquee-sep" />
              <span>Expense Tracking</span>
              <span className="marquee-sep" />
              <span>Budget Management</span>
              <span className="marquee-sep" />
              <span>Time & Billing</span>
              <span className="marquee-sep" />
              <span>Financial Reports</span>
              <span className="marquee-sep" />
              <span>Multi-Currency</span>
              <span className="marquee-sep" />
              <span>Tax Compliance</span>
              <span className="marquee-sep" />
              <span>Client Portal</span>
              <span className="marquee-sep" />
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-tag">Capabilities</span>
          <h2 className="section-title">
            Built for the way <br />
            <em>you</em> work.
          </h2>
        </div>
        <div className="feature-grid">
          <div className="feature-card feature-large">
            <div className="feature-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="6" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 11h22" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 16h6M7 19h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Smart Invoicing</h3>
            <p>
              Generate polished invoices from project data. Automatic line items,
              tax calculations, and payment tracking — all in real time.
            </p>
            <div className="feature-visual invoice-visual">
              <div className="inv-row inv-header">
                <span>Description</span>
                <span>Hours</span>
                <span>Rate</span>
                <span>Amount</span>
              </div>
              <div className="inv-row">
                <span>UI Design — Phase 2</span>
                <span>24</span>
                <span>$150</span>
                <span>$3,600</span>
              </div>
              <div className="inv-row">
                <span>Frontend Development</span>
                <span>40</span>
                <span>$175</span>
                <span>$7,000</span>
              </div>
              <div className="inv-row">
                <span>QA & Testing</span>
                <span>12</span>
                <span>$125</span>
                <span>$1,500</span>
              </div>
              <div className="inv-row inv-total">
                <span />
                <span />
                <span>Total</span>
                <span>$12,100</span>
              </div>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 8v6l4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Time Tracking</h3>
            <p>
              Log hours per project, task, and team member. Seamlessly convert
              tracked time into invoice line items.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M4 22L10 14L15 18L24 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="24" cy="6" r="2" fill="currentColor" />
              </svg>
            </div>
            <h3>Budget Forecasting</h3>
            <p>
              Set project budgets, track burn rate, and get alerts before
              overruns. See the future before it arrives.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <rect x="15" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h3>Multi-Project Dashboard</h3>
            <p>
              See every project in one view. Compare margins, revenue, and
              cash flow across your entire portfolio.
            </p>
          </div>

          <div className="feature-card feature-large">
            <div className="feature-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 3v22M3 14h22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 7l14 14M21 7L7 21" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
            <h3>Expense Management</h3>
            <p>
              Categorize expenses, attach receipts, approve reimbursements.
              Assign costs to projects for true profitability tracking.
            </p>
            <div className="feature-visual expense-visual">
              <div className="expense-item">
                <div className="expense-cat" style={{ background: 'var(--amber)' }} />
                <div className="expense-info">
                  <span className="expense-name">Software Licenses</span>
                  <span className="expense-amount">$2,340</span>
                </div>
                <div className="expense-bar"><div className="expense-fill" style={{ width: '65%' }} /></div>
              </div>
              <div className="expense-item">
                <div className="expense-cat" style={{ background: 'var(--cream)' }} />
                <div className="expense-info">
                  <span className="expense-name">Contractor Fees</span>
                  <span className="expense-amount">$8,100</span>
                </div>
                <div className="expense-bar"><div className="expense-fill" style={{ width: '90%' }} /></div>
              </div>
              <div className="expense-item">
                <div className="expense-cat" style={{ background: '#7b8794' }} />
                <div className="expense-info">
                  <span className="expense-name">Travel & Meals</span>
                  <span className="expense-amount">$960</span>
                </div>
                <div className="expense-bar"><div className="expense-fill" style={{ width: '25%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting Section */}
      <section className="reporting" id="reporting">
        <div className="reporting-inner">
          <div className="reporting-text">
            <span className="section-tag">Reporting</span>
            <h2 className="section-title">
              Numbers that <br />tell <em>stories</em>.
            </h2>
            <p className="reporting-desc">
              Profit & loss by project, client, or time period. Cash flow
              projections. Aging receivables. Tax-ready summaries.
              Every report you need, beautifully rendered.
            </p>
            <ul className="reporting-list">
              <li>
                <span className="check-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Revenue & expense breakdowns
              </li>
              <li>
                <span className="check-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Aging receivables & payables
              </li>
              <li>
                <span className="check-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Project profitability analysis
              </li>
              <li>
                <span className="check-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Export to PDF, CSV, or Excel
              </li>
            </ul>
          </div>

          <div className="reporting-visual">
            <div className="report-card">
              <div className="report-header">
                <span className="report-title">Monthly Revenue</span>
                <span className="report-trend">+12.4%</span>
              </div>
              <div className="chart-bars">
                {[42, 58, 35, 72, 65, 80, 55, 90, 78, 95, 82, 88].map((h, i) => (
                  <div
                    key={i}
                    className="chart-bar"
                    style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                  />
                ))}
              </div>
              <div className="chart-labels">
                <span>Jan</span>
                <span>Mar</span>
                <span>Jun</span>
                <span>Sep</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing" id="pricing">
        <div className="section-header">
          <span className="section-tag">Pricing</span>
          <h2 className="section-title">
            Simple, <em>transparent</em> <br />pricing.
          </h2>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-tier">Starter</div>
            <div className="price-amount">
              <span className="price-currency">$</span>
              <span className="price-value">0</span>
              <span className="price-period">/mo</span>
            </div>
            <p className="price-desc">Perfect for freelancers and solo consultants.</p>
            <ul className="price-features">
              <li>3 active projects</li>
              <li>50 invoices / month</li>
              <li>Basic expense tracking</li>
              <li>Standard reports</li>
            </ul>
            <a href="/admin" className="btn-outline">Get Started</a>
          </div>

          <div className="price-card price-featured">
            <div className="price-badge">Most Popular</div>
            <div className="price-tier">Professional</div>
            <div className="price-amount">
              <span className="price-currency">$</span>
              <span className="price-value">29</span>
              <span className="price-period">/mo</span>
            </div>
            <p className="price-desc">For growing teams managing multiple clients.</p>
            <ul className="price-features">
              <li>Unlimited projects</li>
              <li>Unlimited invoices</li>
              <li>Advanced expense management</li>
              <li>Custom report builder</li>
              <li>Multi-currency support</li>
              <li>Client portal</li>
            </ul>
            <a href="/admin" className="btn-large">Start Free Trial</a>
          </div>

          <div className="price-card">
            <div className="price-tier">Enterprise</div>
            <div className="price-amount">
              <span className="price-currency">$</span>
              <span className="price-value">99</span>
              <span className="price-period">/mo</span>
            </div>
            <p className="price-desc">Full control for agencies and large teams.</p>
            <ul className="price-features">
              <li>Everything in Professional</li>
              <li>SSO & advanced permissions</li>
              <li>API access</li>
              <li>Dedicated account manager</li>
              <li>Custom integrations</li>
            </ul>
            <a href="/admin" className="btn-outline">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">
            Ready to take control <br />of your project finances?
          </h2>
          <p className="cta-sub">
            Join teams who trust Conto to manage invoicing, track expenses,
            and deliver financial clarity.
          </p>
          <a href="/admin" className="btn-large btn-light">
            Get Started — It&apos;s Free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <a href="/" className="logo">
              <span className="logo-mark">C</span>
              <span className="logo-text">Conto</span>
            </a>
            <p className="footer-tagline">
              Elegant project finance <br />management for modern teams.
            </p>
          </div>
          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#invoicing">Invoicing</a>
              <a href="#reporting">Reports</a>
              <a href="#pricing">Pricing</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Conto. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
