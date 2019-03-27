SSH_HOSTNAME = 'campudus@pexco.grud.de'
PREFIX = "demo"
SERVICE_TAG = "frontend"
SERVICE_NAME = "grud-${SERVICE_TAG}"

NAME = "${PREFIX}-${SERVICE_NAME}"
NAME_TEST = "${PREFIX}test-${SERVICE_NAME}"
PATH = "~/${PREFIX}/${NAME}"
PATH_TEST = "~/${PREFIX}/${NAME_TEST}"
DEPLOY_DIR = 'build/deploy'
CREDENTIAL = 'f61bb13e-88af-4aa1-aefd-d95a4a8ce033'

switch(params.STAGE) {
  case "PRODUCTION":
    STAGE_ENV = 'production'
    REMOTE_PATH = PATH
    FILE_NAME = NAME
    break
  default:
    STAGE_ENV = 'testing'
    REMOTE_PATH = PATH_TEST
    FILE_NAME = NAME_TEST
    break
}

CONTAINER_NAME="${PREFIX}_${SERVICE_TAG}"
IMAGE_NAME=FILE_NAME
ARCHIVE_FILENAME="${IMAGE_NAME}:${env.BUILD_NUMBER}.tar.gz"

pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    choice(
        name: 'STAGE',
        choices:"PRODUCTION\nTESTING",
        description: "Choose a stage for the build!")
    booleanParam(
        name: 'WITH_DEPLOYMENT',
        defaultValue: false,
        description: "Should Deployment be executed?")
  }

  stages {
    stage('Build docker image') {
      steps {
        sh "mkdir -p ${DEPLOY_DIR}"
        sh "docker build -t ${IMAGE_NAME}:${env.BUILD_NUMBER} -f Dockerfile --rm ."
        sh "docker save ${IMAGE_NAME}:${env.BUILD_NUMBER} | gzip -c > ${DEPLOY_DIR}/${ARCHIVE_FILENAME}"
      }
    }

    stage('Artifacts') {
      steps {
        archiveArtifacts artifacts: "${DEPLOY_DIR}/${ARCHIVE_FILENAME}", fingerprint: true
      }
    }

    stage('Deploy') {
      when {
        expression { params.WITH_DEPLOYMENT }
      }

      steps {
        sshagent([CREDENTIAL]) {
          sh "ssh ${SSH_HOSTNAME} 'mkdir -p ${REMOTE_PATH}'"
          sh "scp ${DEPLOY_DIR}/${ARCHIVE_FILENAME} ${SSH_HOSTNAME}:${REMOTE_PATH}"
          sh "ssh ${SSH_HOSTNAME} 'cd ${REMOTE_PATH} && if [ -f ./last_build_number ]; then docker stop ${CONTAINER_NAME}_\$(cat ./last_build_number) && docker rm -f ${CONTAINER_NAME}_\$(cat ./last_build_number) && docker rmi -f ${IMAGE_NAME}:\$(cat ./last_build_number); else echo \"no last build number\"; fi'"
          sh "ssh ${SSH_HOSTNAME} 'cd ${REMOTE_PATH} && docker load < ${ARCHIVE_FILENAME}'"
          sh "ssh ${SSH_HOSTNAME} 'cd ${REMOTE_PATH} && echo \"${env.BUILD_NUMBER}\" | tee last_build_number'"
        }
      }
    }
  }
}
