import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Menu, X, MessageCircle, Phone, Mail, MapPin } from 'lucide-react';
import { LOGO, services } from './site-data';
import { CONTACT_DETAILS } from './data/contact-details';

export function Reveal({children,className='',delay=0}){
  return <motion.div className={className} initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.12}} transition={{duration:.5,delay,ease:'easeOut'}}>{children}</motion.div>;
}

export function SectionTag({children,light=false}){return <div className={light?'section-tag light-tag':'section-tag'}>{children}</div>}

export function Navbar(){
  const [open,setOpen]=React.useState(false); const location=useLocation();
  const nav=[['About','/about'],['Services','/services'],['Projects','/projects'],['Industries','/industries'],['Process','/process'],['Contact','/contact']];
  return <header className="nav"><div className="nav-inner">
    <Link to="/" className="brand" onClick={()=>setOpen(false)}><img src={LOGO} alt="Kandy Ads"/><span>KANDY<span>ADS</span></span></Link>
    <nav className={open?'open':''} aria-label="Primary navigation">
      {nav.map(([label,url])=><Link className={location.pathname===url?'active':''} key={url} to={url} onClick={()=>setOpen(false)}>{label}</Link>)}
      <Link to="/quote" className="nav-cta" onClick={()=>setOpen(false)}>Get a Quote <ArrowUpRight size={16}/></Link>
    </nav>
    <button className="menu" onClick={()=>setOpen(v=>!v)} aria-label={open?'Close menu':'Open menu'}>{open?<X/>:<Menu/>}</button>
  </div></header>;
}

export function FloatingActions(){return <div className="float-actions"><a href={CONTACT_DETAILS.whatsappHref} aria-label="WhatsApp"><MessageCircle/></a><Link to="/quote" aria-label="Request a quote"><ArrowUpRight/></Link></div>}

export function SectionHero({kicker,title,text,accent=false}){return <section className="section-hero container"><div className="section-tag">{kicker}</div><h1>{accent?<>{title}</>:title}</h1><p>{text}</p></section>}

export function PrimaryCTA({to='/quote',children='Request a quote'}){return <Link to={to} className="btn primary">{children} <ArrowUpRight/></Link>}

export function Footer(){
  return <footer><div className="container footer-grid">
    <div><Link to="/" className="brand footer-brand"><img src={LOGO} alt="Kandy Ads"/><span>KANDY<span>ADS</span></span></Link><p>Creative advertising, signage and brand visibility solutions from Kandy, Sri Lanka.</p><div className="footer-contact">
      <a href={CONTACT_DETAILS.phoneHrefs[0]}><Phone size={14}/> {CONTACT_DETAILS.phones[0]}</a>
      <a href={CONTACT_DETAILS.phoneHrefs[1]}><Phone size={14}/> {CONTACT_DETAILS.phones[1]}</a>
      <a href={`mailto:${CONTACT_DETAILS.emails[0]}`}><Mail size={14}/> {CONTACT_DETAILS.emails[0]}</a>
      <a href={`mailto:${CONTACT_DETAILS.emails[1]}`}><Mail size={14}/> {CONTACT_DETAILS.emails[1]}</a>
      <span><MapPin size={14}/> {CONTACT_DETAILS.addresses[0]}</span>
      <span><MapPin size={14}/> {CONTACT_DETAILS.addresses[1]}</span>
    </div></div>
    <div><b>Explore</b><Link to="/about">About</Link><Link to="/services">Services</Link><Link to="/projects">Projects</Link><Link to="/industries">Industries</Link><Link to="/process">Process</Link><Link to="/contact">Contact</Link></div>
    <div><b>Capabilities</b>{services.map(s=><Link key={s.slug} to={'/services/'+s.slug}>{s.title}</Link>)}</div>
    <div><b>Start a project</b><p className="footer-note">Tell us what you need and we’ll shape the right production path.</p><Link to="/quote" className="footer-cta">Get a Quote <ArrowUpRight size={16}/></Link><a href={CONTACT_DETAILS.whatsappHref} className="footer-cta">WhatsApp <ArrowUpRight size={16}/></a></div>
  </div><div className="container foot-bottom"><span>© {new Date().getFullYear()} Kandy Ads. All rights reserved.</span><span>Advertising · Branding · Production · Installation</span></div></footer>;
}

export function Site({children}){return <><Navbar/><main>{children}</main><Footer/><FloatingActions/></>}
