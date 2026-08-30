import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, ArrowUpRight, Check, Info, Menu, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { CONTACT_DETAILS } from '../data/contact-details';
import '../styles/quote-page.css';
import '../styles/quote-site-shell.css';

const LOGO = '/brand/kandy-ads-logo.svg';

const SERVICES = {
  signage: { label: 'Signage & Signboards', unit: 'sqft', rate: 3200, min: 12000 },
  vehicle: { label: 'Vehicle Branding', unit: 'sqft', rate: 2400, min: 18000 },
  outdoor: { label: 'Outdoor Advertising', unit: 'sqft', rate: 1700, min: 15000 },
  printing: { label: 'Digital Printing & Displays', unit: 'sqft', rate: 1250, min: 5000 },
  retail: { label: 'Retail & Commercial Branding', unit: 'sqft', rate: 2300, min: 12000 },
  events: { label: 'Exhibitions & Promotional', unit: 'unit', rate: 28000, min: 18000 },
};

const OPTIONS = {
  signage: [['led', 'LED / Lightbox Signboard', 1.18], ['acrylic', 'Acrylic / 3D Letter Sign', 1], ['stainless', 'Stainless Steel Sign', 1.35], ['neon', 'Neon Sign', 1.32], ['pylon', 'Pylon / Road Sign', 1.48]],
  vehicle: [['partial', 'Partial Branding', 0.72], ['full', 'Full Vehicle Branding', 1], ['premium', 'Premium Full Wrap', 1.28]],
  outdoor: [['flex', 'Flex Hoarding', 1], ['backlit', 'Backlit Outdoor Display', 1.22], ['road', 'Road / Direction Signage', 1.12]],
  printing: [['sunboard', 'Sunboard / PVC Display', 1], ['sticker', 'Stickers / Vinyl', 0.9], ['glass', 'Glass / One-way Vision', 1.1]],
  retail: [['shopfront', 'Shopfront Branding', 1], ['cladding', 'Cladding / Facade Branding', 1.28], ['wayfinding', 'Wayfinding / Indoor Branding', 0.92]],
  events: [['stall', 'Exhibition Stall', 1], ['stand', 'X Stand / Display', 0.42], ['promo', 'Promotional Display Package', 0.68]],
};

const FINISHES = [['standard', 'Standard finish', 1], ['premium', 'Premium finish', 1.12], ['illuminated', 'Premium + illumination', 1.25]];
const INSTALLATION = [['none', 'Client installation / pickup', 0], ['local', 'Kandy-area installation', 4500], ['site', 'Site survey + installation', 8500]];

function money(value) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(value);
}

