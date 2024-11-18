@Library('campudus-jenkins-shared-lib') _

final String BRANCH = params.BRANCH
final boolean NOTIFY_SLACK_ON_FAILURE = params.NOTIFY_SLACK_ON_FAILURE
final boolean NOTIFY_SLACK_ON_SUCCESS = params.NOTIFY_SLACK_ON_SUCCESS

final String CLEAN_BRANCH_NAME = BRANCH ? BRANCH.replaceAll("[\\.\\_\\#]", "-").tokenize('/').last() : ""

final boolean isBranch = CLEAN_BRANCH_NAME != "master"

final String DEPLOY_DIR = 'build/deploy'
final String TEST_COVERAGE_FILE = 'output/coverage/junit.xml'

final String IMAGE_NAME = "campudus/grud-frontend"
final String IMAGE_TAG = CLEAN_BRANCH_NAME && isBranch ? CLEAN_BRANCH_NAME : "latest"
final String ARCHIVE_FILENAME_DIST = "grud-frontend-dist.tar.gz"
final GString DOCKER_BASE_IMAGE_TAG = "build-${BUILD_NUMBER}"

final String SLACK_CHANNEL = "#grud"

pipeline {
  agent { label 'agent1' }

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 5, unit: 'MINUTES')
  }

  triggers {
    githubPush()
  }

  environment {
    COMMIT_INFO = sh(returnStdout: true, script: './getCommitHash.sh').trim()
    GIT_HASH = sh(returnStdout: true, script: 'git log -1 --pretty=%h').trim()
    BUILD_DATE = sh(returnStdout: true, script: 'date \"+%Y-%m-%d %H:%M:%S\"').trim()
    GIT_COMMIT_DATE = sh(returnStdout: true, script: "git show -s --format=%ci").trim()
  }

  parameters {
    booleanParam(name: 'NOTIFY_SLACK_ON_FAILURE', defaultValue: true, description: '')
    booleanParam(name: 'NOTIFY_SLACK_ON_SUCCESS', defaultValue: false, description: '')
  }

  stages {
    stage('Init Build') {
      steps {
        buildName "#${env.BUILD_NUMBER} ${isBranch ? CLEAN_BRANCH_NAME : ''}".trim()

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
          --label "GIT_COMMIT=${GIT_COMMIT}" \
          --label "GIT_COMMIT_DATE=${GIT_COMMIT_DATE}" \
          --label "BUILD_DATE=${BUILD_DATE}" \
          -t ${IMAGE_NAME}:${IMAGE_TAG} \
          -f Dockerfile --rm .
        """
      }
    }

    stage('Artifacts') {
      steps {
        archiveArtifacts artifacts: "${DEPLOY_DIR}/${ARCHIVE_FILENAME_DIST}", fingerprint: true
      }
    }

    stage('Push to docker registry') {
      steps {
        withDockerRegistry([credentialsId: "dockerhub", url: ""]) {
          sh "docker push ${IMAGE_NAME}:${DOCKER_BASE_IMAGE_TAG}-${GIT_HASH}"
          sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
        }
      }
    }
  }

  post {
    success {
      wrap([$class: 'BuildUser']) {
        script {
          if (NOTIFY_SLACK_ON_SUCCESS) {
            final String logParams = [
                BRANCH ? "BRANCH=${BRANCH}" : null,
                "image: ${IMAGE_NAME}:${IMAGE_TAG}",
            ].minus(null).join(' ')

            slackOk(channel: SLACK_CHANNEL, message: "${logParams}")
          }
        }
      }
    }

    failure {
      wrap([$class: 'BuildUser']) {
        script {
          if (NOTIFY_SLACK_ON_FAILURE) {
            final String logParams = [
                BRANCH ? "BRANCH=${BRANCH}" : null,
            ].minus(null).join(' ')

            slackError(channel: SLACK_CHANNEL, message: "${logParams}")
          }
        }
      }
    }
  }
}
