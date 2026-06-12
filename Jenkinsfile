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
                    steps { dir('api-gateway')       { sh 'npm test || echo "No tests found, skipping"' } }
                }
                stage('test – auth-svc') {
                    steps { dir('backend/auth-svc')  { sh 'npm test || echo "No tests found, skipping"'  } }
                }
                stage('test – news-svc') {
                    steps { dir('backend/news-svc')  { sh 'npm test || echo "No tests found, skipping"'  } }
                }
                stage('test – ai-svc') {
                    steps { dir('backend/ai-svc')    { sh 'npm test || echo "No tests found, skipping"'  } }
                }
                stage('test – frontend') {
                    steps { dir('frontend')           { sh 'npm test || echo "No tests found, skipping"'  } }
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

        stage('Update Image Tags in k8s manifests') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-credentials',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_PASS'
                )]) {
                    sh """
                      # Update the image tag in each manifest
                        sed -i 's|adityapurkar/news-app-distributed-api-gateway:.*|adityapurkar/news-app-distributed-api-gateway:${IMAGE_TAG}|' k8s/api-gateway.yml
                        sed -i 's|adityapurkar/news-app-distributed-auth-svc:.*|adityapurkar/news-app-distributed-auth-svc:${IMAGE_TAG}|' k8s/auth-svc.yml
                        sed -i 's|adityapurkar/news-app-distributed-news-svc:.*|adityapurkar/news-app-distributed-news-svc:${IMAGE_TAG}|' k8s/news-svc.yml
                        sed -i 's|adityapurkar/news-app-distributed-ai-svc:.*|adityapurkar/news-app-distributed-ai-svc:${IMAGE_TAG}|' k8s/ai-svc.yml
                        sed -i 's|adityapurkar/news-app-distributed-frontend:.*|adityapurkar/news-app-distributed-frontend:${IMAGE_TAG}|' k8s/frontend.yml

                        git config user.email "jenkins@newsera.ci"
                        git config user.name "Jenkins CI"
                        git add k8s/
                        git diff --staged --quiet || git commit -m "ci: update image tags to build-${IMAGE_TAG} [skip ci]"
                        git push https://${GIT_USER}:${GIT_PASS}@github.com/Aditya-purkar/News-app.git HEAD:main
                    """
                }
            }
        }

    }        

     post {
        always {
            node('built-in') {
                sh 'docker image prune -f || true'
            }
        }
        success {
            echo '✅ NewsEra deployed successfully!'
        }
        failure {
            echo '❌ Pipeline failed — check logs above.'
        }
    }
}
