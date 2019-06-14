SERVICE_TAG = "frontend"
SERVICE_NAME = "grud-${SERVICE_TAG}"

DEPLOY_DIR = 'build/deploy'

IMAGE_NAME=SERVICE_NAME
ARCHIVE_FILENAME="${IMAGE_NAME}.tar.gz"

pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  stages {
    stage('Build docker image') {
      steps {
        sh "mkdir -p ${DEPLOY_DIR}"
        sh "docker build -t ${IMAGE_NAME} -f Dockerfile --rm ."
        sh "docker save ${IMAGE_NAME} | gzip -c > ${DEPLOY_DIR}/${ARCHIVE_FILENAME}"
      }
    }

    stage('Artifacts') {
      steps {
        archiveArtifacts artifacts: "${DEPLOY_DIR}/${ARCHIVE_FILENAME}", fingerprint: true
      }
    }
  }
}
