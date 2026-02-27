import React from 'react';
import { useNavigate } from 'react-router-dom';

const AVIATOR_BASE_URL = 'https://aviator-jet-theta.vercel.app/?uid=68c3b5afbc7114822c777c1b';
const AVIATOR_GAMES_IMAGE = 'https://res.cloudinary.com/dnyp5jknp/image/upload/v1771667250/Aviator_Games_kvsp7v.png';
const CHICKEN_ROAD_BANNER = 'https://res.cloudinary.com/dzd47mpdo/image/upload/v1771873897/af84f231-b153-4266-839f-f22b422907f8.png';
const ROULETTE_IMAGE = 'https://res.cloudinary.com/dzd47mpdo/image/upload/v1771874441/6c262fa7-583c-4cb0-80fb-5e4544c91451.png';

const aviatorCards = [
  { title: 'Aviator', sub: 'Crash Game', image: AVIATOR_GAMES_IMAGE, url: AVIATOR_BASE_URL },
  { title: 'Chicken Road', sub: 'Game', image: CHICKEN_ROAD_BANNER, url: AVIATOR_BASE_URL },
  { title: 'Roulette', sub: 'Game', image: ROULETTE_IMAGE, path: '/games/roulette' },
];

const AviatorSection = () => {
  const navigate = useNavigate();

  const handleCardClick = (card) => {
    if (card.path) {
      navigate(card.path);
    } else if (card.url) {
      window.open(card.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section className="w-full pt-0 pb-4 sm:pt-1 sm:pb-8">
      {/* Section header - bold, left-aligned, with tagline */}
      <div className="mb-3 sm:mb-5">
        <div className="inline-flex items-center gap-2 sm:gap-2.5">
          <span className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30">
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <div>
            <h2 className="text-base sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Play & Win
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-0.5 font-medium">Instant games — tap to play</p>
          </div>
        </div>
      </div>

      {/* Mobile: 3 cards in one row, horizontal carousel. Desktop: grid */}
      <div className="sm:hidden overflow-x-auto snap-x snap-mandatory -mx-4 px-4 touch-pan-x">
        <div className="flex gap-2 w-full">
          {aviatorCards.map((card, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCardClick(card)}
              className="flex-[0_0_calc((100%-1rem)/3)] min-w-0 shrink-0 snap-start bg-[#252D3A] border border-[#333D4D] rounded-lg overflow-hidden transition-all duration-200 cursor-pointer hover:border-primary-500/60 active:scale-[0.98] text-left group"
            >
              <div className="relative overflow-hidden aspect-[3/4]">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden />
                <div className="absolute top-0.5 right-0.5">
                  <span className="px-1 py-0.5 rounded bg-primary-500 text-white text-[8px] font-semibold">Play</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-1 text-white">
                  <p className="text-white/80 text-[8px] truncate">{card.sub}</p>
                  <h3 className="text-white text-[10px] font-semibold truncate">{card.title}</h3>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden sm:grid grid-cols-3 gap-4 max-w-2xl">
        {aviatorCards.map((card, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleCardClick(card)}
            className="bg-[#252D3A] border border-[#333D4D] rounded-xl overflow-hidden transition-all duration-200 cursor-pointer hover:border-primary-500/60 hover:shadow-lg hover:shadow-primary-500/10 text-left w-full group"
          >
            <div className="relative overflow-hidden aspect-[4/3]">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden />
              <div className="absolute top-2 right-2">
                <span className="px-1.5 py-0.5 rounded bg-primary-500 text-white text-[10px] font-semibold">Play</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-white/80 text-xs truncate">{card.sub}</p>
                <h3 className="text-white text-sm font-semibold truncate">{card.title}</h3>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default AviatorSection;
