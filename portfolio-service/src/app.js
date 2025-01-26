import express from 'express';
import cors from 'cors';
import pg from 'pg';

const app = express();
const port = process.env.PORT || 3000;

const pgPool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'portfolio_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

app.use(cors());
app.use(express.json());

// Mock stock data function
const generateStockData = (symbol, days = 30) => {
  const data = [];
  const startPrice = symbol === 'AAPL' ? 180 : 
                    symbol === 'GOOG' ? 140 : 
                    symbol === 'IBM' ? 150 : 100;
  
  let currentPrice = startPrice;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Add some random price movement
    currentPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    
    data.push({
      date: date.toISOString(),
      price: parseFloat(currentPrice.toFixed(2))
    });
  }
  return data;
};

app.get('/api/portfolio', async (req, res) => {
  try {
    const portfolios = await pgPool.query(`
      SELECT p.*, 
        json_agg(json_build_object(
          'id', h.id,
          'symbol', h.symbol,
          'shares', h.shares,
          'purchase_price', h.purchase_price,
          'purchase_date', h.purchase_date
        )) as holdings
      FROM portfolios p
      LEFT JOIN holdings h ON h.portfolio_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    // Add mock stock data to each holding
    const enrichedPortfolios = portfolios.rows.map(portfolio => ({
      ...portfolio,
      holdings: portfolio.holdings[0] === null ? [] :
        portfolio.holdings.map(holding => ({
          ...holding,
          priceHistory: generateStockData(holding.symbol),
          current_price: generateStockData(holding.symbol, 0)[0].price
        }))
    }));

    res.json(enrichedPortfolios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pgPool.query(
      'INSERT INTO portfolios (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/portfolio/:id/holdings', async (req, res) => {
  const { id } = req.params;
  const { symbol, shares, price } = req.body;
  try {
    const result = await pgPool.query(
      'INSERT INTO holdings (portfolio_id, symbol, shares, purchase_price) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, symbol, shares, price]
    );
    
    // Add mock price history to the new holding
    const enrichedHolding = {
      ...result.rows[0],
      priceHistory: generateStockData(symbol),
      current_price: generateStockData(symbol, 0)[0].price
    };
    
    res.status(201).json(enrichedHolding);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/portfolio/:portfolioId/holdings/:holdingId', async (req, res) => {
  const { portfolioId, holdingId } = req.params;
  try {
    await pgPool.query(
      'DELETE FROM holdings WHERE id = $1 AND portfolio_id = $2',
      [holdingId, portfolioId]
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => console.log(`Portfolio service running on port ${port}`));