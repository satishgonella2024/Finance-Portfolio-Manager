#!/bin/bash
echo "🧹 Cleaning up monitoring stack..."

# Uninstall Prometheus stack
helm uninstall prometheus --namespace monitoring || true

# Delete namespace
kubectl delete namespace monitoring --grace-period=0 --force || true

echo "✅ Cleanup completed!"
