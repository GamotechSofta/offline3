import React from 'react';

const AVIATOR_BASE_URL = 'https://aviator-jet-theta.vercel.app/?uid=68c3b5afbc7114822c777c1b';
const AVIATOR_GAMES_IMAGE = 'https://res.cloudinary.com/dnyp5jknp/image/upload/v1771667250/Aviator_Games_kvsp7v.png';
const CHICKEN_ROAD_BANNER = 'https://res.cloudinary.com/dzd47mpdo/image/upload/v1771873897/af84f231-b153-4266-839f-f22b422907f8.png';

const aviatorCards = [
  { title: 'Aviator', sub: 'Crash Game', image: AVIATOR_GAMES_IMAGE, cta: 'Aviator' },
  { title: 'Chicken Road', sub: 'Game', image: CHICKEN_ROAD_BANNER, cta: 'Chicken Road' },
];

const AviatorSection = () => {
  const openAviator = () => window.open(AVIATOR_BASE_URL, '_blank', 'noopener,noreferrer');

  return (
    <section className="w-full bg-[#1F2732] min-[375px]:pt-2 pb-4 sm:pt-4 sm:pb-6 min-[375px]:px-3 sm:px-4 max-w-full overflow-x-hidden">
      {/* Games bar - below hero, above cards */}
      <div className="flex items-center mt-2 mb-3 min-[375px]:mb-4 w-full -mx-3 min-[375px]:-mx-3 sm:-mx-4 px-3 min-[375px]:px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-primary-500/20 to-primary-600/20 border-y border-[#333D4D]">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary-500 text-white shadow-sm">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h2 className="text-white text-sm min-[375px]:text-base sm:text-lg font-bold tracking-tight">Games</h2>
        </div>
      </div>

      {/* Game cards - compact */}
      <div className="grid grid-cols-2 gap-1 min-[375px]:gap-1.5 sm:gap-2 w-full max-w-xs sm:max-w-sm px-1">
        {aviatorCards.map((card, index) => (
          <button
            key={index}
            type="button"
            onClick={openAviator}
            className="bg-[#252D3A] border border-[#333D4D] rounded-md overflow-hidden shadow-sm transform transition-transform duration-200 cursor-pointer hover:scale-[1.02] hover:border-primary-400 text-left max-w-[140px] min-[375px]:max-w-[160px] sm:max-w-[180px] w-full"
          >
            <div className="bg-gradient-to-r from-primary-500 to-amber-500 py-0.5 px-1 text-center">
              <p className="text-white text-[8px] min-[375px]:text-[9px] sm:text-[10px] font-semibold leading-tight">
                PLAY NOW
              </p>
            </div>
            <div className="relative p-0 overflow-hidden aspect-square">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden />
              <div className="absolute bottom-0 left-0 right-0 p-0.5 min-[375px]:p-1 text-white">
                <p className="text-white/90 text-[7px] min-[375px]:text-[8px] sm:text-[9px] truncate">{card.sub}</p>
                <h3 className="text-white text-[8px] min-[375px]:text-[9px] sm:text-[10px] font-semibold truncate">
                  {card.title}
                </h3>
                <p className="text-primary-300 text-[8px] min-[375px]:text-[9px] sm:text-[10px] font-bold mt-0.5">
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
