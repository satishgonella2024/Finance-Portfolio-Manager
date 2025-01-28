pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = '192.168.5.211:5000'
        NAMESPACE = 'portfolio-app'
        GIT_BRANCH = 'main'
        KUBE_CONTEXT = 'dev-cluster'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Services') {
            steps {
                sh """
                    # Build all services using docker-compose
                    docker-compose build
                    
                    # Tag services with correct names (using portfolio-microservices prefix)
                    docker tag portfolio-microservices_auth-service ${DOCKER_REGISTRY}/auth-service:${BUILD_NUMBER}
                    docker tag portfolio-microservices_auth-service ${DOCKER_REGISTRY}/auth-service:latest
                    
                    docker tag portfolio-microservices_portfolio-service ${DOCKER_REGISTRY}/portfolio-service:${BUILD_NUMBER}
                    docker tag portfolio-microservices_portfolio-service ${DOCKER_REGISTRY}/portfolio-service:latest
                    
                    docker tag portfolio-microservices_frontend ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER}
                    docker tag portfolio-microservices_frontend ${DOCKER_REGISTRY}/frontend:latest
                """
            }
        }

        stage('Push Images') {
            steps {
                sh """
                    docker push ${DOCKER_REGISTRY}/auth-service:${BUILD_NUMBER}
                    docker push ${DOCKER_REGISTRY}/auth-service:latest
                    docker push ${DOCKER_REGISTRY}/portfolio-service:${BUILD_NUMBER}
                    docker push ${DOCKER_REGISTRY}/portfolio-service:latest
                    docker push ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER}
                    docker push ${DOCKER_REGISTRY}/frontend:latest
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    cd k8s
                    chmod +x scripts/*.sh
                    
                    # Create namespace if it doesn't exist
                    kubectl config use-context ${KUBE_CONTEXT}
                    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                    
                    // # Update deployment image tags
                    // sed -i 's|image:.*auth-service.*|image: '${DOCKER_REGISTRY}'/auth-service:'${BUILD_NUMBER}'|' base/deployments/auth-service-deployment.yaml
                    // sed -i 's|image:.*portfolio-service.*|image: '${DOCKER_REGISTRY}'/portfolio-service:'${BUILD_NUMBER}'|' base/deployments/portfolio-service-deployment.yaml
                    // sed -i 's|image:.*frontend.*|image: '${DOCKER_REGISTRY}'/frontend:'${BUILD_NUMBER}'|' base/deployments/frontend-deployment.yaml
                    
                    # Deploy all resources
                    ./scripts/deploy.sh
                """
            }
        }
    }

    post {
        failure {
            sh """
                if [ -d "k8s" ]; then
                    cd k8s
                    chmod +x scripts/*.sh
                    ./scripts/cleanup.sh
                fi
            """
        }
        always {
            sh """
                # Cleanup images
                docker rmi ${DOCKER_REGISTRY}/auth-service:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_REGISTRY}/auth-service:latest || true
                docker rmi ${DOCKER_REGISTRY}/portfolio-service:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_REGISTRY}/portfolio-service:latest || true
                docker rmi ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_REGISTRY}/frontend:latest || true
                docker rmi portfolio-microservices_auth-service || true
                docker rmi portfolio-microservices_portfolio-service || true
                docker rmi portfolio-microservices_frontend || true
            """
            cleanWs()
        }
    }
}