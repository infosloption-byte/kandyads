import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Zap, Truck, MapPin, PenTool, Factory, Sparkles } from 'lucide-react';
import { services } from '../site-data';
import signageImage from '../assets/services/signage.webp';
import vehicleImage from '../assets/services/vehicle-branding.webp';
import outdoorImage from '../assets/services/outdoor-advertising.webp';
import printingImage from '../assets/services/printing.webp';
import retailImage from '../assets/services/retail-branding.webp';
import eventsImage from '../assets/services/events.webp';
import { Site, SectionHero, Reveal, SectionTag, PrimaryCTA } from '../site-shell';
import '../styles/service-work-previews.css';

const icons = [Zap, Truck, MapPin, PenTool, Factory, Sparkles];

const serviceImages = {
  signage: signageImage,
  'vehicle-branding': vehicleImage,
  'outdoor-advertising': outdoorImage,
  printing: printingImage,
  'retail-branding': retailImage,
  events: eventsImage,
};

function ServiceWorkPreview({ service }) {
  return (
    <span className="service-row-visual">
      <img
        src={serviceImages[service.slug]}
        alt={`AI-generated illustration of ${service.title.toLowerCase()} services`}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

export default function ServicesPage() {
  return (
    <Site>
      <SectionHero
        kicker="SERVICES"
        title="Every surface is a chance to be remembered."
        text="From one signboard to a complete rollout, Kandy Ads connects creative direction, production and installation through one accountable team."
      />
      <section className="container service-list" aria-label="Our six services">
        {services.map((service, index) => {
          const Icon = icons[index];
          return (
            <Reveal key={service.slug} delay={index * 0.04}>
              <Link className="service-row service-row--with-image" to={`/services/${service.slug}`}>
                <span>0{index + 1}</span>
                <Icon aria-hidden="true" />
                <div className="service-row-copy">
                  <small>{service.kicker}</small>
                  <h2>{service.title}</h2>
                  <p>{service.desc}</p>
                </div>
                <ServiceWorkPreview service={service} />
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Reveal>
          );
        })}
      </section>
      <section className="container service-detail-strip">
        <SectionTag>HOW WE THINK</SectionTag>
        <h2>We recommend the format around the business — not the other way around.</h2>
        <p>Location, viewing distance, material, lighting, customer flow, access and installation conditions all shape the right advertising solution.</p>
      </section>
      <section className="final-cta-wrap">
        <div className="container">
          <section className="lead-cta">
            <div>
              <SectionTag light>START A PROJECT</SectionTag>
              <h2>Need one service or the whole system?</h2>
              <p>Let's work from the brief and build the right visibility package.</p>
            </div>
            <PrimaryCTA>Get a Quote</PrimaryCTA>
          </section>
        </div>
      </section>
    </Site>
  );
}