function QuotePage() {
  const [service, setService] = useState('signage');
  const [type, setType] = useState('led');
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(4);
  const [quantity, setQuantity] = useState(1);
  const [finish, setFinish] = useState('standard');
  const [install, setInstall] = useState('local');
  const [complexity, setComplexity] = useState('standard');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const current = SERVICES[service];
  const options = OPTIONS[service];
  const selectedType = options.find((item) => item[0] === type) || options[0];

  const estimate = useMemo(() => {
    const dimensions = current.unit === 'unit' ? 1 : Math.max(1, width * height);
    const complexityFactor = complexity === 'simple' ? 0.9 : complexity === 'complex' ? 1.18 : 1;
    const material = Math.max(current.min, current.rate * dimensions * selectedType[2] * complexityFactor * quantity);
    const finishFactor = FINISHES.find((item) => item[0] === finish)?.[2] || 1;
    const finishCost = material * (finishFactor - 1);
    const installCost = INSTALLATION.find((item) => item[0] === install)?.[2] || 0;
    const subtotal = material + finishCost + installCost;
    const contingency = subtotal * 0.08;
    return { dimensions, material, finishCost, installCost, contingency, total: subtotal + contingency };
  }, [current, selectedType, complexity, finish, install, width, height, quantity]);

  const selectService = (value) => {
    setService(value);
    setType(OPTIONS[value][0][0]);
  };

  const reset = () => {
    setService('signage');
    setType('led');
    setWidth(10);
    setHeight(4);
    setQuantity(1);
    setFinish('standard');
    setInstall('local');
    setComplexity('standard');
    setName('');
    setCompany('');
    setPhone('');
    setEmail('');
    setNotes('');
    setSent(false);
  };

  const submit = (event) => {
    event.preventDefault();
    setSent(true);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="quote-page">
      <header className="quote-nav">
        <div className="quote-nav-inner">
          <a className="quote-brand" href="/" aria-label="Kandy Ads home" onClick={closeMenu}>
            <img src={LOGO} alt="Kandy Ads" />
            <strong>KANDY<span>ADS</span></strong>
          </a>
          <nav className={menuOpen ? 'quote-main-nav open' : 'quote-main-nav'} aria-label="Primary navigation">
            <a href="/about" onClick={closeMenu}>About</a>
            <a href="/services" onClick={closeMenu}>Services</a>
            <a href="/projects" onClick={closeMenu}>Projects</a>
            <a href="/industries" onClick={closeMenu}>Industries</a>
            <a href="/process" onClick={closeMenu}>Process</a>
            <a href="/contact" onClick={closeMenu}>Contact</a>
            <a href="/quote" className="quote-nav-cta" onClick={closeMenu}>Get a Quote <ArrowUpRight size={16} /></a>
          </nav>
          <button className="quote-menu" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="quote-hero">
          <div className="quote-container">
            <div className="quote-eyebrow"><span /> QUICK ESTIMATE</div>
            <h1>Plan your project.<br /><em>Know the range.</em></h1>
            <p>Give us a few details and get an indicative budget range before you request the final quotation.</p>
            <div className="quote-hero-meta"><span>01</span><b>SELECT</b><i /><b>SIZE</b><i /><b>FINISH</b><i /><b>INSTALL</b><i /><b>ESTIMATE</b></div>
          </div>
        </section>

        <section className="quote-workspace">
          <div className="quote-container quote-grid">
            <form className="quote-form-card" onSubmit={submit}>
              <div className="quote-section-head"><span>01</span><div><small>PROJECT TYPE</small><h2>What are you looking to produce?</h2></div></div>
              <div className="service-picker">
                {Object.entries(SERVICES).map(([key, value]) => (
                  <button type="button" className={service === key ? 'selected' : ''} onClick={() => selectService(key)} key={key}>{value.label}</button>
                ))}
              </div>

              <div className="quote-fields two">
                <label>Product / format<select value={type} onChange={(event) => setType(event.target.value)}>{options.map((item) => <option value={item[0]} key={item[0]}>{item[1]}</option>)}</select></label>
                <label>Finish<select value={finish} onChange={(event) => setFinish(event.target.value)}>{FINISHES.map((item) => <option value={item[0]} key={item[0]}>{item[1]}</option>)}</select></label>
              </div>

              <div className="quote-section-head compact"><span>02</span><div><small>SIZE &amp; QUANTITY</small><h2>How much do you need?</h2></div></div>
              {current.unit === 'sqft' ? (
                <div className="dimension-grid">
                  <label>Width<div className="input-suffix"><input type="number" min="1" value={width} onChange={(event) => setWidth(Math.max(1, Number(event.target.value) || 1))} /><span>ft</span></div></label>
                  <label>Height<div className="input-suffix"><input type="number" min="1" value={height} onChange={(event) => setHeight(Math.max(1, Number(event.target.value) || 1))} /><span>ft</span></div></label>
                  <label>Quantity<div className="stepper"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(quantity + 1)}><Plus size={16} /></button></div></label>
                </div>
              ) : (
                <div className="dimension-grid unit-only">
                  <label>Quantity<div className="stepper"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={16} /></button><strong>{quantity}</strong><button type="button" onClick={() => setQuantity(quantity + 1)}><Plus size={16} /></button></div></label>
                  <div className="unit-note">This service is estimated per display / package rather than by square footage.</div>
                </div>
              )}

              <div className="quote-section-head compact"><span>03</span><div><small>PROJECT CONDITIONS</small><h2>Tell us how the job will be handled.</h2></div></div>
              <div className="quote-fields two">
                <label>Project complexity<select value={complexity} onChange={(event) => setComplexity(event.target.value)}><option value="simple">Straightforward</option><option value="standard">Standard</option><option value="complex">Complex / custom</option></select></label>
                <label>Installation<select value={install} onChange={(event) => setInstall(event.target.value)}>{INSTALLATION.map((item) => <option value={item[0]} key={item[0]}>{item[1]}{item[2] ? ` — ${money(item[2])}` : ''}</option>)}</select></label>
              </div>

              <div className="quote-divider" />
              <div className="quote-section-head compact"><span>04</span><div><small>CONTACT DETAILS</small><h2>Where should we send the estimate?</h2></div></div>
              <div className="quote-fields two">
                <label>Your name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /></label>
                <label>Company<input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" /></label>
                <label>Phone / WhatsApp<input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="07X XXX XXXX" /></label>
                <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
              </div>
              <label className="notes-label">Project notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="4" placeholder="Location, preferred materials, deadline, reference details..." /></label>

              <button className="quote-submit" type="submit">Request this estimate <ArrowUpRight size={18} /></button>
              {sent && <div className="sent-note"><Check size={18} /> Your estimate details are captured. Connect this form to your email/CRM endpoint for production submissions.</div>}
            </form>

            <aside className="estimate-panel">
              <div className="estimate-stick">
                <div className="estimate-tag"><span /> YOUR INDICATIVE ESTIMATE</div>
                <div className="estimate-price">{money(estimate.total)}</div>
                <p className="estimate-range">Planning range for the configuration above</p>
                <div className="estimate-summary">
                  <div><span>Service</span><strong>{current.label}</strong></div>
                  <div><span>Format</span><strong>{selectedType[1]}</strong></div>
                  <div><span>Size</span><strong>{current.unit === 'unit' ? 'Per unit / package' : `${estimate.dimensions} sq ft × ${quantity}`}</strong></div>
                  <div><span>Finish</span><strong>{FINISHES.find((item) => item[0] === finish)?.[1]}</strong></div>
                  <div><span>Installation</span><strong>{INSTALLATION.find((item) => item[0] === install)?.[1]}</strong></div>
                </div>
                <div className="estimate-breakdown">
                  <div><span>Production / materials</span><b>{money(estimate.material)}</b></div>
                  <div><span>Finish / upgrades</span><b>{money(estimate.finishCost)}</b></div>
                  <div><span>Installation</span><b>{money(estimate.installCost)}</b></div>
                  <div><span>Planning allowance</span><b>{money(estimate.contingency)}</b></div>
                </div>
                <div className="estimate-note"><Info size={17} /><p><strong>Important:</strong> this is a planning estimate, not a final quotation. Material choice, site conditions, artwork, dimensions, access and installation requirements can change the final price.</p></div>
                <button className="reset-btn" type="button" onClick={reset}><RotateCcw size={15} /> Reset calculator</button>
              </div>
            </aside>
          </div>
        </section>

        <section className="quote-next">
          <div className="quote-container next-grid">
            <div><div className="quote-eyebrow"><span /> WHAT HAPPENS NEXT</div><h2>Use this number to start the conversation.</h2></div>
            <div className="next-copy"><p>The calculator is designed to give prospects a useful first number while keeping the final quote with the Kandy Ads team. Once the project is reviewed, you can confirm exact material, artwork, site and installation costs.</p><a className="next-cta" href="/contact">Talk to Kandy Ads <ArrowUpRight size={17} /></a></div>
          </div>
        </section>
      </main>

      <footer className="quote-footer">
        <div className="quote-footer-main quote-container">
          <div className="quote-footer-brand">
            <a className="quote-brand" href="/" aria-label="Kandy Ads home"><img src={LOGO} alt="Kandy Ads" /><strong>KANDY<span>ADS</span></strong></a>
            <p>Creative advertising, signage and brand visibility solutions from Kandy, Sri Lanka.</p>
          </div>
          <div className="quote-footer-col"><b>EXPLORE</b><a href="/about">About</a><a href="/services">Services</a><a href="/projects">Projects</a><a href="/industries">Industries</a><a href="/process">Process</a><a href="/contact">Contact</a></div>
          <div className="quote-footer-col"><b>CAPABILITIES</b><a href="/services/signage">Signage &amp; Signboards</a><a href="/services/vehicle-branding">Vehicle Branding</a><a href="/services/outdoor-advertising">Outdoor Advertising</a><a href="/services/printing">Digital Printing &amp; Displays</a><a href="/services/retail-branding">Retail &amp; Commercial Branding</a><a href="/services/events">Exhibitions &amp; Promotional</a></div>
          <div className="quote-footer-col"><b>START A PROJECT</b><span>{CONTACT_DETAILS.addresses[0]}<br />{CONTACT_DETAILS.addresses[1]}</span><a href={CONTACT_DETAILS.phoneHrefs[0]}>{CONTACT_DETAILS.phones[0]}</a><a href={CONTACT_DETAILS.phoneHrefs[1]}>{CONTACT_DETAILS.phones[1]}</a><a href={`mailto:${CONTACT_DETAILS.emails[0]}`}>{CONTACT_DETAILS.emails[0]}</a><a href={`mailto:${CONTACT_DETAILS.emails[1]}`}>{CONTACT_DETAILS.emails[1]}</a><a href={CONTACT_DETAILS.whatsappHref}>WhatsApp <ArrowUpRight size={14} /></a></div>
        </div>
        <div className="quote-footer-bottom quote-container"><span>© {new Date().getFullYear()} Kandy Ads. All rights reserved.</span><span>Advertising • Branding • Production • Installation</span></div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<QuotePage />);
