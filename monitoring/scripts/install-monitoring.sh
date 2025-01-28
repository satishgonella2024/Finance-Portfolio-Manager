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

echo "✅ Monitoring stack installed!"
echo "🔍 Access Grafana at the LoadBalancer IP"
kubectl get svc -n monitoring prometheus-grafana -w
