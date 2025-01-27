#!/bin/bash
echo "🧹 Cleaning up..."
kubectl delete namespace portfolio-app --grace-period=0 --force 2>/dev/null || true
kubectl delete pv postgres-pv --grace-period=0 --force 2>/dev/null || true

echo "⏳ Waiting for namespace termination..."
while kubectl get namespace portfolio-app >/dev/null 2>&1; do
    echo "."
    sleep 2
done
echo "✅ Cleanup completed!"
