# Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Finance Portfolio Manager application.

## Directory Structure

```
k8s/
├── base/           # Base configurations
├── local/          # Local development overlays
├── eks/            # AWS EKS overlays (TODO)
└── overlays/
    └── dev/        # Development environment overlays
```

## Local Development

1. Start Minikube:
```bash
minikube start
```

2. Build and load Docker images:
```bash
# From project root
eval $(minikube docker-env)
docker-compose build
```

3. Deploy to local Minikube:
```bash
kubectl apply -k k8s/local
```

4. Access the application:
```bash
# Get the URL
minikube service frontend -n finance-portfolio-local --url
```

## Development Environment

Deploy to development environment:
```bash
kubectl apply -k k8s/overlays/dev
```

## Components

- Frontend: React application
- Auth Service: Authentication service
- Portfolio Service: Portfolio management service
- PostgreSQL: Database
- Redis: Caching
- RabbitMQ: Message broker

## Configurations

- All sensitive data is stored in Kubernetes secrets
- Services use ClusterIP by default
- Frontend service uses LoadBalancer/NodePort depending on environment
- Persistent storage for databases and message broker

## Monitoring and Scaling

TODO: Add monitoring and scaling configurations