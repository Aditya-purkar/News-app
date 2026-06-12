pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'adityapurkar'   
        IMAGE_TAG       = "${BUILD_NUMBER}"

        GNEWS_API_KEY    = credentials('GNEWS_API_KEY')
        NEWSDATA_API_KEY = credentials('NEWSDATA_API_KEY')
        GEMINI_API_KEY   = credentials('GEMINI_API_KEY')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('api-gateway') {
                    steps { dir('api-gateway')       { sh 'npm ci' } }
                }
                stage('auth-svc') {
                    steps { dir('backend/auth-svc')  { sh 'npm ci' } }
                }
                stage('news-svc') {
                    steps { dir('backend/news-svc')  { sh 'npm ci' } }
                }
                stage('ai-svc') {
                    steps { dir('backend/ai-svc')    { sh 'npm ci' } }
                }
                stage('frontend') {
                    steps { dir('frontend')           { sh 'npm ci' } }
                }
            }
        }

        stage('Run Tests') {
            parallel {
                stage('test – api-gateway') {
                    steps { dir('api-gateway')       { sh 'npm test --if-present' } }
                }
                stage('test – auth-svc') {
                    steps { dir('backend/auth-svc')  { sh 'npm test --if-present' } }
                }
                stage('test – news-svc') {
                    steps { dir('backend/news-svc')  { sh 'npm test --if-present' } }
                }
                stage('test – ai-svc') {
                    steps { dir('backend/ai-svc')    { sh 'npm test --if-present' } }
                }
                stage('test – frontend') {
                    steps { dir('frontend')           { sh 'npm test --if-present' } }
                }
            }
        }

        stage('Docker Build') {
            steps {
                sh """
                    docker build -t ${DOCKER_REGISTRY}/newsera-api-gateway:${IMAGE_TAG} ./api-gateway
                    docker build -t ${DOCKER_REGISTRY}/newsera-auth-svc:${IMAGE_TAG}    ./backend/auth-svc
                    docker build -t ${DOCKER_REGISTRY}/newsera-news-svc:${IMAGE_TAG}    ./backend/news-svc
                    docker build -t ${DOCKER_REGISTRY}/newsera-ai-svc:${IMAGE_TAG}      ./backend/ai-svc
                    docker build -t ${DOCKER_REGISTRY}/newsera-frontend:${IMAGE_TAG}    ./frontend
                    docker build -t ${DOCKER_REGISTRY}/newsera-nginx:${IMAGE_TAG}       ./nginx
                """
            }
        }

        stage('Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub-credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                        docker push ${DOCKER_REGISTRY}/newsera-api-gateway:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/newsera-auth-svc:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/newsera-news-svc:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/newsera-ai-svc:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/newsera-frontend:${IMAGE_TAG}
                        docker push ${DOCKER_REGISTRY}/newsera-nginx:${IMAGE_TAG}

                        docker logout
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            environment {
                KUBECONFIG = credentials('kubernetes-cluster-config')
            }
            steps {
                sh """
                    kubectl create secret generic newsera-secrets \
                      --from-literal=GNEWS_API_KEY=${GNEWS_API_KEY} \
                      --from-literal=NEWSDATA_API_KEY=${NEWSDATA_API_KEY} \
                      --from-literal=GEMINI_API_KEY=${GEMINI_API_KEY} \
                      --dry-run=client -o yaml | kubectl apply -f -

                    kubectl apply -f k8s/ --recursive

                    kubectl rollout status deployment/api-gateway --timeout=2m
                    kubectl rollout status deployment/auth-svc    --timeout=2m
                    kubectl rollout status deployment/news-svc    --timeout=2m
                    kubectl rollout status deployment/ai-svc      --timeout=2m
                    kubectl rollout status deployment/frontend     --timeout=2m
                """
            }
        }

    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
        success {
            echo '✅ NewsEra deployed successfully!'
        }
        failure {
            echo '❌ Pipeline failed — check logs above.'
        }
    }
}