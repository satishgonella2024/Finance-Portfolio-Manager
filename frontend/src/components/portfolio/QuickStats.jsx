// frontend/src/components/portfolio/QuickStats.jsx
import React from 'react';

const QuickStats = ({ portfolio }) => {
  const totalValue = portfolio.holdings?.reduce(
    (sum, h) => sum + (h.shares * h.current_price), 
    0
  ) || 0;

  const calculateGrowth = () => {
    if (!portfolio.holdings?.length) return 0;
    const initialValue = portfolio.holdings.reduce(
      (sum, h) => sum + (h.shares * h.purchase_price), 
      0
    );
    return ((totalValue - initialValue) / initialValue) * 100;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
        <h3 className="text-sm opacity-75">Total Value</h3>
        <p className="text-2xl font-bold mt-2">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <span className="text-sm text-blue-100">
          {portfolio.holdings?.length || 0} Holdings
        </span>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
        <h3 className="text-sm opacity-75">Portfolio Growth</h3>
        <p className="text-2xl font-bold mt-2">
          {calculateGrowth().toFixed(2)}%
        </p>
        <span className="text-sm text-indigo-100">All Time</span>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
        <h3 className="text-sm opacity-75">Best Performer</h3>
        <p className="text-2xl font-bold mt-2">
          {portfolio.holdings?.[0]?.symbol || '-'}
        </p>
        <span className="text-sm text-purple-100">
          +{((portfolio.holdings?.[0]?.current_price / portfolio.holdings?.[0]?.purchase_price - 1) * 100).toFixed(2)}%
        </span>
      </div>

      <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
        <h3 className="text-sm opacity-75">Today's Change</h3>
        <p className="text-2xl font-bold mt-2">
          +$123.45
        </p>
        <span className="text-sm text-pink-100">+1.2%</span>
      </div>
    </div>
  );
};

export default QuickStats;