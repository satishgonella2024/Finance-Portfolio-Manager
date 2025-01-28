// auth-service/src/app.js
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import promBundle from 'express-prom-bundle';
import promClient from 'prom-client';

// ================ PROMETHEUS METRICS CONFIGURATION ================
// Initialize prometheus registry
const register = new promClient.Registry();
console.log('Prometheus Registry initialized');

// Initialize metrics
let authCounter;
let authDuration;
let dbConnectionGauge;

try {
    // Configure default metrics with prefix to avoid collisions
    promClient.collectDefaultMetrics({
        register,
        prefix: 'auth_service_',
        timestamps: true,
    });
    console.log('Default metrics collection configured');

    // Custom metrics definitions
    authCounter = new promClient.Counter({
        name: 'auth_requests_total',
        help: 'Total number of authentication requests',
        labelNames: ['type', 'status'],
        registers: [register]
    });

    authDuration = new promClient.Histogram({
        name: 'auth_request_duration_seconds',
        help: 'Authentication request duration',
        labelNames: ['type', 'operation'],
        registers: [register],
        buckets: [0.1, 0.5, 1, 2, 5]
    });

    dbConnectionGauge = new promClient.Gauge({
        name: 'db_connections_total',
        help: 'Number of active database connections',
        registers: [register]
    });

    console.log('Custom metrics initialized');
} catch (error) {
    console.error('Error initializing metrics:', error);
}

// ================ APPLICATION CONFIGURATION ================
const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ================ DATABASE CONFIGURATION ================
const pgPool = new pg.Pool({
   host: process.env.DB_HOST || 'localhost',
   database: process.env.DB_NAME || 'portfolio_db',
   user: process.env.DB_USER || 'postgres',
   password: process.env.DB_PASSWORD || 'postgres',
});

// Track database connection metrics
pgPool.on('acquire', () => {
   try {
       dbConnectionGauge.inc();
       console.debug('Database connection acquired, gauge incremented');
   } catch (error) {
       console.error('Error incrementing db connection gauge:', error);
   }
});

pgPool.on('release', () => {
   try {
       dbConnectionGauge.dec();
       console.debug('Database connection released, gauge decremented');
   } catch (error) {
       console.error('Error decrementing db connection gauge:', error);
   }
});

// ================ MIDDLEWARE CONFIGURATION ================
app.use(cors());
app.use(express.json());

// Configure metrics middleware
const metricsMiddleware = promBundle({
   includeMethod: true,
   includePath: true,
   includeStatusCode: true,
   promRegistry: register,
   customLabels: { service: 'auth-service' },
   normalizePath: [['^/auth/', '/auth']],  // Normalize auth paths for better metrics aggregation
});

app.use(metricsMiddleware);

// ================ DATABASE INITIALIZATION ================
const initDb = async () => {
   try {
       await pgPool.query(`
           CREATE TABLE IF NOT EXISTS users (
               id SERIAL PRIMARY KEY,
               email VARCHAR(255) UNIQUE NOT NULL,
               password VARCHAR(255) NOT NULL,
               created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
           );
       `);
       console.log('Database initialized successfully');
   } catch (error) {
       console.error('Database initialization error:', error);
       // Consider process.exit(1) in production if DB init fails
   }
};

initDb();

// ================ AUTH ENDPOINTS ================

// Register endpoint
app.post('/register', async (req, res) => {
   const end = authDuration.startTimer({ type: 'auth', operation: 'register' });
   const { email, password } = req.body;
   
   try {
       // Input validation
       if (!email || !password) {
           authCounter.inc({ type: 'register', status: 'invalid_input' });
           end();
           return res.status(400).json({ error: 'Email and password are required' });
       }

       const userExists = await pgPool.query(
           'SELECT * FROM users WHERE email = $1',
           [email]
       );
       
       if (userExists.rows.length > 0) {
           authCounter.inc({ type: 'register', status: 'failed_user_exists' });
           end();
           return res.status(400).json({ error: 'User already exists' });
       }

       const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(password, salt);

       const result = await pgPool.query(
           'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
           [email, hashedPassword]
       );

       const token = jwt.sign(
           { userId: result.rows[0].id },
           JWT_SECRET,
           { expiresIn: '24h' }
       );

       authCounter.inc({ type: 'register', status: 'success' });
       end();

       res.status(201).json({
           token,
           user: {
               id: result.rows[0].id,
               email: result.rows[0].email
           }
       });
   } catch (error) {
       console.error('Registration error:', error);
       authCounter.inc({ type: 'register', status: 'error' });
       end();
       res.status(500).json({ error: 'Internal server error during registration' });
   }
});

