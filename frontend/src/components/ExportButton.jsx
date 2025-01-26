// frontend/src/components/ExportButton.jsx
import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ExportButton = ({ portfolio }) => {
  const exportCSV = () => {
    const headers = ['Symbol', 'Shares', 'Purchase Price', 'Current Price', 'Gain/Loss', 'Value'];
    const rows = portfolio.holdings.map(h => {
      const gainLoss = (h.current_price - h.purchase_price) * h.shares;
      return [
        h.symbol,
        h.shares.toFixed(2),
        h.purchase_price.toFixed(2),
        h.current_price.toFixed(2),
        gainLoss.toFixed(2),
        (h.shares * h.current_price).toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${portfolio.name}_portfolio.csv`;
    a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(portfolio.name, 14, 15);
    
    // Portfolio Info
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
    doc.text(`Total Value: $${portfolio.holdings.reduce((sum, h) => 
      sum + (h.shares * h.current_price), 0).toFixed(2)}`, 14, 32);

    // Holdings Table
    const tableData = portfolio.holdings.map(h => {
      const gainLoss = (h.current_price - h.purchase_price) * h.shares;
      return [
        h.symbol,
        h.shares.toFixed(2),
        `$${h.purchase_price.toFixed(2)}`,
        `$${h.current_price.toFixed(2)}`,
        `$${gainLoss.toFixed(2)}`,
        `$${(h.shares * h.current_price).toFixed(2)}`
      ];
    });

    doc.autoTable({
      startY: 40,
      head: [['Symbol', 'Shares', 'Purchase', 'Current', 'Gain/Loss', 'Value']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [63, 70, 229],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
      },
    });

    doc.save(`${portfolio.name}_portfolio.pdf`);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={exportCSV}
        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Export CSV
      </button>
      <button
        onClick={exportPDF}
        className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Export PDF
      </button>
    </div>
  );
};

export default ExportButton;