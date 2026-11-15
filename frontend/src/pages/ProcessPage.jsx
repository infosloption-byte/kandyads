import React from 'react';
import { ArrowUpRight, ClipboardList, Ruler, PenTool, Factory, Wrench, Headphones, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Site, SectionHero, SectionTag, Reveal, PrimaryCTA } from '../site-shell';
import '../styles/about-process.css';

const method = [
  { number:'01', title:'Discover', icon:ClipboardList, intro:'We listen before we design.', detail:'Understand your brand, your audience, the location and what the finished work needs to achieve.', deliverable:'A clear starting brief' },
  { number:'02', title:'Site review', icon:Ruler, intro:'Make decisions that fit the space.', detail:'Review dimensions, visibility, access, materials and practical installation requirements where relevant.', deliverable:'Practical measurements and scope' },
  { number:'03', title:'Design', icon:PenTool, intro:'Give the idea a clear visual direction.', detail:'Develop artwork, presentation options and finishes with production feasibility in mind.', deliverable:'Artwork direction for approval' },
  { number:'04', title:'Production', icon:Factory, intro:'Turn approved ideas into physical work.', detail:'Coordinate printing, fabrication and finishing, checking quality before anything goes to site.', deliverable:'Finished production components' },
  { number:'05', title:'Installation', icon:Wrench, intro:'Bring every element into place.', detail:'Plan the handover and site execution so the finished sign, display or branding is ready to be seen.', deliverable:'Installed, ready-to-use result' },
  { number:'06', title:'Support', icon:Headphones, intro:'Keep the relationship moving.', detail:'Help with updates, additional locations, refreshes and the next stage of your visibility needs.', deliverable:'A contact for what comes next' },
];

export default function ProcessPage() {
  return <Site>
    <SectionHero kicker="OUR PROCESS" title="A better result starts with a clearer process." text="From an initial conversation to installation and follow-up, we keep creative direction, production and delivery connected."/>
    <section className="container process-redesign-intro" aria-labelledby="method-title">
      <div>
        <SectionTag>OUR METHOD</SectionTag>
        <h2 id="method-title">Six connected steps.<br/><span>One accountable team.</span></h2>
      </div>
      <p>No complicated handoffs. Each stage has a purpose, a practical outcome and the same focus: making your business easier to see, recognise and remember.</p>
    </section>
    <section className="container process-redesign-flow" aria-label="Kandy Ads six-step workflow">
      <ol className="process-method-grid">
        {method.map((step,index)=>{
          const Icon=step.icon;
          return <li key={step.number} className="process-method-item">
            <Reveal delay={Math.min(index*.045,.18)} className="process-method-reveal">
              <article className="process-method-card">
                <div className="process-method-top"><span className="process-method-number">{step.number}</span><div className="process-method-icon"><Icon size={26} strokeWidth={1.7} aria-hidden="true"/></div></div>
                <div className="process-method-copy"><h3>{step.title}</h3><strong>{step.intro}</strong><p>{step.detail}</p></div>
                <div className="process-method-output"><CheckCircle2 size={16} aria-hidden="true"/><span>{step.deliverable}</span></div>
              </article>
            </Reveal>
          </li>;
        })}
      </ol>
      <p className="process-flow-note">Every project is different. The sequence is adapted to the type of work, site conditions and approvals required.</p>
    </section>
    <section className="process-assurance"><div className="container">
      <SectionTag light>WHY THIS WORKS</SectionTag>
      <div className="assurance-grid">
        <div><h2>One clear direction.</h2><p>Design, production and site requirements are considered together instead of being passed between disconnected teams.</p></div>
        <div><h2>Practical from day one.</h2><p>Visibility, materials, finish, maintenance and installation access influence the recommended approach.</p></div>
        <div><h2>Ready for the real world.</h2><p>We focus on an outcome that fits the place, the audience and the way people interact with your business.</p></div>
      </div>
    </div></section>
    <section className="container process-cta"><div><SectionTag>READY WHEN YOU ARE</SectionTag><h2>Share your brief. We'll shape the next step.</h2><Link to="/services" className="text-link">Explore our services <ArrowUpRight size={17}/></Link></div><PrimaryCTA>Get a Quote</PrimaryCTA></section>
  </Site>;
}
