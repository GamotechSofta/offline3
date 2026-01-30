import React from 'react';
import { useNavigate } from 'react-router-dom';

const Bank = () => {
  const navigate = useNavigate();
  const transactions = [
    {
      id: 1,
      type: 'Debit',
      amount: 100.0,
      time: '30-01-2026 10:05 PM',
      bidPlay: '339',
      game: 'MAIN BAZAR',
      bidType: 'Double Pana',
      market: 'close',
      previousBalance: 800.6,
      transactionAmount: -100.0,
      currentBalance: 700.6
    },
    {
      id: 2,
      type: 'Debit',
      amount: 25.0,
      time: '30-01-2026 09:52 PM',
      bidPlay: '9',
      game: 'RADHA NIGHT',
      bidType: 'Single Ank',
      market: 'close',
      previousBalance: 825.6,
      transactionAmount: -25.0,
      currentBalance: 800.6
    },
    {
      id: 3,
      type: 'Debit',
      amount: 25.0,
      time: '30-01-2026 09:52 PM',
      bidPlay: '5',
      game: 'RADHA NIGHT',
      bidType: 'Single Ank',
      market: 'close',
      previousBalance: 850.6,
      transactionAmount: -25.0,
      currentBalance: 825.6
    }
  ];

  const formatMoney = (value) => value.toFixed(2);

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="bg-black px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-white">Transaction History</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="bg-gray-900 rounded-2xl border border-gray-800 p-4 shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="font-medium text-red-400">
                {tx.type} {formatMoney(tx.amount)} <span className="ml-1">₹</span>
              </div>
              <div className="text-gray-400">{tx.time}</div>
            </div>

            <div className="grid grid-cols-2 gap-6 mt-4 text-sm text-gray-300">
              <div className="text-center">
                <div className="font-semibold text-white">Bid Play</div>
                <div className="text-gray-300">{tx.bidPlay}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-white">Game</div>
                <div className="text-gray-300">{tx.game}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-white">Type</div>
                <div className="text-gray-300">{tx.bidType}</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-white">Market</div>
                <div className="text-gray-300">{tx.market}</div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-4 pt-4 text-sm grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="font-medium text-gray-400">Previous Balance</div>
                <div className="text-white">₹{formatMoney(tx.previousBalance)}</div>
              </div>
              <div>
                <div className="font-medium text-gray-400">Transaction Amount</div>
                <div className="text-red-400">- {formatMoney(Math.abs(tx.transactionAmount))} ₹</div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-4 pt-3 text-center text-[#f3b61b] font-semibold">
              Current Balance : {formatMoney(tx.currentBalance)} ₹
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pt-5 pb-6">
        <div className="bg-gray-900 rounded-full border border-gray-800 px-4 py-3 flex items-center justify-between shadow-[0_6px_14px_rgba(0,0,0,0.35)]">
          <button type="button" className="flex items-center gap-1 text-gray-200 font-medium">
            <span className="text-lg leading-none">‹</span>
            <span>PREV</span>
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="w-9 h-9 rounded-full bg-black text-white font-semibold">
              1
            </button>
            <button type="button" className="w-9 h-9 rounded-full bg-[#f3b61b] text-black font-semibold">
              2
            </button>
            <button type="button" className="w-9 h-9 rounded-full bg-gray-800 text-white font-semibold border border-gray-700">
              &gt;&gt;
            </button>
          </div>
          <button type="button" className="flex items-center gap-1 text-gray-200 font-medium">
            <span>NEXT</span>
            <span className="text-lg leading-none">›</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Bank;
