import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { portfolio } from '../site-data';
import ProjectImage, { resolveProjectImage } from '../components/ProjectImage';
import { Site, SectionHero, Reveal, SectionTag, PrimaryCTA } from '../site-shell';
import '../styles/project-gallery.css';

const cats = [
  'All',
  'Signage',
  'Vehicle Branding',
  'Outdoor Advertising',
  'Retail Branding',
  'Print & Displays',
  'Events',
  'Displays',
  'Promotional',
];

export default function ProjectsPage() {
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? portfolio : portfolio.filter((project) => project[1] === cat);

  return (
    <Site>
      <SectionHero
        kicker="PROJECTS"
        title="Proof is the portfolio."
        text="Explore real Kandy Ads work across signage, retail branding, vehicles, outdoor advertising, printing and events."
      />
      <section className="container project-intro">
        <div>
          <SectionTag>SELECTED WORK</SectionTag>
          <h2>Built for the places people actually see.</h2>
        </div>
        <p>
          Use the filters to browse the capabilities represented in our supplied project portfolio.
          Each project can later become a full case study with scope, materials, location and results.
        </p>
      </section>
      <div className="container filters">
        {cats.map((category) => (
          <button
            className={cat === category ? 'active' : ''}
            onClick={() => setCat(category)}
            key={category}
            type="button"
            aria-pressed={cat === category}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="container project-grid project-poster-grid">
        {filtered.map((project, i) => (
          <Reveal key={project[0]} delay={Math.min(i * 0.02, 0.12)}>
            <motion.article className="project-card" layout whileHover={{ y: -4 }}>
              <a
                className="project-poster-link"
                href={resolveProjectImage(project[2])}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View full ${project[0]} portfolio image`}
              >
                <ProjectImage filename={project[2]} alt={`${project[0]} — Kandy Ads portfolio examples`} />
              </a>
              <div>
                <span>{project[1]}</span>
                <h3>{project[0]}</h3>
                <p>Click the image to view the full project collage.</p>
                <ArrowUpRight className="project-card-arrow" aria-hidden="true" />
              </div>
            </motion.article>
          </Reveal>
        ))}
      </div>
      <section className="container project-note">
        <strong>Want to see a similar solution for your business?</strong>
        <PrimaryCTA>Get a Quote</PrimaryCTA>
      </section>
    </Site>
  );
}
