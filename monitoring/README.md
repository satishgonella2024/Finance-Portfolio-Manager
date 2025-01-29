# Monitoring Stack

## Overview
The monitoring stack provides observability for our portfolio microservices application.

## Components
- Prometheus (192.168.5.242:9090) - Metrics collection and storage
- Grafana (192.168.5.241:80) - Metrics visualization
- AlertManager - Alerting system
- Node Exporter - System metrics
- Exporters:
  - Postgres Exporter
  - Redis Exporter
  - Service metrics (auth, portfolio)

## Access
- Grafana:
  - URL: http://192.168.5.241
  - Credentials: admin/prom-operator
- Prometheus:
  - URL: http://192.168.5.242:9090
  - No authentication required

## Dashboards
1. Kubernetes Cluster Overview
   - Node resources
   - Pod status
   - System metrics

2. Database Metrics
   - PostgreSQL performance
   - Connection stats
   - Query metrics

3. Service Metrics
   - Auth service performance
   - Portfolio service metrics
   - API latencies

## Installation
```bash
cd monitoring/scripts
./install-monitoring.sh
```

## Cleanup
```bash 
cd monitoring/scripts
./cleanup-monitoring.sh
```

## Architecture
mermaidCopy
```bash
graph TD
    A[Services] -->|Expose Metrics| B[ServiceMonitors]
    B --> C[Prometheus]
    C --> D[Grafana]
    C --> E[AlertManager]
```