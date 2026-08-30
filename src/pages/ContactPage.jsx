import React from 'react';
import { ArrowUpRight, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { services, contactInfo } from '../site-data';
import { Site, SectionHero, SectionTag, PrimaryCTA } from '../site-shell';

export default function ContactPage(){
  return <Site>
    <SectionHero kicker="CONTACT" title="Let's build something people notice." text="Tell us what you are trying to achieve, where it needs to happen and what you already have. We'll help shape the next step."/>
    <section className="container contact-grid">
      <div>
        <div className="contact-card">
          <Phone/>
          <span>CONTACT NUMBERS</span>
          <h3>{contactInfo.phones[0]} | {contactInfo.phones[1]}</h3>
          <p>For project discussions, measurements, site requirements and quick questions.</p>
          <a href={`https://wa.me/${contactInfo.whatsapp}`}><MessageCircle size={16}/> Start a WhatsApp conversation <ArrowUpRight size={16}/></a>
        </div>
        <div className="contact-card">
          <Mail/>
          <span>EMAIL ADDRESS</span>
          <h3>{contactInfo.emails[0]} | {contactInfo.emails[1]}</h3>
          <p>Send your brief, artwork, references or quotation request.</p>
          <a href={`mailto:${contactInfo.emails[0]}`}><Mail size={16}/> Send an email <ArrowUpRight size={16}/></a>
        </div>
        <div className="contact-card">
          <MapPin/>
          <span>LOCATION</span>
          <h3>155/E, Wathurakumbura Road, Kiribathkumbura, 20450</h3>
          <p>Warehouse - 150/B, Kahatagoda Road, Pilimathalawa.</p>
          <span><MapPin size={16}/> Main location and warehouse available for project coordination.</span>
        </div>
      </div>
      <form className="quote-form" onSubmit={e=>e.preventDefault()}>
        <div className="form-heading"><SectionTag>PROJECT ENQUIRY</SectionTag><h2>Tell us about the job.</h2></div>
        <label>Name<input required placeholder="Your name"/></label>
        <label>Company<input placeholder="Company name"/></label>
        <label>Phone / WhatsApp<input required placeholder="0777 483 502"/></label>
        <label>Email<input type="email" placeholder="kandyads342@gmail.com"/></label>
        <label>Service<select><option>Select a service</option>{services.map(s=><option key={s.slug}>{s.title}</option>)}</select></label>
        <label>Project details<textarea rows="6" placeholder="Location, size, quantity, deadline, materials, reference links or anything else we should know..."/></label>
        <button className="btn primary" type="submit">Send enquiry <ArrowUpRight/></button>
        <p className="form-note">This enquiry form is ready to connect to your email, CRM or lead endpoint.</p>
      </form>
    </section>
    <section className="container contact-bottom"><div><SectionTag>NOT SURE WHERE TO START?</SectionTag><h2>Use the <span>quick estimator.</span></h2><p>Get a rough planning range, then send the estimate to our team for review.</p></div><PrimaryCTA>Get a Quote</PrimaryCTA></section>
  </Site>;
}
