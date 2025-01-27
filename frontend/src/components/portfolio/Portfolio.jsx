import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import StockChart from '../StockChart';
import AlertsButton from '../AlertsButton';
import ExportButton from '../ExportButton';
import QuickStats from './QuickStats';

function Portfolio() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newHolding, setNewHolding] = useState({ symbol: '', shares: '', price: '' });
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  useEffect(() => {
    if (user) {
      fetchPortfolios();
      const interval = setInterval(fetchPortfolios, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPortfolios();
      setPortfolios(data);
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      setError('Failed to fetch portfolios. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async (e) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;
    
    try {
      setError(null);
      await api.createPortfolio(newPortfolioName);
      setNewPortfolioName('');
      await fetchPortfolios();
    } catch (error) {
      console.error('Error creating portfolio:', error);
      setError('Failed to create portfolio. Please try again.');
    }
  };

  const addHolding = async (e, portfolioId) => {
    e.preventDefault();
    if (!newHolding.symbol || !newHolding.shares || !newHolding.price) return;
    
    try {
      setError(null);
      await api.addHolding(portfolioId, newHolding);
      setNewHolding({ symbol: '', shares: '', price: '' });
      await fetchPortfolios();
    } catch (error) {
      console.error('Error adding holding:', error);
      setError('Failed to add holding. Please try again.');
    }
  };

  const deleteHolding = async (portfolioId, holdingId) => {
    if (!confirm('Are you sure you want to delete this holding?')) return;
    
    try {
      setError(null);
      await api.deleteHolding(portfolioId, holdingId);
      await fetchPortfolios();
    } catch (error) {
      console.error('Error deleting holding:', error);
      setError('Failed to delete holding. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Please log in to view your portfolios</h2>
          <p className="mt-2 text-sm text-gray-600">You need to be logged in to access this page.</p>
        </div>
      </div>
    );
  }

  const renderHoldingsTable = (portfolio) => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Purchase Price</th>
          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current Price</th>
          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Alerts</th>
          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {portfolio.holdings?.length > 0 ? (
          portfolio.holdings.map(holding => {
            const gainLoss = (holding.current_price - holding.purchase_price) * holding.shares;
            const gainLossPercent = ((holding.current_price - holding.purchase_price) / holding.purchase_price) * 100;

            return (
              <tr key={holding.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{holding.symbol}</td>
                <td className="px-4 py-2 text-right">{Number(holding.shares).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">${Number(holding.purchase_price).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">${Number(holding.current_price).toFixed(2)}</td>
                <td className={`px-4 py-2 text-right ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {gainLoss >= 0 ? '+' : ''}{gainLoss.toFixed(2)} ({gainLossPercent.toFixed(2)}%)
                </td>
                <td className="px-4 py-2 text-center">
                  <AlertsButton symbol={holding.symbol} currentPrice={holding.current_price} />
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => deleteHolding(portfolio.id, holding.id)}
                    className="text-red-600 hover:text-red-800 text-sm">
                    Delete
                  </button>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
              No holdings yet
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-6">
      {/* Create Portfolio Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Create New Portfolio</h2>
        <form onSubmit={createPortfolio} className="flex gap-2">
          <input
            type="text"
            value={newPortfolioName}
            onChange={(e) => setNewPortfolioName(e.target.value)}
            placeholder="Portfolio Name"
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Portfolio
          </button>
        </form>
      </div>

      {/* Portfolios List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        portfolios.map(portfolio => (
          <div key={portfolio.id} className="bg-white rounded-lg shadow">
            <div className="p-6">
              <QuickStats portfolio={portfolio} />
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-blue-600">{portfolio.name}</h3>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(portfolio.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <ExportButton portfolio={portfolio} />
                  <button
                    onClick={() => setSelectedPortfolio(
                      selectedPortfolio === portfolio.id ? null : portfolio.id
                    )}
                    className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
                  >
                    {selectedPortfolio === portfolio.id ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
              </div>
            </div>

            {selectedPortfolio === portfolio.id && (
              <div className="border-t">
                <div className="p-6 space-y-6">
                  {/* Add Holding Form */}
                  <div className="bg-gray-50 rounded p-4">
                    <h3 className="text-sm font-medium mb-4">Add New Holding</h3>
                    <form onSubmit={(e) => addHolding(e, portfolio.id)} 
                      className="grid grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={newHolding.symbol}
                        onChange={(e) => setNewHolding({
                          ...newHolding, 
                          symbol: e.target.value.toUpperCase()
                        })}
                        placeholder="Symbol (e.g. AAPL)"
                        className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={newHolding.shares}
                        onChange={(e) => setNewHolding({
                          ...newHolding, 
                          shares: e.target.value
                        })}
                        placeholder="Number of shares"
                        className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                      <input
                        type="number"
                        value={newHolding.price}
                        onChange={(e) => setNewHolding({
                          ...newHolding, 
                          price: e.target.value
                        })}
                        placeholder="Purchase price"
                        className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add Holding
                      </button>
                    </form>
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white rounded border p-4">
                      <h3 className="text-sm font-medium mb-4">Portfolio Distribution</h3>
                      <div className="h-64">
                        {portfolio.holdings?.length > 0 ? (
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={portfolio.holdings.map(h => ({
                                  name: h.symbol,
                                  value: h.shares * h.current_price
                                }))}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({name, percent}) => 
                                  `${name} (${(percent * 100).toFixed(1)}%)`
                                }
                              >
                                {portfolio.holdings.map((_, index) => (
                                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            No holdings to display
                          </div>
                        )}
                      </div>
                    </div>

                    {portfolio.holdings?.[0] && (
                      <div className="bg-white rounded border p-4">
                        <h3 className="text-sm font-medium mb-4">Performance</h3>
                        <StockChart 
                          data={portfolio.holdings[0].priceHistory} 
                          symbol={portfolio.holdings[0].symbol}
                        />
                      </div>
                    )}
                  </div>

                  {/* Holdings Table */}
                  <div className="bg-white rounded border overflow-x-auto">
                    <div className="p-4">
                      <h3 className="text-sm font-medium mb-4">Holdings</h3>
                      {renderHoldingsTable(portfolio)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Portfolio;