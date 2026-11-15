import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './styles/site.css';
import './styles/original-brand.css';
import './styles/page-loader.css';
import PageLoader from './components/PageLoader';
const HomePage=React.lazy(()=>import('./pages/HomePage'));
const AboutPage=React.lazy(()=>import('./pages/AboutPage'));
const ServicesPage=React.lazy(()=>import('./pages/ServicesPage'));
const ServiceDetailPage=React.lazy(()=>import('./pages/ServiceDetailPage'));
const ProjectsPage=React.lazy(()=>import('./pages/ProjectsPage'));
const IndustriesPage=React.lazy(()=>import('./pages/IndustriesPage'));
const ProcessPage=React.lazy(()=>import('./pages/ProcessPage'));
const ContactPage=React.lazy(()=>import('./pages/ContactPage'));
const QuotePage=React.lazy(()=>import('./pages/quote-page.jsx'));

function ScrollToTop(){const {pathname}=useLocation();React.useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'auto'});},[pathname]);return null;}
function Router(){const location=useLocation();return <AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.22}}><React.Suspense fallback={<PageLoader message={location.pathname==="/quote"?"Preparing your quote calculator":"Preparing your page"}/> }><Routes location={location}><Route path="/" element={<HomePage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/services" element={<ServicesPage/>}/><Route path="/services/:slug" element={<ServiceDetailPage/>}/><Route path="/projects" element={<ProjectsPage/>}/><Route path="/industries" element={<IndustriesPage/>}/><Route path="/process" element={<ProcessPage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/quote" element={<QuotePage/>}/></Routes></React.Suspense></motion.div></AnimatePresence>}

createRoot(document.getElementById('root')).render(<BrowserRouter><ScrollToTop/><Router/></BrowserRouter>);
