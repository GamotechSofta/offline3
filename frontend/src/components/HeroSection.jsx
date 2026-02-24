import React from 'react';

const heroImageDesktop =
  'https://res.cloudinary.com/dnyp5jknp/image/upload/v1771338484/Black_Orange_Minimalis_Offline_Gaming_Banner_Landscape_1920_x_500_px_1_shojp0.png';
const heroImageMobile =
  'https://res.cloudinary.com/dzd47mpdo/image/upload/v1770623700/Black_Gold_Modern_Casino_Night_Party_Facebook_Cover_1545_x_900_px_ufrc1r.png';

const heroStyle = (url) => ({
  backgroundImage: `url(${url})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
});

const HeroSection = () => {
  return (
    <>
      {/* Desktop: section with aspect ratio */}
      <section
        className="w-full max-w-full overflow-hidden mt-0 md:mt-1 mb-3 md:mb-4 relative hidden md:block rounded-b-xl"
        style={{ aspectRatio: '1920/500' }}
      >
        <div
          className="absolute inset-0 w-full h-full"
          style={heroStyle(heroImageDesktop)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1F2732]/80 via-transparent to-transparent pointer-events-none" />
      </section>
      {/* Mobile: show full banner so no content is hidden */}
      <section className="w-full max-w-full overflow-hidden mt-0 mb-3 md:hidden rounded-b-xl">
        <div className="relative w-full">
          <img
            src={heroImageMobile}
            alt=""
            className="w-full h-auto object-contain object-center min-h-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F2732]/60 via-transparent to-transparent pointer-events-none rounded-b-xl" />
        </div>
      </section>
    </>
  );
};

export default HeroSection;
