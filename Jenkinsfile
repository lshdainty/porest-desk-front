pipeline {
    agent any
    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['dev', 'prod'], description: '배포 환경')
        string(name: 'GIT_REF', defaultValue: 'main', description: '브랜치 또는 태그 (main, v1.0.0)')
    }
    environment {
        REPO_URL = "https://github.com/lshdainty/porest-desk-front.git"
        IMAGE_NAME = "porest-desk-front"
        SRC_DIR = "${env.POREST_BASE_DIR}/src/desk-front"
        ENV_SRC_DIR = "${env.POREST_BASE_DIR}/frontend"
        APP_NAME = "desk"
        CONTAINER_NAME = "desk-frontend"
    }
    stages {
        stage('Checkout') {
            steps {
                dir("${SRC_DIR}") {
                    git branch: "${params.GIT_REF}",
                        url: "${REPO_URL}",
                        credentialsId: 'github-credentials'
                }
            }
        }
        stage('Prepare Env') {
            steps {
                dir("${SRC_DIR}") {
                    sh "cp ${ENV_SRC_DIR}/${params.DEPLOY_ENV}/${APP_NAME}/${params.DEPLOY_ENV}.env .env.production"
                }
            }
        }
        stage('Docker Build') {
            steps {
                dir("${SRC_DIR}") {
                    sh "docker build -t ${IMAGE_NAME}:latest ."
                }
            }
        }
        stage('Deploy to Dev') {
            when { expression { params.DEPLOY_ENV == 'dev' } }
            steps {
                echo "Deploying Desk Frontend to Development..."
                sh """
                    docker stop ${CONTAINER_NAME}-dev || true
                    docker rm ${CONTAINER_NAME}-dev || true
                    docker run -d --name ${CONTAINER_NAME}-dev \
                        --hostname ${CONTAINER_NAME}-dev \
                        --network ${env.DEV_NETWORK} \
                        ${IMAGE_NAME}:latest
                """
            }
        }
        stage('Approval for Prod') {
            when { expression { params.DEPLOY_ENV == 'prod' } }
            steps {
                script {
                    input(
                        id: 'DeployToProd',
                        message: "운영 서버에 배포하시겠습니까?",
                        ok: '배포'
                    )
                }
            }
        }
        stage('Deploy to Prod') {
            when { expression { params.DEPLOY_ENV == 'prod' } }
            steps {
                echo "Deploying Desk Frontend to Production..."
                sh """
                    docker stop ${CONTAINER_NAME}-prod || true
                    docker rm ${CONTAINER_NAME}-prod || true
                    docker run -d --name ${CONTAINER_NAME}-prod \
                        --hostname ${CONTAINER_NAME}-prod \
                        --network ${env.PROD_NETWORK} \
                        ${IMAGE_NAME}:latest
                """
            }
        }
    }
}
