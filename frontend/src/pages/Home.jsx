import React from 'react';
import HeroSection from '../components/HeroSection';
import AviatorSection from '../components/AviatorSection';
import Section1 from '../components/Section1';

const Home = () => {
  return (
    <div className="min-h-screen min-h-ios-screen bg-white w-full max-w-full overflow-x-hidden">
      <HeroSection />
      <AviatorSection />
      <Section1 />
    </div>
  );
};

export default Home;
