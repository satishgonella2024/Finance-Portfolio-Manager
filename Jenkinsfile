pipeline {
    agent any

    environment {
        DOCKER_HUB_USERNAME = 'satish2024'  // Your Docker Hub username
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
                    
                    # Tag services for Docker Hub
                    docker tag portfolio-microservices_auth-service ${DOCKER_HUB_USERNAME}/auth-service:${BUILD_NUMBER}
                    docker tag portfolio-microservices_auth-service ${DOCKER_HUB_USERNAME}/auth-service:latest
                    
                    docker tag portfolio-microservices_portfolio-service ${DOCKER_HUB_USERNAME}/portfolio-service:${BUILD_NUMBER}
                    docker tag portfolio-microservices_portfolio-service ${DOCKER_HUB_USERNAME}/portfolio-service:latest
                    
                    docker tag portfolio-microservices_frontend ${DOCKER_HUB_USERNAME}/frontend:${BUILD_NUMBER}
                    docker tag portfolio-microservices_frontend ${DOCKER_HUB_USERNAME}/frontend:latest
                """
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_HUB_USERNAME', passwordVariable: 'DOCKER_HUB_PASSWORD')]) {
                    sh """
                        # Log in to Docker Hub
                        echo $DOCKER_HUB_PASSWORD | docker login -u $DOCKER_HUB_USERNAME --password-stdin
                        
                        # Push images to Docker Hub
                        docker push ${DOCKER_HUB_USERNAME}/auth-service:${BUILD_NUMBER}
                        docker push ${DOCKER_HUB_USERNAME}/auth-service:latest
                        docker push ${DOCKER_HUB_USERNAME}/portfolio-service:${BUILD_NUMBER}
                        docker push ${DOCKER_HUB_USERNAME}/portfolio-service:latest
                        docker push ${DOCKER_HUB_USERNAME}/frontend:${BUILD_NUMBER}
                        docker push ${DOCKER_HUB_USERNAME}/frontend:latest
                    """
                }
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
                    
                    # Update deployment image tags
                    sed -i 's|image:.*auth-service.*|image: ${DOCKER_HUB_USERNAME}/auth-service:${BUILD_NUMBER}|' base/deployments/auth-service-deployment.yaml
                    sed -i 's|image:.*portfolio-service.*|image: ${DOCKER_HUB_USERNAME}/portfolio-service:${BUILD_NUMBER}|' base/deployments/portfolio-service-deployment.yaml
                    sed -i 's|image:.*frontend.*|image: ${DOCKER_HUB_USERNAME}/frontend:${BUILD_NUMBER}|' base/deployments/frontend-deployment.yaml
                    
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
                docker rmi ${DOCKER_HUB_USERNAME}/auth-service:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_HUB_USERNAME}/auth-service:latest || true
                docker rmi ${DOCKER_HUB_USERNAME}/portfolio-service:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_HUB_USERNAME}/portfolio-service:latest || true
                docker rmi ${DOCKER_HUB_USERNAME}/frontend:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_HUB_USERNAME}/frontend:latest || true
                docker rmi portfolio-microservices_auth-service || true
                docker rmi portfolio-microservices_portfolio-service || true
                docker rmi portfolio-microservices_frontend || true
            """
            cleanWs()
        }
    }
}