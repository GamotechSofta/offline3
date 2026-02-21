import React from 'react';

const heroImageUrl =
  'https://res.cloudinary.com/dnyp5jknp/image/upload/v1770722975/Black_Gold_Modern_Casino_Night_Party_Facebook_Cover_1545_x_900_px_1920_x_500_px_1_l8iyri_rnwjad.png';

const HeroSection = () => {
  return (
    <section
      className="w-full min-h-[200px] sm:min-h-[280px] md:min-h-[340px] overflow-hidden rounded-xl mx-4 sm:mx-6 mb-6"
      style={{
        backgroundImage: `url(${heroImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
};

export default HeroSection;
