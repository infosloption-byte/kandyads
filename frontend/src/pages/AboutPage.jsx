import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, Factory, Zap, MapPin, Palette, Truck, Layers3, Handshake, CheckCircle2 } from 'lucide-react';
import { services, reasons } from '../site-data';
import { Site, SectionHero, Reveal, SectionTag, PrimaryCTA } from '../site-shell';
import '../styles/about-process.css';

const capabilityIcons = [Palette, Truck, MapPin, Factory, Layers3, Zap];
const values = [
  {icon:ShieldCheck,title:'Quality-minded execution',text:'We consider suitable materials, finishing and longevity, not simply what looks good in a mockup.'},
  {icon:Factory,title:'Design meets production',text:'Creative decisions are informed by how a sign, display or installation is actually made.'},
  {icon:Handshake,title:'An accountable working relationship',text:'Communication, coordination and a practical handover stay part of the process.'},
];

export default function AboutPage() {
  return <Site>
    <SectionHero kicker="ABOUT KANDY ADS" title="Creative ideas. Real-world execution." text="We are a Kandy-based advertising and brand-visibility partner helping businesses translate their identity into signage, spaces, print and experiences people remember."/>
    <section className="container about-introduction">
      <Reveal><div><SectionTag>WHO WE ARE</SectionTag><h2>Local understanding.<br/><span>Practical creative thinking.</span></h2></div></Reveal>
      <div className="about-introduction-copy"><p>Kandy Ads works where design meets the physical world. Our focus is helping businesses become more visible and recognisable through the things customers actually encounter: storefronts, buildings, vehicles, campaigns and displays.</p><p>From an individual signboard to coordinated brand touchpoints, our approach brings the brief, design direction, production considerations and on-site delivery together.</p><p>Based in the Kandy area, we work with businesses that value a clear process, strong visual presentation and attention to the practical details behind every installation.</p></div>
    </section>
    <section className="about-story" aria-labelledby="about-story-title"><div className="container about-story-grid">
      <div><SectionTag light>OUR STORY</SectionTag><h2 id="about-story-title">Built around the craft of making brands visible.</h2></div>
      <div><p>Our story is reflected in the breadth of work we take on: signage and signboards, commercial branding, vehicle graphics, outdoor advertising, printing and event displays.</p><p>As business requirements expand from a single location to larger campaigns, the need remains the same: thoughtful design backed by practical production and dependable coordination.</p><p className="about-story-note">For a dated company-history timeline, confirmed founding milestones and archive photographs can be added without guessing at dates or achievements.</p></div>
    </div></section>
    <section className="container about-capabilities" aria-labelledby="about-capabilities-title">
      <div className="about-section-heading"><div><SectionTag>WHAT WE CAN DO</SectionTag><h2 id="about-capabilities-title">One partner. Six connected capabilities.</h2></div><p>We work across the environments where your brand needs to be seen—from the street to the storefront, the vehicle to the exhibition floor.</p></div>
      <div className="about-capability-grid">{services.map((service,i)=>{
        const Icon=capabilityIcons[i];
        return <Reveal key={service.slug} delay={Math.min(i*.04,.12)}><Link to={'/services/'+service.slug} className="about-capability-card"><div className="about-capability-card-top"><span>0{i+1}</span><Icon size={23} strokeWidth={1.6} aria-hidden="true"/></div><h3>{service.title}</h3><p>{service.desc}</p><span className="about-capability-more">Explore this service <ArrowUpRight size={16}/></span></Link></Reveal>;
      })}</div>
    </section>
    <section className="about-statement"><div className="container"><div className="statement-number">OUR APPROACH / 01</div><h2>Advertising should not only look good in a presentation. <span>It should work in the physical world.</span></h2></div></section>
    <section className="container about-result-feature" aria-labelledby="about-result-title">
      <Reveal><figure className="about-result-visual"><img src="/about/about-result.webp" alt="Illustrative concept of a professionally branded retail space with coordinated storefront signage" loading="lazy" decoding="async"/><figcaption>Concept visualisation — an example of a coordinated brand environment, not a photographed client project.</figcaption></figure></Reveal>
      <div className="about-result-content"><SectionTag>THE RESULT</SectionTag><h2 id="about-result-title">A stronger presence, wherever people see your business.</h2><p>The final impression is the sum of many choices: clear signage, effective scale, considered materials, consistent graphics and confident installation.</p><p>Our work is about turning those details into physical touchpoints that feel purposeful, consistent and ready for everyday use.</p><Link to="/projects" className="text-link">Explore actual Kandy Ads projects <ArrowUpRight size={17}/></Link></div>
    </section>
    <section className="container about-strengths" aria-labelledby="about-strengths-title">
      <div className="about-section-heading"><div><SectionTag>OUR STRENGTHS</SectionTag><h2 id="about-strengths-title">How we bring value to a project.</h2></div><p>We focus on the quality of the collaboration as much as the quality of the finished work.</p></div>
      <div className="about-strength-grid">{values.map((v,i)=>{const Icon=v.icon;return <Reveal key={v.title} delay={i*.05}><article><Icon size={26} strokeWidth={1.7} aria-hidden="true"/><span>0{i+1}</span><h3>{v.title}</h3><p>{v.text}</p></article></Reveal>})}</div>
    </section>
    <section className="container about-principles"><div><SectionTag>WHAT GUIDES US</SectionTag><h2>Clear thinking.<br/>Careful making.<br/><span>Visible results.</span></h2></div><div><p>We believe visibility solutions should suit the location, the audience and the operational reality of the business—not just the artwork on the screen.</p><ul>{reasons.slice(0,4).map(([title,detail])=><li key={title}><CheckCircle2 size={18} aria-hidden="true"/><div><strong>{title}</strong><span>{detail}</span></div></li>)}</ul></div></section>
    <section className="final-cta-wrap"><div className="container"><section className="lead-cta"><div><SectionTag light>START WITH A CONVERSATION</SectionTag><h2>Let's make your brand easier to notice.</h2><p>Tell us about your business, your location and what you want to achieve. We'll help define a practical next step.</p></div><PrimaryCTA>Get a Quote</PrimaryCTA></section></div></section>
  </Site>;
}
