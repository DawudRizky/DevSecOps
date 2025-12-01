pipeline {
    agent any
    
    parameters {
        choice(
            name: 'VERSION', 
            choices: ['secure', 'vulnerable'], 
            description: 'Select webapp version to deploy'
        )
        string(
            name: 'TARGET_HOST',
            defaultValue: 'dso507@10.34.100.160',
            description: 'Deployment target SSH (user@host)'
        )
        booleanParam(
            name: 'DRY_RUN',
            defaultValue: false,
            description: 'Build only, do not deploy'
        )
    }
    
    environment {
        // Unique identifiers to avoid conflicts in shared Jenkins
        PROJECT_NAME = "kelompok-tujuh-${env.BUILD_USER_ID ?: 'dso507'}"
        GIT_REPO = 'https://github.com/DawudRizky/DevSecOps.git'
        
        // Use build-specific image name to avoid conflicts
        DOCKER_IMAGE = "webapp-dso507-${env.BUILD_NUMBER}:${params.VERSION}"
        IMAGE_TAR = "webapp-${params.VERSION}-${env.BUILD_NUMBER}.tar.gz"
        
        // SSH credentials ID (will be configured in Jenkins)
        SSH_CRED_ID = 'ssh-deploy-dso507'
    }
    
    options {
        // Safety measures for shared environment
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
        timestamps()
    }
    
    stages {
        stage('🔍 Pre-flight Check') {
            steps {
                script {
                    echo """
                    ═══════════════════════════════════════════
                    🚀 Kelompok Tujuh - Webapp Deployment
                    ═══════════════════════════════════════════
                    👤 User: ${env.BUILD_USER_ID ?: 'System'}
                    🏷️  Version: ${params.VERSION}
                    🎯 Target: ${params.TARGET_HOST}
                    🏗️  Build: #${env.BUILD_NUMBER}
                    📅 Time: ${new Date()}
                    ${params.DRY_RUN ? '⚠️  DRY RUN MODE - Build only, no deployment' : '✅ Full deployment enabled'}
                    ═══════════════════════════════════════════
                    """
                }
            }
        }
        
        stage('📥 Checkout Source') {
            steps {
                script {
                    echo "Checking out from ${env.GIT_REPO}..."
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        userRemoteConfigs: [[url: env.GIT_REPO]]
                    ])
                }
            }
        }
        
        stage('📂 Determine Source') {
            steps {
                script {
                    if (params.VERSION == 'vulnerable') {
                        env.SOURCE_DIR = 'project-management'
                        env.VERSION_DISPLAY = '🔴 VULNERABLE (Unsecure)'
                    } else {
                        env.SOURCE_DIR = 'project-management-secure'
                        env.VERSION_DISPLAY = '🟢 SECURE (Patched)'
                    }
                    
                    echo """
                    📂 Source Directory: ${env.SOURCE_DIR}
                    📋 Version: ${env.VERSION_DISPLAY}
                    """
                    
                    // Verify source directory exists
                    sh """
                        if [ ! -d "${env.SOURCE_DIR}" ]; then
                            echo "❌ ERROR: Source directory not found!"
                            exit 1
                        fi
                        ls -la ${env.SOURCE_DIR}/
                    """
                }
            }
        }
        
        stage('🔨 Build Docker Image') {
            steps {
                dir("${env.SOURCE_DIR}") {
                    script {
                        echo "Building Docker image: ${env.DOCKER_IMAGE}"
                        
                        sh """
                            # Build with multi-stage Dockerfile
                            docker build \
                                -t ${env.DOCKER_IMAGE} \
                                -f Dockerfile \
                                --label "project=kelompok-tujuh" \
                                --label "built-by=${env.BUILD_USER_ID ?: 'jenkins'}" \
                                --label "build-number=${env.BUILD_NUMBER}" \
                                --label "version=${params.VERSION}" \
                                --label "timestamp=\$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                                .
                            
                            # Verify image was created
                            docker images ${env.DOCKER_IMAGE}
                            
                            # Show image size
                            echo "📦 Image size:"
                            docker images ${env.DOCKER_IMAGE} --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"
                        """
                    }
                }
            }
        }
        
        stage('💾 Save Image') {
            when {
                expression { !params.DRY_RUN }
            }
            steps {
                script {
                    echo "Saving Docker image as tar archive..."
                    
                    sh """
                        # Create artifacts directory
                        mkdir -p artifacts
                        
                        # Save and compress image
                        echo "Exporting image..."
                        docker save ${env.DOCKER_IMAGE} | gzip > artifacts/${env.IMAGE_TAR}
                        
                        # Show file info
                        ls -lh artifacts/${env.IMAGE_TAR}
                        echo "✅ Image saved: artifacts/${env.IMAGE_TAR}"
                    """
                }
            }
        }
        
        stage('📤 Transfer to Target') {
            when {
                expression { !params.DRY_RUN }
            }
            steps {
                script {
                    echo "Transferring image to ${params.TARGET_HOST}..."
                    
                    sshagent([env.SSH_CRED_ID]) {
                        sh """
                            # Transfer the image file
                            scp -o StrictHostKeyChecking=no \
                                -o UserKnownHostsFile=/dev/null \
                                artifacts/${env.IMAGE_TAR} \
                                ${params.TARGET_HOST}:/tmp/${env.IMAGE_TAR}
                            
                            # Transfer deployment script
                            scp -o StrictHostKeyChecking=no \
                                -o UserKnownHostsFile=/dev/null \
                                scripts/remote-deploy.sh \
                                ${params.TARGET_HOST}:/tmp/remote-deploy.sh
                            
                            echo "✅ Files transferred successfully"
                        """
                    }
                }
            }
        }
        
        stage('🚀 Deploy on Target') {
            when {
                expression { !params.DRY_RUN }
            }
            steps {
                script {
                    echo "Executing deployment on target machine..."
                    
                    sshagent([env.SSH_CRED_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no \
                                -o UserKnownHostsFile=/dev/null \
                                ${params.TARGET_HOST} \
                                "chmod +x /tmp/remote-deploy.sh && \
                                 /tmp/remote-deploy.sh ${params.VERSION} ${env.IMAGE_TAR}"
                        """
                    }
                }
            }
        }
        
        stage('🏥 Health Check') {
            when {
                expression { !params.DRY_RUN }
            }
            steps {
                script {
                    echo "Running health check..."
                    
                    sshagent([env.SSH_CRED_ID]) {
                        sh """
                            # Wait for container to start
                            sleep 5
                            
                            # Check if application is responding
                            ssh -o StrictHostKeyChecking=no \
                                -o UserKnownHostsFile=/dev/null \
                                ${params.TARGET_HOST} \
                                'curl -f http://localhost:3000 -m 10 || exit 1'
                            
                            echo "✅ Health check passed!"
                        """
                    }
                }
            }
        }
        
        stage('📊 Deployment Summary') {
            when {
                expression { !params.DRY_RUN }
            }
            steps {
                script {
                    echo """
                    ═══════════════════════════════════════════
                    ✅ DEPLOYMENT SUCCESSFUL
                    ═══════════════════════════════════════════
                    📦 Version: ${env.VERSION_DISPLAY}
                    🏗️  Build: #${env.BUILD_NUMBER}
                    🎯 Target: ${params.TARGET_HOST}
                    🌐 URL: http://project.tujuh
                    📅 Completed: ${new Date()}
                    ═══════════════════════════════════════════
                    """
                }
            }
        }
    }
    
    post {
        success {
            script {
                if (params.DRY_RUN) {
                    echo "✅ Dry run completed successfully - Image built but not deployed"
                } else {
                    echo "✅ Deployment completed successfully!"
                }
            }
        }
        
        failure {
            echo """
            ❌ Pipeline Failed!
            Check the logs above for error details.
            """
        }
        
        always {
            script {
                echo "🧹 Cleaning up workspace..."
                
                // Clean up Docker images to save space on shared Jenkins
                sh """
                    # Remove the built image
                    docker rmi ${env.DOCKER_IMAGE} 2>/dev/null || true
                    
                    # Prune images from this build
                    docker image prune -f --filter "label=build-number=${env.BUILD_NUMBER}" || true
                    
                    echo "✅ Cleanup complete"
                """
                
                // Clean up artifacts directory
                sh "rm -rf artifacts || true"
            }
        }
    }
}
