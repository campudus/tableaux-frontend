SERVICE_TAG = "frontend"
SERVICE_NAME = "grud-${SERVICE_TAG}"

DEPLOY_DIR = 'build/deploy'
TEST_COVERAGE_FILE = 'output/coverage/junit.xml'

IMAGE_NAME=SERVICE_NAME
ARCHIVE_FILENAME_DOCKER="${IMAGE_NAME}-docker.tar.gz"
ARCHIVE_FILENAME_DIST="${IMAGE_NAME}-dist.tar.gz"

def slackParams = { GString message, String color ->
  [
    tokenCredentialId : "${env.SLACK_GRUD_INTEGRATION_ID}",
    channel           : "#grud",
    color             : color,
    message           : message
  ]
}

pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 15, unit: 'MINUTES')
  }

  environment {
    COMMIT_INFO = sh(returnStdout: true, script: './getCommitHash.sh').trim()
  }

  stages {
    stage('Init Build') {
      steps {
        echo "Build with BUILD_ID: $COMMIT_INFO"
        sh "mkdir -p ${DEPLOY_DIR}"
        sh "mkdir -p output/coverage"

        // cleanup docker
        sh 'docker rmi $(docker images -f "dangling=true" -q) || true'
        sh "docker rmi -f \$(docker images -qa --filter=reference='${IMAGE_NAME}') || true"
      }
    }

    stage('Build dist') {
      steps {
        script {
          def image = docker.build("${IMAGE_NAME}builder", "--target build -f Dockerfile . --build-arg BUILD_ID=${COMMIT_INFO}")

          image.inside {
            /*
            * Jenkins Docker Plugin automatically mounts WORKSPACE on host to the same directory within the container.
            * Also, we need to explicitly use the defined BUILDER_WORKING_DIRECTORY
            * because Jenkins runs the docker container automatically within the WORKSPACE directory.
            */
            sh "cd /usr/app && ls -la && tar -czf ${WORKSPACE}/${DEPLOY_DIR}/${ARCHIVE_FILENAME_DIST} node_modules out package.json"
            sh "cd /usr/app && ls -la && cp ${TEST_COVERAGE_FILE} ${WORKSPACE}/${TEST_COVERAGE_FILE}"
          }
        }
      }
      post {
        always {
          junit TEST_COVERAGE_FILE
        }
      }
    }

    stage('Build docker image') {
      steps {
        sh "docker build -t ${IMAGE_NAME} -f Dockerfile --rm . --build-arg BUILD_ID=${COMMIT_INFO}"
        sh "docker save ${IMAGE_NAME} | gzip -c > ${DEPLOY_DIR}/${ARCHIVE_FILENAME_DOCKER}"
      }
    }

    stage('Artifacts') {
      steps {
        archiveArtifacts artifacts: "${DEPLOY_DIR}/${ARCHIVE_FILENAME_DOCKER}", fingerprint: true
        archiveArtifacts artifacts: "${DEPLOY_DIR}/${ARCHIVE_FILENAME_DIST}", fingerprint: true
      }
    }

    stage('Cleanup') {
      steps {
        sh "rm -rf build"
      }
    }
  }

  post {
    success {
      wrap([$class: 'BuildUser']) {
        script {
          sh "echo successful"
          slackSend(slackParams("Build successful: ${env.JOB_NAME} @ ${env.BUILD_NUMBER} (${BUILD_USER})", "good"))
        }
      }
    }

    failure {
      wrap([$class: 'BuildUser']) {
        script {
          sh "echo failed"
          slackSend(slackParams("Build failed: ${env.JOB_NAME} @ ${env.BUILD_NUMBER} (${BUILD_USER})", "danger"))
        }
      }
    }
  }
}
