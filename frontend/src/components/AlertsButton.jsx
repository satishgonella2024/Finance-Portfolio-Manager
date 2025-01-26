// frontend/src/components/AlertsButton.jsx
import React, { useState } from 'react';

const AlertsButton = ({ symbol, currentPrice }) => {
  const [showModal, setShowModal] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ price: '', type: 'above' });

  const addAlert = (e) => {
    e.preventDefault();
    if (!newAlert.price) return;
    
    setAlerts([...alerts, {
      id: Date.now(),
      symbol,
      price: parseFloat(newAlert.price),
      type: newAlert.type
    }]);
    setNewAlert({ price: '', type: 'above' });
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Set Alert
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Price Alerts for {symbol}
              </h3>
              
              <form onSubmit={addAlert} className="space-y-4">
                <div className="flex gap-2">
                  <select
                    value={newAlert.type}
                    onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                  </select>
                  <input
                    type="number"
                    value={newAlert.price}
                    onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                    placeholder="Price"
                    step="0.01"
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="mt-6 space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600">
                      Alert when price goes {alert.type} ${alert.price}
                    </span>
                    <button
                      onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                      className="text-sm text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AlertsButton;