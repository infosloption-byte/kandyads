import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, Factory, Zap, Ruler, PenTool, MapPin, Wrench, CheckCircle2, Users, MessageCircle } from 'lucide-react';
import { services } from '../site-data';
import { Site, Reveal, SectionTag, PrimaryCTA } from '../site-shell';
import resultImage from '../assets/about/kandyads-result-concept.svg';
import '../styles/about-redesign.css';

const strengths=[
  {icon:PenTool,title:'Creative that can be built',body:'We shape ideas around materials, visibility and the real conditions where a brand appears.'},
  {icon:Factory,title:'Connected production',body:'Design, printing, fabrication and finishing decisions stay connected to the approved outcome.'},
  {icon:Ruler,title:'Site-first thinking',body:'Scale, legibility, placement, lighting and access matter as much as the artwork itself.'},
  {icon:ShieldCheck,title:'Attention to the finish',body:'Durable materials, careful assembly and practical checks support confident handover.'},
  {icon:MessageCircle,title:'Clear collaboration',body:'A practical conversation from the first brief through changes, approvals and installation.'},
  {icon:Wrench,title:'End-to-end capability',body:'From one sign to a wider rollout, we work across multiple physical brand touchpoints.'}
];

export default function AboutPage(){
 return <Site>
  <section className="container about-hero-refresh">
    <SectionTag>ABOUT KANDY ADS</SectionTag>
    <h1>We make brands <span>visible in the real world.</span></h1>
    <p>Kandy Ads is a Kandy-based advertising and brand visibility company. We bring creative planning, practical production and on-site execution together to help businesses look unmistakably like themselves.</p>
    <div className="about-hero-links"><Link to="/projects" className="btn primary">Explore our work <ArrowUpRight size={18}/></Link><Link to="/contact" className="about-simple-link">Talk to our team <ArrowUpRight size={18}/></Link></div>
  </section>

  <section className="container about-story-refresh">
   <div><SectionTag>WHO WE ARE</SectionTag><h2>Local roots. <span>A hands-on approach.</span></h2></div>
   <div className="about-story-copy">
    <p>Our story is rooted in Kandy, Sri Lanka, and in the everyday challenge businesses face: making a strong, consistent impression in busy physical spaces.</p>
    <p>That is the work we focus on. We connect a business's identity to the things people see and interact with — from shopfront signs and vehicle graphics to retail spaces, outdoor campaigns, displays and events.</p>
    <p>Rather than treating design as separate from delivery, we consider how an idea will be measured, printed, fabricated, installed and maintained. Our priority is clear communication and a finished result that works in its environment.</p>
    <p className="about-history-note">Company milestones and founding dates can be added here when verified by the Kandy Ads team.</p>
   </div>
  </section>

  <section className="about-capabilities-refresh">
   <div className="container">
    <div className="about-section-split"><div><SectionTag light>WHAT WE CAN DO</SectionTag><h2>One partner for the details that make a business visible.</h2></div><p>Our six core capabilities cover the practical moments where your audience meets your brand.</p></div>
    <div className="about-capabilities-grid">{services.map((service,index)=><Reveal key={service.slug} delay={Math.min(index*.04,.12)}><Link to={`/services/${service.slug}`} className="about-capability"><span>0{index+1}</span><h3>{service.title}</h3><p>{service.desc}</p><ArrowUpRight size={21}/></Link></Reveal>)}</div>
   </div>
  </section>

  <section className="container about-strengths-refresh">
   <div className="about-section-split"><div><SectionTag>OUR STRENGTHS</SectionTag><h2>Built around <span>what happens after the idea.</span></h2></div><p>Good branding needs more than a compelling visual. It needs judgment, coordination and an understanding of the physical setting.</p></div>
   <div className="about-strengths-grid">{strengths.map(({icon:Icon,title,body})=><Reveal key={title}><div className="about-strength-card"><Icon size={28} strokeWidth={1.6} aria-hidden="true"/><h3>{title}</h3><p>{body}</p></div></Reveal>)}</div>
  </section>

  <section className="image-feature container about-result-refresh">
    <figure className="about-result-image"><img src={resultImage} alt="Illustrative concept of a completed branded retail storefront with red-and-black signage" loading="lazy" decoding="async"/><figcaption>Illustrative design concept — not a photograph of a completed customer project.</figcaption></figure>
    <div className="about-result-copy"><SectionTag>THE RESULT</SectionTag><h2>From a business need to a place people remember.</h2><p>Effective signage and branding bring different touchpoints together: an easy-to-recognize exterior, clear wayfinding, consistent graphics and materials that fit the environment.</p><p>Explore our real project gallery for examples of the formats, finishes and work we produce.</p><Link to="/projects" className="text-link">See our actual portfolio <ArrowUpRight/></Link></div>
  </section>

  <section className="container about-approach-refresh">
   <div><SectionTag>HOW WE WORK</SectionTag><h2>A clear line from the brief to the handover.</h2></div>
   <div className="about-approach-copy"><p>We listen first, check the site, develop the right approach, produce with care and coordinate installation. Support and future improvements remain part of the conversation.</p><Link to="/process" className="text-link">Explore our six-step process <ArrowUpRight/></Link></div>
  </section>

  <section className="final-cta-wrap"><div className="container"><section className="lead-cta"><div><SectionTag light>WORK WITH KANDY ADS</SectionTag><h2>Let's make your next impression count.</h2><p>Tell us about your site, brand and objectives. We'll help work out a practical way forward.</p></div><PrimaryCTA>Get a Quote</PrimaryCTA></section></div></section>
 </Site>;
}
