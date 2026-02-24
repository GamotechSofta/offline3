import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      // Also scroll any scrollable containers (match AppRoutes behavior)
      setTimeout(() => {
        const scrollableElements = document.querySelectorAll(
          '[class*="overflow-y-auto"], [class*="overflow-y-scroll"], [class*="overflow-auto"]'
        );
        scrollableElements.forEach((el) => {
          if (el && typeof el.scrollTop === 'number') el.scrollTop = 0;
        });
      }, 10);
    } catch (_) {}
  };

  const navItems = [
    {
      id: 'my-bids',
      label: 'My Bets',
      path: '/bids',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769777192/auction_ofhpps.png"
          alt="My Bets"
          className="w-6 h-6 object-contain [image-rendering:-webkit-optimize-contrast]"
        />
      )
    },
    {
      id: 'bank',
      label: 'Bank',
      path: '/bank',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769777283/bank_il6uwi.png"
          alt="Bank"
          className="w-6 h-6 object-contain [image-rendering:-webkit-optimize-contrast]"
        />
      )
    },
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769777716/home_pvawyw.png"
          alt="Home"
          className="w-6 h-6 object-contain [image-rendering:-webkit-optimize-contrast]"
        />
      ),
      isCenter: true
    },
    {
      id: 'funds',
      label: 'Funds',
      path: '/funds',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769777500/funding_zjmbzp.png"
          alt="Funds"
          className="w-6 h-6 object-contain [image-rendering:-webkit-optimize-contrast]"
        />
      )
    },
    {
      id: 'support',
      label: 'Support',
      path: '/support',
      icon: (
        <img
          src="https://res.cloudinary.com/dzd47mpdo/image/upload/v1769777618/customer-support_du0zcj.png"
          alt="Support"
          className="w-6 h-6 object-contain [image-rendering:-webkit-optimize-contrast]"
        />
      )
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
      }}
    >
      {/* Bar: distinct surface so it’s clearly visible */}
      <div className="relative bg-[#252D3A] border-t-2 border-[#333D4D] rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)] flex items-end justify-around px-1 pt-2 pb-1 min-h-[64px]">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const isCenter = item.isCenter;

          if (isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.path === '/' && location.pathname === '/') {
                    scrollToTop();
                    return;
                  }
                  navigate(item.path);
                }}
                className="flex flex-col items-center justify-center -mt-6 relative z-10 active:scale-90 transition-transform duration-150 touch-manipulation"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                    active
                      ? 'bg-primary ring-2 ring-primary/60 ring-offset-2 ring-offset-[#252D3A] scale-105'
                      : 'bg-primary-500/20 border-2 border-primary-400'
                  }`}
                >
                  {/* Icon: white for both states (invert), active stands out via circle bg */}
                  <div className="transition-all duration-200 brightness-0 invert">
                    {item.icon}
                  </div>
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-bold mt-1 transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-gray-200'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.path === '/' && location.pathname === '/') {
                  scrollToTop();
                  return;
                }
                navigate(item.path);
              }}
              className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-2 rounded-xl min-w-[56px] active:scale-95 transition-all duration-150 touch-manipulation"
            >
              {/* Icon: white for all items (invert) */}
              <div
                className={`transition-all duration-200 brightness-0 invert ${active ? 'scale-110 opacity-100' : 'scale-100 opacity-90'}`}
              >
                {item.icon}
              </div>
              {/* Active indicator dot below icon */}
              <div className="h-1.5 w-full flex items-center justify-center">
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-md mx-auto" />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold transition-colors duration-200 ${
                  active ? 'text-primary' : 'text-gray-200'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavbar;
