import React from 'react';
import { ArrowUpRight, Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { services, contactInfo } from '../site-data';
import { Site, SectionHero, SectionTag, PrimaryCTA } from '../site-shell';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export default function ContactPage(){
  const [form,setForm]=React.useState({name:'',company:'',phone:'',email:'',service:'',requirement:'',website:''});
  const [state,setState]=React.useState({loading:false,error:'',success:''});
  const params=React.useMemo(()=>new URLSearchParams(window.location.search),[]);
  const update=e=>setForm(current=>({...current,[e.target.name]:e.target.value}));
  const submit=async e=>{e.preventDefault();setState({loading:true,error:'',success:''});try{const response=await fetch(`${API_BASE}/public/contact`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,utmSource:params.get('utm_source')||undefined,utmMedium:params.get('utm_medium')||undefined,utmCampaign:params.get('utm_campaign')||undefined})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(payload?.error?.message||'Unable to send your enquiry.');setState({loading:false,error:'',success:payload.data?.message||'Thanks. Your enquiry has been received.'});setForm({name:'',company:'',phone:'',email:'',service:'',requirement:'',website:''});}catch(error){setState({loading:false,error:error.message||'Unable to send your enquiry.',success:''});}};
  return <Site>
    <SectionHero kicker="CONTACT" title="Let's build something people notice." text="Tell us what you are trying to achieve, where it needs to happen and what you already have. We'll help shape the next step."/>
    <section className="container contact-grid">
      <div>
        <div className="contact-card"><Phone/><span>WHATSAPP NUMBER</span><h3>{contactInfo.phones[0]}</h3><p>For quick project discussions, measurements, site requirements and questions.</p><a href={`https://wa.me/${contactInfo.whatsapp}`}><MessageCircle size={16}/> Start a WhatsApp conversation <ArrowUpRight size={16}/></a></div>
        <div className="contact-card"><Phone/><span>OFFICE PHONE</span><h3>{contactInfo.phones[1]}</h3><p>Call the office for project coordination and general enquiries.</p><a href={contactInfo.phoneHrefs[1]}><Phone size={16}/> Call the office <ArrowUpRight size={16}/></a></div>
        <div className="contact-card"><Mail/><span>EMAIL ADDRESS</span><h3>{contactInfo.emails[0]}</h3><p>Send your brief, artwork, references or quotation request.</p><a href={`mailto:${contactInfo.emails[0]}`}><Mail size={16}/> Send an email <ArrowUpRight size={16}/></a></div>
        <div className="contact-card"><MapPin/><span>LOCATION</span><h3>{contactInfo.addresses[0]}</h3><p>Our main location for project discussions and coordination.</p></div>
      </div>
      <form className="quote-form" onSubmit={submit}>
        <div className="form-heading"><SectionTag>PROJECT ENQUIRY</SectionTag><h2>Tell us about the job.</h2></div>
        {state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.success&&<p className="form-success" role="status">{state.success}</p>}
        <label>Name<input name="name" value={form.name} onChange={update} required placeholder="Your name"/></label>
        <label>Company<input name="company" value={form.company} onChange={update} placeholder="Company name"/></label>
        <label>Phone / WhatsApp<input name="phone" value={form.phone} onChange={update} required placeholder="0777 483 502"/></label>
        <label>Email<input name="email" value={form.email} onChange={update} type="email" placeholder="info@kandyads.lk"/></label>
        <label>Service<select name="service" value={form.service} onChange={update}><option value="">Select a service</option>{services.map(s=><option key={s.slug} value={s.title}>{s.title}</option>)}</select></label>
        <label>Project details<textarea name="requirement" value={form.requirement} onChange={update} required rows="6" placeholder="Location, size, quantity, deadline, materials, reference links or anything else we should know..."/></label>
        <label className="honeypot" aria-hidden="true">Website<input name="website" value={form.website} onChange={update} tabIndex="-1" autoComplete="off"/></label>
        <button className="btn primary" type="submit" disabled={state.loading}>{state.loading?'Sending…':'Send enquiry'} <ArrowUpRight/></button>
        <p className="form-note">Your enquiry is securely sent to the Kandy Ads lead pipeline. Source and campaign parameters are retained when present.</p>
      </form>
    </section>
    <section className="container contact-bottom"><div><SectionTag>NOT SURE WHERE TO START?</SectionTag><h2>Use the <span>quick estimator.</span></h2><p>Get a rough planning range, then send the estimate to our team for review.</p></div><PrimaryCTA>Get a Quote</PrimaryCTA></section>
  </Site>;
}
