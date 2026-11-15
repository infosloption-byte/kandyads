import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardCheck, Ruler, PenTool, Factory, Wrench, Headphones, CheckCircle2, ShieldCheck, MessagesSquare, MapPinned } from 'lucide-react';
import { processSteps } from '../site-data';
import { Site, Reveal, SectionTag, PrimaryCTA } from '../site-shell';
import '../styles/process-redesign.css';

const stageDetails = [
  { icon: MessagesSquare, phase: 'Understand', output: 'A brief everyone agrees on', points: 'Goals, audience, budget and project requirements' },
  { icon: Ruler, phase: 'Assess', output: 'Dimensions and site requirements', points: 'Location, visibility, materials, access and measurements' },
  { icon: PenTool, phase: 'Create', output: 'An approved production direction', points: 'Artwork, layouts, materials and finish selection' },
  { icon: Factory, phase: 'Make', output: 'Checked and finished components', points: 'Print, fabricate, assemble and quality-control' },
  { icon: Wrench, phase: 'Deliver', output: 'An installed, ready-to-use result', points: 'Site coordination, fitting, safety and handover' },
  { icon: Headphones, phase: 'Support', output: 'A reliable point of contact', points: 'Practical follow-up, refreshes and future rollouts' }
];

export default function ProcessPage() {
  return (
    <Site>
      <section className="container process-page-hero">
        <SectionTag>OUR PROCESS</SectionTag>
        <h1>From your first idea <span>to the finished installation.</span></h1>
        <p>A clear production journey means fewer surprises and better decisions. We connect strategy, design, materials, fabrication and site work so every stage serves the same goal.</p>
        <div className="process-hero-facts" aria-label="How we work">
          <span><ClipboardCheck size={18} aria-hidden="true"/> Clear approvals</span>
          <span><MapPinned size={18} aria-hidden="true"/> Site-first decisions</span>
          <span><ShieldCheck size={18} aria-hidden="true"/> Accountable handover</span>
        </div>
      </section>

      <section className="container process-method" aria-labelledby="process-method-heading">
        <div className="process-section-heading">
          <div><SectionTag>THE SIX STAGES</SectionTag><h2 id="process-method-heading">One connected workflow.</h2></div>
          <p>Each stage answers a clear question before we move to the next. Depending on your project, some activities may overlap.</p>
        </div>
        <ol className="process-method-grid">
          {processSteps.map(([number, title, summary], index) => {
            const { icon: Icon, phase, output, points } = stageDetails[index];
            return (
              <li className="process-method-cell" key={number}>
                <Reveal delay={Math.min(index * .04, .16)}>
                  <article className="process-method-card">
                    <div className="process-card-top"><span className="process-card-number">{number}</span><Icon size={28} strokeWidth={1.65} aria-hidden="true" /></div>
                    <p className="process-card-phase">{phase}</p>
                    <h3>{title}</h3>
                    <p className="process-card-summary">{summary}</p>
                    <p className="process-card-details">{points}</p>
                    <div className="process-card-output"><CheckCircle2 size={17} aria-hidden="true"/><span>{output}</span></div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
        <p className="process-method-note">* The exact order and scope of work depend on the materials, site conditions and project brief.</p>
      </section>

      <section className="process-assurance process-assurance-refresh">
        <div className="container">
          <div className="process-assurance-intro"><SectionTag light>WHAT THIS MEANS FOR YOU</SectionTag><h2>Confidence at every handover.</h2></div>
          <div className="assurance-grid">
            <div><h3>One team, one clear direction.</h3><p>We connect creative, production and installation decisions rather than leaving you to coordinate separate suppliers.</p></div>
            <div><h3>Designed for the actual location.</h3><p>Visibility, dimensions, finishes, access and use conditions inform the solution before materials are committed.</p></div>
            <div><h3>Ready for real-world use.</h3><p>We treat checking, fitting and handover as part of the result, not an optional final step.</p></div>
          </div>
        </div>
      </section>
      <section className="container process-cta">
        <div><SectionTag>READY WHEN YOU ARE</SectionTag><h2>Bring us the challenge. We’ll map out the next step.</h2></div>
        <PrimaryCTA>Get a Quote</PrimaryCTA>
      </section>
    </Site>
  );
}
