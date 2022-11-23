DEPLOY_DIR = 'build/deploy'
TEST_COVERAGE_FILE = 'output/coverage/junit.xml'

IMAGE_NAME = "campudus/grud-frontend"
LEGACY_ARCHIVE_FILENAME="grud-frontend-docker.tar.gz"
ARCHIVE_FILENAME_DIST="grud-frontend-dist.tar.gz"
DOCKER_BASE_IMAGE_TAG = "build-${BUILD_NUMBER}"


def slackParams = { GString message, String color ->
  [
    tokenCredentialId : "${env.SLACK_GRUD_INTEGRATION_ID}",
    channel           : "#grud",
    color             : color,
    message           : message
  ]
}

def getTriggeringUser = env.BUILD_USER ? env.BUILD_USER : { sh (
      script: 'git --no-pager show -s --format=%an',
      returnStdout: true
    ).trim()
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
    GIT_HASH = sh (returnStdout: true, script: 'git log -1 --pretty=%h').trim()
    BUILD_DATE = sh(returnStdout: true, script: 'date \"+%Y-%m-%d %H:%M:%S\"').trim()
    GIT_COMMIT_DATE = sh(returnStdout: true, script: "git show -s --format=%ci").trim()
  }

  stages {
    stage('Init Build') {
      steps {
        echo "Build with BUILD_ID: $COMMIT_INFO"
        sh "rm -rf build"
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
        sh """
          docker build \
          --build-arg BUILD_ID=${COMMIT_INFO} \
          --label "BRANCH_NAME=${BRANCH_NAME}" \
          --label "GIT_COMMIT=${GIT_COMMIT}" \
          --label "GIT_COMMIT_DATE=${GIT_COMMIT_DATE}" \
          --label "BUILD_DATE=${BUILD_DATE}" \
          -t ${IMAGE_NAME}:${DOCKER_BASE_IMAGE_TAG}-${GIT_HASH} \
          -t ${IMAGE_NAME}:latest \
          -f Dockerfile --rm .
        """
        sh "docker save ${IMAGE_NAME}:latest | gzip -c > ${DEPLOY_DIR}/${LEGACY_ARCHIVE_FILENAME}"
      }
    }

    stage('Artifacts') {
      steps {
        archiveArtifacts artifacts: "${DEPLOY_DIR}/${LEGACY_ARCHIVE_FILENAME}", fingerprint: true
        archiveArtifacts artifacts: "${DEPLOY_DIR}/${ARCHIVE_FILENAME_DIST}", fingerprint: true
      }
    }

    stage('Push to docker registry') {
      steps {
        withDockerRegistry([ credentialsId: "dockerhub", url: "" ]) {
          sh "docker push ${IMAGE_NAME}:${DOCKER_BASE_IMAGE_TAG}-${GIT_HASH}"
          sh "docker push ${IMAGE_NAME}:latest"
        }
      }
    }
  }

  post {
    success {
      wrap([$class: 'BuildUser']) {
        script {
          sh "echo successful"
          slackSend(slackParams("""Build successful: <${BUILD_URL}|${env.JOB_NAME} @ \
              ${env.BUILD_NUMBER}> (${getTriggeringUser()})""", "good"))
        }
      }
    }

    failure {
      wrap([$class: 'BuildUser']) {
        script {
          sh "echo failed"
          slackSend(slackParams("""Build failed: <${BUILD_URL}|${env.JOB_NAME} @ \
              ${env.BUILD_NUMBER}> (${getTriggeringUser()})""", "danger"))
        }
      }
    }
  }
}
