SERVICE_TAG = "frontend"
SERVICE_NAME = "grud-${SERVICE_TAG}"

DEPLOY_DIR = 'build/deploy'

IMAGE_NAME=SERVICE_NAME
ARCHIVE_FILENAME_DOCKER="${IMAGE_NAME}-docker.tar.gz"
ARCHIVE_FILENAME_DIST="${IMAGE_NAME}-dist.tar.gz"

pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {
    stage('Init Build') {
      steps {
        sh "mkdir -p ${DEPLOY_DIR}"
      }
    }

    stage('Build dist') {
      steps {
        script {
          def image = docker.build("${IMAGE_NAME}builder", "--target build -f Dockerfile .")

          image.inside {
            /*
            * Jenkins Docker Plugin automatically mounts WORKSPACE on host to the same directory within the container.
            * Also, we need to explicitly use the defined BUILDER_WORKING_DIRECTORY
            * because Jenkins runs the docker container automatically within the WORKSPACE directory.
            */
            sh "cd /usr/app && ls -la && tar -czf ${WORKSPACE}/${DEPLOY_DIR}/${ARCHIVE_FILENAME_DIST} node_modules out package.json"
          }
        }
      }
    }

    stage('Build docker image') {
      steps {
        sh "docker build -t ${IMAGE_NAME} -f Dockerfile --rm ."
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
}
