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
        
        // Source directory is always 'webapp' now (branch determines content)
        SOURCE_DIR = 'webapp'
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
                    // Determine which branch should be used
                    env.TARGET_BRANCH = params.VERSION == 'vulnerable' ? 'webapp-vulnerable' : 'main'
                    env.VERSION_DISPLAY = params.VERSION == 'vulnerable' ? '🔴 VULNERABLE (Unsecure)' : '🟢 SECURE (Patched)'
                    
                    // Get actual current branch - handle detached HEAD state
                    def currentBranchRaw = sh(script: 'git rev-parse --abbrev-ref HEAD', returnStdout: true).trim()
                    
                    // If in detached HEAD, find which branch contains this commit
                    if (currentBranchRaw == 'HEAD') {
                        env.CURRENT_BRANCH = sh(
                            script: 'git branch -r --contains HEAD | grep -E "origin/(main|webapp-vulnerable)" | head -1 | sed "s|.*origin/||"',
                            returnStdout: true
                        ).trim()
                    } else {
                        env.CURRENT_BRANCH = currentBranchRaw
                    }
                    
                    echo """
                    ═══════════════════════════════════════════
                    🚀 Kelompok Tujuh - Webapp Deployment
                    ═══════════════════════════════════════════
                    👤 User: ${env.BUILD_USER_ID ?: 'System'}
                    🏷️  Version: ${env.VERSION_DISPLAY}
                    🌿 Expected Branch: ${env.TARGET_BRANCH}
                    📍 Current Branch: ${env.CURRENT_BRANCH}
                    🎯 Target: ${params.TARGET_HOST}
                    🏗️  Build: #${env.BUILD_NUMBER}
                    📅 Time: ${new Date()}
                    ${params.DRY_RUN ? '⚠️  DRY RUN MODE - Build only, no deployment' : '✅ Full deployment enabled'}
                    ═══════════════════════════════════════════
                    """
                    
                    // Warning if branch mismatch (but continue anyway)
                    if (env.CURRENT_BRANCH != env.TARGET_BRANCH) {
                        echo "⚠️  WARNING: Building VERSION='${params.VERSION}' from branch '${env.CURRENT_BRANCH}'"
                        echo "⚠️  Expected branch: '${env.TARGET_BRANCH}'"
                        echo "⚠️  Make sure Jenkins is configured to checkout the correct branch!"
                        echo "⚠️  Continuing with current branch content..."
                    } else {
                        echo "✅ Branch matches expected version"
                    }
                }
            }
        }
        
        stage('📂 Verify Source') {
            steps {
                script {
                    echo """
                    📂 Source Directory: ${env.SOURCE_DIR}
                    📋 Version: ${env.VERSION_DISPLAY}
                    🌿 Branch: ${env.CURRENT_BRANCH}
                    """
                    
                    // Display current commit info
                    sh """
                        echo "📝 Current commit:"
                        git log -1 --oneline
                        echo ""
                    """
                    
                    // Verify source directory exists
                    sh """
                        if [ ! -d "${env.SOURCE_DIR}" ]; then
                            echo "❌ ERROR: Source directory '${env.SOURCE_DIR}' not found!"
                            echo "Available directories:"
                            ls -la
                            exit 1
                        fi
                        
                        echo "✅ Source directory found"
                        echo "📦 Contents:"
                        ls -la ${env.SOURCE_DIR}/
                        
                        # Verify Dockerfile exists
                        if [ ! -f "${env.SOURCE_DIR}/Dockerfile" ]; then
                            echo "❌ ERROR: Dockerfile not found in ${env.SOURCE_DIR}/"
                            exit 1
                        fi
                        echo "✅ Dockerfile found"
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
                            # Create .env file with Supabase configuration
                            echo "Creating .env file for build..."
                            cat > .env << 'EOF'
VITE_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
VITE_SUPABASE_URL=http://project.tujuh:54321
EOF
                            
                            # Build Docker image
                            docker build -t ${env.DOCKER_IMAGE} \
                                --label "project=kelompok-tujuh" \
                                --label "built-by=${env.BUILD_USER_ID ?: 'jenkins'}" \
                                --label "build-number=${env.BUILD_NUMBER}" \
                                --label "version=${params.VERSION}" \
                                --label "git-branch=${env.CURRENT_BRANCH}" \
                                --label "timestamp=\$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
                                -f Dockerfile \
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
                    🌿 Branch: ${env.CURRENT_BRANCH}
                    🏗️  Build: #${env.BUILD_NUMBER}
                    🎯 Target: ${params.TARGET_HOST}
                    🌐 URL: http://project.tujuh
                    📅 Completed: ${new Date()}
                    ═══════════════════════════════════════════
                    
                    🎯 Next Steps:
                    - Access application at: http://project.tujuh
                    - Verify version deployed correctly
                    - Test application functionality
                    
                    🔄 To switch versions:
                    - Run this pipeline again with different VERSION parameter
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
                    echo """
                    ✅ DRY RUN SUCCESSFUL
                    ═══════════════════════════════════════════
                    Image built successfully but not deployed
                    Branch: ${env.CURRENT_BRANCH}
                    Version: ${env.VERSION_DISPLAY}
                    
                    To deploy, run again with DRY_RUN=false
                    ═══════════════════════════════════════════
                    """
                } else {
                    echo """
                    ✅ DEPLOYMENT SUCCESSFUL
                    ═══════════════════════════════════════════
                    Version ${params.VERSION} deployed from branch ${env.CURRENT_BRANCH}
                    Access at: http://project.tujuh
                    ═══════════════════════════════════════════
                    """
                }
            }
        }
        
        failure {
            echo """
            ❌ PIPELINE FAILED
            ═══════════════════════════════════════════
            Build/Deployment failed!
            Check the logs above for error details.
            
            Common issues:
            - SSH connection failure
            - Docker build errors
            - Source directory not found
            - Health check timeout
            - Wrong branch configured in Jenkins
            
            Expected Branch: ${env.TARGET_BRANCH ?: 'N/A'}
            Current Branch: ${env.CURRENT_BRANCH ?: 'N/A'}
            Version: ${params.VERSION}
            ═══════════════════════════════════════════
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
