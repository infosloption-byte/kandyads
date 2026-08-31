import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { industries } from '../site-data';
import { Site, SectionHero, Reveal, SectionTag, PrimaryCTA } from '../site-shell';
const descriptions={
 'Retail & Supermarkets':'Storefront signage, promotions, wayfinding and in-store branding that help customers navigate and remember the brand.',
 'Banking & Finance':'Professional branch signage, directional systems, glass graphics and campaign displays for trusted customer environments.',
 'Hotels & Tourism':'Exterior identification, entrance branding, wayfinding and guest-facing displays designed for hospitality spaces.',
 'Education':'Campus signage, directional boards, building identification and event displays that make institutions easier to navigate.',
 'Healthcare':'Clear, durable and professional signage systems for hospitals, clinics, pharmacies and healthcare facilities.',
 'Food & Beverage':'Restaurant frontages, menu displays, illuminated signs, promotional graphics and vehicle branding for high-visibility locations.',
 'Real Estate':'Project hoardings, site signage, sales-office branding and directional systems that support developments and launches.',
 'Corporate':'Office branding, reception graphics, signage systems, wayfinding and campaign environments that reinforce corporate identity.'
};
export default function IndustriesPage(){return <Site><SectionHero kicker="INDUSTRIES" title="Advertising that fits the way your business operates." text="Different businesses have different visibility challenges. We adapt the solution to the customer journey, location, brand and practical demands of each sector."/><section className="container industries-lead"><SectionTag>BUILT FOR BUSINESS</SectionTag><h2>From first impression to everyday visibility.</h2><p>Whether customers arrive at a branch, walk into a store, pass a fleet vehicle or enter a hotel, every physical touchpoint contributes to the experience.</p></section><div className="container industry-grid">{industries.map((x,i)=><Reveal key={x} delay={i*.04}><article><span>0{i+1}</span><h2>{x}</h2><p>{descriptions[x]}</p><Link to="/contact">Discuss this industry <ArrowUpRight size={16}/></Link></article></Reveal>)}</div><section className="container industry-cta"><div><SectionTag>YOUR BUSINESS</SectionTag><h2>Tell us what customers should see first.</h2></div><PrimaryCTA>Get a Quote</PrimaryCTA></section></Site>}