// Login endpoint
app.post('/login', async (req, res) => {
   const end = authDuration.startTimer({ type: 'auth', operation: 'login' });
   const { email, password } = req.body;

   try {
       // Input validation
       if (!email || !password) {
           authCounter.inc({ type: 'login', status: 'invalid_input' });
           end();
           return res.status(400).json({ error: 'Email and password are required' });
       }

       const result = await pgPool.query(
           'SELECT * FROM users WHERE email = $1',
           [email]
       );

       if (result.rows.length === 0) {
           authCounter.inc({ type: 'login', status: 'failed_no_user' });
           end();
           return res.status(401).json({ error: 'Invalid credentials' });
       }

       const user = result.rows[0];
       const validPassword = await bcrypt.compare(password, user.password);
       
       if (!validPassword) {
           authCounter.inc({ type: 'login', status: 'failed_invalid_password' });
           end();
           return res.status(401).json({ error: 'Invalid credentials' });
       }

       const token = jwt.sign(
           { userId: user.id },
           JWT_SECRET,
           { expiresIn: '24h' }
       );

       authCounter.inc({ type: 'login', status: 'success' });
       end();

       res.json({
           token,
           user: {
               id: user.id,
               email: user.email
           }
       });
   } catch (error) {
       console.error('Login error:', error);
       authCounter.inc({ type: 'login', status: 'error' });
       end();
       res.status(500).json({ error: 'Internal server error during login' });
   }
});

// ================ JWT MIDDLEWARE ================
export const verifyToken = (req, res, next) => {
   const end = authDuration.startTimer({ type: 'auth', operation: 'verify_token' });
   const token = req.header('Authorization')?.replace('Bearer ', '');
   
   if (!token) {
       authCounter.inc({ type: 'verify_token', status: 'failed_no_token' });
       end();
       return res.status(401).json({ error: 'Access denied' });
   }
   
   try {
       const verified = jwt.verify(token, JWT_SECRET);
       req.user = verified;
       authCounter.inc({ type: 'verify_token', status: 'success' });
       end();
       next();
   } catch (error) {
       console.error('Token verification error:', error);
       authCounter.inc({ type: 'verify_token', status: 'invalid_token' });
       end();
       res.status(401).json({ error: 'Invalid token' });
   }
};

// ================ PROTECTED ROUTES ================
app.get('/me', verifyToken, async (req, res) => {
   const end = authDuration.startTimer({ type: 'auth', operation: 'get_profile' });
   try {
       const result = await pgPool.query(
           'SELECT id, email FROM users WHERE id = $1',
           [req.user.userId]
       );

       if (result.rows.length === 0) {
           authCounter.inc({ type: 'get_profile', status: 'not_found' });
           end();
           return res.status(404).json({ error: 'User not found' });
       }

       authCounter.inc({ type: 'get_profile', status: 'success' });
       end();
       res.json(result.rows[0]);
   } catch (error) {
       console.error('Profile retrieval error:', error);
       authCounter.inc({ type: 'get_profile', status: 'error' });
       end();
       res.status(500).json({ error: 'Internal server error retrieving profile' });
   }
});

// ================ SERVER STARTUP ================
app.listen(port, () => {
   console.log(`Auth service running on port ${port}`);
   console.log('Metrics available at /metrics endpoint');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
   console.error('Uncaught Exception:', error);
   // In production, you might want to implement graceful shutdown here
});

process.on('unhandledRejection', (error) => {
   console.error('Unhandled Rejection:', error);
   // In production, you might want to implement graceful shutdown here
});