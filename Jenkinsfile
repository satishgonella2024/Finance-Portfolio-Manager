pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = '192.168.5.211:5000'
        NAMESPACE = 'portfolio-app'
        GIT_BRANCH = 'main'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Services') {
            parallel {
                stage('Build Auth Service') {
                    steps {
                        dir('auth-service/src') {
                            sh """
                                sudo docker build -t \${DOCKER_REGISTRY}/auth-service:\${BUILD_NUMBER} .
                                sudo docker tag \${DOCKER_REGISTRY}/auth-service:\${BUILD_NUMBER} \${DOCKER_REGISTRY}/auth-service:latest
                            """
                        }
                    }
                }
                
                stage('Build Portfolio Service') {
                    steps {
                        dir('portfolio-service') {
                            sh """
                                sudo docker build -t \${DOCKER_REGISTRY}/portfolio-service:\${BUILD_NUMBER} .
                                sudo docker tag \${DOCKER_REGISTRY}/portfolio-service:\${BUILD_NUMBER} \${DOCKER_REGISTRY}/portfolio-service:latest
                            """
                        }
                    }
                }

                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh """
                                sudo docker build -t \${DOCKER_REGISTRY}/frontend:\${BUILD_NUMBER} .
                                sudo docker tag \${DOCKER_REGISTRY}/frontend:\${BUILD_NUMBER} \${DOCKER_REGISTRY}/frontend:latest
                            """
                        }
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                sh """
                    sudo docker push \${DOCKER_REGISTRY}/auth-service:\${BUILD_NUMBER}
                    sudo docker push \${DOCKER_REGISTRY}/auth-service:latest
                    sudo docker push \${DOCKER_REGISTRY}/portfolio-service:\${BUILD_NUMBER}
                    sudo docker push \${DOCKER_REGISTRY}/portfolio-service:latest
                    sudo docker push \${DOCKER_REGISTRY}/frontend:\${BUILD_NUMBER}
                    sudo docker push \${DOCKER_REGISTRY}/frontend:latest
                """
            }
        }

        stage('Update Kubernetes Manifests') {
            steps {
                sh """
                    cd k8s
                    
                    # Update image tags in deployments
                    sed -i 's|image:.*auth-service.*|image: '\${DOCKER_REGISTRY}'/auth-service:'\${BUILD_NUMBER}'|' base/deployments/auth-service-deployment.yaml
                    sed -i 's|image:.*portfolio-service.*|image: '\${DOCKER_REGISTRY}'/portfolio-service:'\${BUILD_NUMBER}'|' base/deployments/portfolio-service-deployment.yaml
                    sed -i 's|image:.*frontend.*|image: '\${DOCKER_REGISTRY}'/frontend:'\${BUILD_NUMBER}'|' base/deployments/frontend-deployment.yaml
                """
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    cd k8s
                    chmod +x scripts/deploy.sh
                    ./scripts/deploy.sh
                """
            }
        }
    }

    post {
        failure {
            sh 'cd k8s && chmod +x scripts/cleanup.sh && ./scripts/cleanup.sh'
        }
        always {
            sh """
                sudo docker rmi \${DOCKER_REGISTRY}/auth-service:\${BUILD_NUMBER} || true
                sudo docker rmi \${DOCKER_REGISTRY}/portfolio-service:\${BUILD_NUMBER} || true
                sudo docker rmi \${DOCKER_REGISTRY}/frontend:\${BUILD_NUMBER} || true
            """
            cleanWs()
        }
    }
}