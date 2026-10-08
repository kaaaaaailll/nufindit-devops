pipeline {
  agent any

  environment {
    COMPOSE_PROJECT_NAME = 'nufindit-devops'
    TAG = "${env.BUILD_NUMBER}"
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15'))
  }

  // Automatic trigger: Jenkins checks GitHub every ~2 minutes
  triggers { pollSCM('H/2 * * * *') }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git log -1 --oneline'
      }
    }

    stage('Test') {
      steps {
        // Runs the "test" stage of each Dockerfile; a failing test stops the pipeline here
        sh 'docker build --target test -t nufindit/items-api:test ./items-api'
        sh 'docker build --target test -t nufindit/auth-api:test ./auth-api'
      }
    }

    stage('Build Images') {
      steps {
        withCredentials([file(credentialsId: 'nufindit-env', variable: 'ENV_FILE')]) {
          sh 'cp "$ENV_FILE" .env'
          sh 'docker compose build'
        }
      }
    }

    stage('Deploy') {
      steps {
        sh 'docker compose up -d --no-build --remove-orphans'
      }
    }

    stage('Smoke Test') {
      steps {
        sh '''
          for i in $(seq 1 20); do
            if docker compose exec -T proxy wget -qO- http://127.0.0.1/ | grep -q "Build: $TAG" \
               && docker compose exec -T proxy wget -qO- http://127.0.0.1/api/items/health > /dev/null \
               && docker compose exec -T proxy wget -qO- http://127.0.0.1/api/auth/health > /dev/null; then
              echo "Smoke test passed"; exit 0
            fi
            echo "Waiting for services... ($i)"; sleep 5
          done
          echo "Smoke test failed"; exit 1
        '''
      }
    }
  }

  post {
    success { echo "NUFindIt build ${TAG} is live at http://127.0.0.1:8080" }
    failure { echo "Build ${TAG} failed. Roll back with: TAG=<previous> docker compose -p nufindit-devops up -d --no-build" }
    always  { sh 'rm -f .env' }
  }
}
