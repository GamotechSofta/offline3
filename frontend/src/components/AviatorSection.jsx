import React from 'react';

const AVIATOR_BASE_URL = 'https://aviator-jet-theta.vercel.app/?uid=68c3b5afbc7114822c777c1b';
const AVIATOR_GAMES_IMAGE = 'https://res.cloudinary.com/dnyp5jknp/image/upload/v1771667250/Aviator_Games_kvsp7v.png';
const CHICKEN_ROAD_BANNER = 'https://res.cloudinary.com/dzd47mpdo/image/upload/v1771873897/af84f231-b153-4266-839f-f22b422907f8.png';

const aviatorCards = [
  { title: 'Aviator', sub: 'Crash Game', image: AVIATOR_GAMES_IMAGE, cta: 'Aviator' },
  { title: 'Chicken Road', sub: 'Game', image: CHICKEN_ROAD_BANNER, cta: 'Chicken Road' },
  { title: 'Quick Play', sub: 'Bet & Win', image: AVIATOR_GAMES_IMAGE, cta: 'Aviator' },
];

const AviatorSection = () => {
  const openAviator = () => window.open(AVIATOR_BASE_URL, '_blank', 'noopener,noreferrer');

  return (
    <section className="w-full bg-white min-[375px]:pt-2 pb-4 sm:pt-4 sm:pb-6 min-[375px]:px-3 sm:px-4 max-w-full overflow-x-hidden">
      {/* Section header - matches Markets style */}
      <div className="hidden md:flex items-center gap-4 mt-2 mb-4 w-full max-w-7xl mx-auto px-4">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-orange-200 via-orange-400 to-orange-500 min-w-[20px]" />
        <div className="flex items-center gap-2 shrink-0">
          <svg className="w-2.5 h-2.5 text-orange-400" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.8 4.2L12 6l-4.2 1.8L6 12l-1.8-4.2L0 6l4.2-1.8z"/></svg>
          <h2 className="text-gray-800 text-lg font-bold tracking-[0.15em] uppercase">Games</h2>
          <svg className="w-2.5 h-2.5 text-orange-400" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0l1.8 4.2L12 6l-4.2 1.8L6 12l-1.8-4.2L0 6l4.2-1.8z"/></svg>
        </div>
        <div className="flex-1 h-[1px] bg-gradient-to-l from-orange-200 via-orange-400 to-orange-500 min-w-[20px]" />
      </div>
      <div className="flex md:hidden items-end justify-center mb-3 min-[375px]:mb-4 w-full max-w-7xl mx-auto gap-1 min-[375px]:gap-2 sm:gap-4">
        <div className="flex-1 h-[2px] bg-orange-500 shrink min-w-0" />
        <div className="relative shrink-0 w-[90px] min-[375px]:w-[110px] sm:w-[140px] h-[22px] min-[375px]:h-[26px] sm:h-[30px] flex items-center justify-center">
          <h2 className="text-gray-800 text-xs min-[375px]:text-sm sm:text-base font-bold tracking-wider">GAMES</h2>
        </div>
        <div className="flex-1 h-[2px] bg-orange-500 shrink min-w-0" />
      </div>

      {/* 3 Aviator cards - compact */}
      <div className="grid grid-cols-3 gap-1.5 min-[375px]:gap-2 sm:gap-3 w-full max-w-2xl mx-auto px-1">
        {aviatorCards.map((card, index) => (
          <button
            key={index}
            type="button"
            onClick={openAviator}
            className="bg-white border border-orange-200 rounded-md overflow-hidden shadow-sm transform transition-transform duration-200 cursor-pointer hover:scale-[1.02] hover:border-orange-400 text-left"
          >
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 py-1 px-1.5 text-center">
              <p className="text-white text-[9px] min-[375px]:text-[10px] sm:text-xs font-semibold leading-tight">
                PLAY NOW
              </p>
            </div>
            <div className="relative p-0 overflow-hidden">
              <img
                src={card.image}
                alt={card.title}
                className="w-full aspect-[4/3] max-h-[72px] min-[375px]:max-h-[80px] sm:max-h-[88px] object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden />
              <div className="absolute bottom-0 left-0 right-0 p-1 min-[375px]:p-1.5 text-white">
                <p className="text-white/90 text-[8px] min-[375px]:text-[9px] sm:text-[10px] truncate">{card.sub}</p>
                <h3 className="text-white text-[9px] min-[375px]:text-[10px] sm:text-xs font-semibold truncate">
                  {card.title}
                </h3>
                <p className="text-orange-300 text-[10px] min-[375px]:text-xs font-bold mt-0.5">
                  {card.cta} →
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default AviatorSection;
