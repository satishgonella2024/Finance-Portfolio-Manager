#!/bin/bash
set -e

echo "🔧 Installing Monitoring Stack..."

# Create namespace
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install prometheus-operator
echo "📊 Installing Prometheus Operator..."
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  -f ../base/prometheus-operator/values.yaml

# Wait for deployments
echo "⏳ Waiting for components to be ready..."
kubectl -n monitoring wait --for=condition=ready pod -l "release=prometheus" --timeout=300s

echo "✅ Monitoring stack installed successfully!"
echo "🔍 Grafana: http://$(kubectl get svc -n monitoring prometheus-grafana -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
echo "🔍 Prometheus: http://$(kubectl get svc -n monitoring prometheus-kube-prometheus-prometheus -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):9090"
