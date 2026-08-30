import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import './styles/site.css';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import IndustriesPage from './pages/IndustriesPage';
import ProcessPage from './pages/ProcessPage';
import ContactPage from './pages/ContactPage';

function ScrollToTop(){
  const {pathname}=useLocation();
  React.useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'auto'});},[pathname]);
  return null;
}

function QuoteRedirect(){
  React.useEffect(()=>{
    window.location.replace('/quote');
  },[]);
  return <div aria-hidden="true" />;
}

function Router(){
  const location=useLocation();
  return <AnimatePresence mode="wait" initial={false}>
    <motion.div key={location.pathname} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.22}}>
      <Routes location={location}>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/about" element={<AboutPage/>}/>
        <Route path="/services" element={<ServicesPage/>}/>
        <Route path="/services/:slug" element={<ServiceDetailPage/>}/>
        <Route path="/projects" element={<ProjectsPage/>}/>
        <Route path="/industries" element={<IndustriesPage/>}/>
        <Route path="/process" element={<ProcessPage/>}/>
        <Route path="/contact" element={<ContactPage/>}/>
        {/* /quote is a dedicated entry point; hard-redirect here so Link-based CTAs
            cannot land on the main router with no matching route. */}
        <Route path="/quote" element={<QuoteRedirect/>}/>
      </Routes>
    </motion.div>
  </AnimatePresence>;
}

createRoot(document.getElementById('root')).render(<BrowserRouter><ScrollToTop/><Router/></BrowserRouter>);
