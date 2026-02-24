import React from 'react';
import HeroSection from '../components/HeroSection';
import AviatorSection from '../components/AviatorSection';
import Section1 from '../components/Section1';

const Home = () => {
  return (
    <div className="min-h-screen min-h-ios-screen bg-[#1F2732] w-full max-w-full overflow-x-hidden">
      <HeroSection />
      <main className="w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        <AviatorSection />
        <Section1 />
      </main>
    </div>
  );
};

export default Home;
