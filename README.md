# Finance Portfolio Manager

A microservices-based application for managing financial portfolios.

## Services

- **Frontend**: React-based user interface
- **Auth Service**: Handles user authentication and authorization
- **Portfolio Service**: Manages portfolio data and operations
- **Supporting Services**: PostgreSQL, Redis, RabbitMQ

## Getting Started

### Prerequisites

- Docker
- Docker Compose
- Node.js (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/satishgonella2024/Finance-Portfolio-Manager.git
cd Finance-Portfolio-Manager
```

2. Start the services:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:80
- Auth Service: http://localhost:4000
- Portfolio Service: http://localhost:3000

### Development

Each service can be developed independently:

```bash
# Frontend
cd frontend
npm install
npm run dev

# Auth Service
cd auth-service
npm install
npm run dev

# Portfolio Service
cd portfolio-service
npm install
npm run dev
```

## Project Structure

```
.
├── auth-service/       # Authentication service
├── frontend/          # React frontend
├── portfolio-service/ # Portfolio management service
├── docker-compose.yml # Docker composition
└── README.md         # This file
```

## Features

- User Authentication
- Portfolio Management
- Real-time Price Updates
- Performance Analytics

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request