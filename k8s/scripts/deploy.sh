#!/bin/bash
set -e

echo "🔄 Starting deployment process..."

# Switch to minikube's docker context
echo "🐳 Switching to minikube docker context..."
eval $(minikube docker-env)

# Build images
echo "🏗️  Building Docker images..."
cd ..
docker compose build
cd k8s

# Create namespace
echo "📁 Creating namespace..."
kubectl create namespace portfolio-app --dry-run=client -o yaml | kubectl apply -f -

# Apply resources in order
echo "💾 Applying storage and config..."
kubectl apply -f base/storage/ -n portfolio-app
kubectl apply -f base/secrets/ -n portfolio-app
kubectl apply -f base/configmaps/ -n portfolio-app

echo "⏳ Waiting for storage resources to be ready..."
sleep 10

echo "🗄️  Deploying databases and message broker..."
kubectl apply -f base/deployments/postgres-deployment.yaml -n portfolio-app
kubectl apply -f base/services/postgres-service.yaml -n portfolio-app
kubectl apply -f base/deployments/redis-deployment.yaml -n portfolio-app
kubectl apply -f base/services/redis-service.yaml -n portfolio-app
kubectl apply -f base/deployments/rabbitmq-deployment.yaml -n portfolio-app
kubectl apply -f base/services/rabbitmq-service.yaml -n portfolio-app

echo "⏳ Waiting for databases to initialize..."
sleep 20

echo "⚙️  Deploying backend services..."
kubectl apply -f base/deployments/auth-service-deployment.yaml -n portfolio-app
kubectl apply -f base/services/auth-service-service.yaml -n portfolio-app
kubectl apply -f base/deployments/portfolio-service-deployment.yaml -n portfolio-app
kubectl apply -f base/services/portfolio-service-service.yaml -n portfolio-app

echo "🖥️  Deploying frontend..."
kubectl apply -f base/deployments/frontend-deployment.yaml -n portfolio-app
kubectl apply -f base/services/frontend-service.yaml -n portfolio-app

echo "⏳ Waiting for pods to be ready..."
echo "Checking deployment status..."

# Wait for each deployment with timeout
echo "📊 Waiting for database and message broker..."
for deployment in postgres redis rabbitmq; do
    echo "Waiting for $deployment..."
    kubectl rollout status deployment/$deployment -n portfolio-app --timeout=300s || {
        echo "⚠️  $deployment deployment failed. Checking pod logs..."
        kubectl logs -n portfolio-app -l app=$deployment
        exit 1
    }
done

echo "📊 Waiting for backend services..."
for service in auth-service portfolio-service; do
    echo "Waiting for $service..."
    kubectl rollout status deployment/$service -n portfolio-app --timeout=180s
done

echo "📊 Waiting for frontend..."
kubectl rollout status deployment/frontend -n portfolio-app --timeout=180s

echo "✅ All deployments are ready!"
echo "🔌 Setting up port forwarding..."
echo "📱 Access the application at http://localhost:8080"
kubectl port-forward -n portfolio-app svc/frontend 8080:80
