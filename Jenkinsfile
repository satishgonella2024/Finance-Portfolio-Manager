pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = '192.168.5.211:5000'
        NAMESPACE = 'portfolio-app'
        GIT_BRANCH = 'main'
        KUBE_CONTEXT = 'dev-cluster'  // Using Rancher RKE2 cluster
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Setup Kubernetes Context') {
            steps {
                sh """
                    kubectl config use-context ${KUBE_CONTEXT}
                    kubectl config current-context
                """
            }
        }

        stage('Build Services') {
            parallel {
                stage('Build Auth Service') {
                    steps {
                        dir('auth-service/src') {
                            sh """
                                docker build -t ${DOCKER_REGISTRY}/auth-service:${BUILD_NUMBER} .
                                docker tag ${DOCKER_REGISTRY}/auth-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/auth-service:latest
                            """
                        }
                    }
                }
                
                stage('Build Portfolio Service') {
                    steps {
                        dir('portfolio-service') {
                            sh """
                                docker build -t ${DOCKER_REGISTRY}/portfolio-service:${BUILD_NUMBER} .
                                docker tag ${DOCKER_REGISTRY}/portfolio-service:${BUILD_NUMBER} ${DOCKER_REGISTRY}/portfolio-service:latest
                            """
                        }
                    }
                }

                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            sh """
                                docker build -t ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER} .
                                docker tag ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER} ${DOCKER_REGISTRY}/frontend:latest
                            """
                        }
                    }
                }
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
                    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                    
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
                docker rmi ${DOCKER_REGISTRY}/auth-service:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_REGISTRY}/portfolio-service:${BUILD_NUMBER} || true
                docker rmi ${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER} || true
            """
            cleanWs()
        }
    }
}