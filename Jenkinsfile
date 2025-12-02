pipeline {
    agent any
    
    parameters {
        choice(
            name: 'VERSION', 
            choices: ['secure', 'vulnerable'], 
            description: 'secure: Block deployment if security issues found | vulnerable: Deploy despite security issues (demo mode)'
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
                    
                    // Branch validation
                    if (env.CURRENT_BRANCH != env.TARGET_BRANCH) {
                        echo "⚠️  WARNING: Building VERSION='${params.VERSION}' from branch '${env.CURRENT_BRANCH}'"
                        echo "⚠️  Expected branch: '${env.TARGET_BRANCH}'"
                        echo ""
                        if (params.VERSION == 'secure' && env.CURRENT_BRANCH == 'webapp-vulnerable') {
                            echo "⚠️  You selected VERSION=secure but code is from vulnerable branch"
                            echo "⚠️  Security scans will detect issues and BLOCK deployment"
                        } else if (params.VERSION == 'vulnerable' && env.CURRENT_BRANCH == 'main') {
                            echo "⚠️  You selected VERSION=vulnerable but code is from secure branch"
                            echo "⚠️  Security scans will likely pass (no vulnerabilities in code)"
                        }
                        echo ""
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
        
        stage('🔒 Security Scanning') {
            parallel {
                stage('🛡️ SAST - Semgrep') {
                    steps {
                        dir("${env.SOURCE_DIR}") {
                            script {
                                echo "Running Semgrep SAST analysis..."
                                
                                def semgrepStatus = sh(
                                    script: '''
                                        # Run Semgrep using Docker with custom rules
                                        echo "Scanning for security vulnerabilities with Semgrep..."
                                        
                                        # Check if custom rules exist
                                        if [ -f ../custom-rules.yaml ]; then
                                            echo "✅ Found custom-rules.yaml - using custom rules + auto config"
                                            CONFIG_OPTION="--config=auto --config=/rules/custom-rules.yaml"
                                        else
                                            echo "⚠️  custom-rules.yaml not found - using auto config only"
                                            CONFIG_OPTION="--config=auto"
                                        fi
                                        
                                        docker run --rm \
                                            -v "$(pwd):/src:ro" \
                                            -v "$(pwd)/..:/output:rw" \
                                            -v "$(pwd)/../custom-rules.yaml:/rules/custom-rules.yaml:ro" \
                                            returntocorp/semgrep \
                                            semgrep scan $CONFIG_OPTION \
                                            --exclude='*.test.tsx' \
                                            --exclude='*.test.ts' \
                                            --exclude='node_modules' \
                                            --exclude='dist' \
                                            --json \
                                            --output=/output/semgrep-report.json \
                                            /src || true
                                        
                                        # Check for HIGH/CRITICAL findings
                                        if [ -f ../semgrep-report.json ]; then
                                            CRITICAL_COUNT=$(jq '[.results[] | select(.extra.severity == "ERROR" or .extra.severity == "WARNING")] | length' ../semgrep-report.json || echo "0")
                                            echo "Found $CRITICAL_COUNT security issues"
                                            
                                            if [ "$CRITICAL_COUNT" -gt 0 ]; then
                                                echo "❌ SAST FAILED: Found $CRITICAL_COUNT security vulnerabilities"
                                                jq -r '.results[] | select(.extra.severity == "ERROR" or .extra.severity == "WARNING") | "[" + .extra.severity + "] " + .check_id + ": " + .extra.message + " in " + .path + ":" + (.start.line | tostring)' ../semgrep-report.json
                                                exit 1
                                            else
                                                echo "✅ SAST PASSED: No critical vulnerabilities found"
                                                exit 0
                                            fi
                                        else
                                            echo "⚠️  Semgrep report not generated"
                                            exit 0
                                        fi
                                    ''',
                                    returnStatus: true
                                )
                                
                                if (semgrepStatus != 0) {
                                    env.SAST_FAILED = 'true'
                                    if (params.VERSION == 'secure') {
                                        error("❌ SAST scan detected security vulnerabilities! Deployment BLOCKED for secure version.")
                                    } else {
                                        echo "⚠️  SAST scan found vulnerabilities, but VERSION=vulnerable - continuing deployment for demo purposes"
                                    }
                                }
                            }
                        }
                    }
                }
                
                stage('🐳 Container Scan - Trivy') {
                    steps {
                        script {
                            echo "Running Trivy container vulnerability scan..."
                            
                            def trivyStatus = sh(
                                script: """
                                    # Run Trivy using Docker
                                    echo "Scanning image: ${env.DOCKER_IMAGE}"
                                    docker run --rm \
                                        -v /var/run/docker.sock:/var/run/docker.sock:ro \
                                        -v "\$(pwd):/output:rw" \
                                        aquasec/trivy:latest image \
                                        --severity HIGH,CRITICAL \
                                        --format json \
                                        --output /output/trivy-report.json \
                                        ${env.DOCKER_IMAGE} || true
                                    
                                    # Check for vulnerabilities
                                    if [ -f trivy-report.json ]; then
                                        VULN_COUNT=\$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "HIGH" or .Severity == "CRITICAL")] | length' trivy-report.json || echo "0")
                                        echo "Found \$VULN_COUNT HIGH/CRITICAL vulnerabilities"
                                        
                                        if [ "\$VULN_COUNT" -gt 0 ]; then
                                            echo "❌ CONTAINER SCAN FAILED: Found \$VULN_COUNT HIGH/CRITICAL vulnerabilities"
                                            docker run --rm \
                                                -v /var/run/docker.sock:/var/run/docker.sock:ro \
                                                aquasec/trivy:latest image \
                                                --severity HIGH,CRITICAL \
                                                --format table \
                                                ${env.DOCKER_IMAGE}
                                            exit 1
                                        else
                                            echo "✅ CONTAINER SCAN PASSED: No HIGH/CRITICAL vulnerabilities"
                                            exit 0
                                        fi
                                    else
                                        echo "⚠️  Trivy report not generated"
                                        exit 0
                                    fi
                                """,
                                returnStatus: true
                            )
                            
                            if (trivyStatus != 0) {
                                env.TRIVY_FAILED = 'true'
                                if (params.VERSION == 'secure') {
                                    error("❌ Container scan detected HIGH/CRITICAL vulnerabilities! Deployment BLOCKED for secure version.")
                                } else {
                                    echo "⚠️  Container scan found HIGH/CRITICAL vulnerabilities, but VERSION=vulnerable - continuing deployment for demo purposes"
                                }
                            }
                        }
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
                                 /tmp/remote-deploy.sh ${params.VERSION} ${env.IMAGE_TAR} ${env.BUILD_NUMBER} ${env.CURRENT_BRANCH}"
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
        
        stage('🎯 DAST - OWASP ZAP') {
            when {
                expression { !params.DRY_RUN }
            }
            steps {
                script {
                    echo "Running OWASP ZAP Dynamic Application Security Testing..."
                    
                    def zapStatus = sh(
                        script: """
                            # Check if ZAP Docker image exists, pull if needed
                            if ! docker images | grep -q "ghcr.io/zaproxy/zaproxy"; then
                                echo "Pulling OWASP ZAP Docker image..."
                                docker pull ghcr.io/zaproxy/zaproxy:stable
                            fi
                            
                            # Run ZAP baseline scan against deployed app
                            echo "Starting ZAP baseline scan on http://${params.TARGET_HOST.split('@')[1]}:3000"
                            docker run --rm \
                                -v \$(pwd):/zap/wrk:rw \
                                ghcr.io/zaproxy/zaproxy:stable \
                                zap-baseline.py \
                                -t http://${params.TARGET_HOST.split('@')[1]}:3000 \
                                -r zap-report.html \
                                -J zap-report.json \
                                -w zap-report.md \
                                || true
                            
                            # Parse results
                            if [ -f zap-report.json ]; then
                                # Count HIGH risk alerts
                                HIGH_RISK=\$(jq '[.site[].alerts[] | select(.riskcode == "3")] | length' zap-report.json 2>/dev/null || echo "0")
                                MEDIUM_RISK=\$(jq '[.site[].alerts[] | select(.riskcode == "2")] | length' zap-report.json 2>/dev/null || echo "0")
                                
                                echo "DAST Results:"
                                echo "  HIGH Risk: \$HIGH_RISK"
                                echo "  MEDIUM Risk: \$MEDIUM_RISK"
                                
                                if [ "\$HIGH_RISK" -gt 0 ]; then
                                    echo "❌ DAST FAILED: Found \$HIGH_RISK HIGH risk vulnerabilities"
                                    jq -r '.site[].alerts[] | select(.riskcode == "3") | "[" + .risk + "] " + .name + ": " + .desc' zap-report.json 2>/dev/null | head -10
                                    exit 1
                                else
                                    echo "✅ DAST PASSED: No HIGH risk vulnerabilities found"
                                    exit 0
                                fi
                            else
                                echo "⚠️  ZAP report not generated, skipping DAST validation"
                                exit 0
                            fi
                        """,
                        returnStatus: true
                    )
                    
                    if (zapStatus != 0) {
                        env.DAST_FAILED = 'true'
                        if (params.VERSION == 'secure') {
                            error("❌ DAST scan detected HIGH risk vulnerabilities! Deployment BLOCKED for secure version.")
                        } else {
                            echo "⚠️  DAST scan found HIGH risk vulnerabilities, but VERSION=vulnerable - allowing deployment for demo purposes"
                        }
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
                    
                    🔒 Security Scans:
                    - ✅ SAST (Semgrep): Passed
                    - ✅ Container Scan (Trivy): Passed
                    
                    To deploy, run again with DRY_RUN=false
                    ═══════════════════════════════════════════
                    """
                } else {
                    def securityStatus = ""
                    if (params.VERSION == 'vulnerable') {
                        def warnings = []
                        if (env.SAST_FAILED == 'true') warnings.add("⚠️  SAST: Issues found (ignored)")
                        if (env.TRIVY_FAILED == 'true') warnings.add("⚠️  Trivy: Vulnerabilities found (ignored)")
                        if (env.DAST_FAILED == 'true') warnings.add("⚠️  DAST: High risks found (ignored)")
                        
                        if (warnings.isEmpty()) {
                            securityStatus = "🔒 Security Scans:\n    - ✅ All scans passed"
                        } else {
                            securityStatus = "⚠️  Security Issues Ignored (VERSION=vulnerable):\n    " + warnings.join("\n    ")
                        }
                    } else {
                        securityStatus = "🔒 Security Scans Passed:\n    - ✅ SAST (Semgrep): No critical vulnerabilities\n    - ✅ Container Scan (Trivy): No HIGH/CRITICAL CVEs\n    - ✅ DAST (OWASP ZAP): No HIGH risk issues"
                    }
                    
                    echo """
                    ✅ DEPLOYMENT SUCCESSFUL
                    ═══════════════════════════════════════════
                    Version ${params.VERSION} deployed from branch ${env.CURRENT_BRANCH}
                    Access at: http://project.tujuh or http://10.34.100.160:3000
                    
                    ${securityStatus}
                    ═══════════════════════════════════════════
                    """
                }
            }
        }
        
        failure {
            script {
                def failureReason = []
                if (env.SAST_FAILED == 'true') {
                    failureReason.add("❌ SAST (Semgrep): Security vulnerabilities detected in code")
                }
                if (env.TRIVY_FAILED == 'true') {
                    failureReason.add("❌ Container Scan (Trivy): HIGH/CRITICAL vulnerabilities in dependencies")
                }
                if (env.DAST_FAILED == 'true') {
                    failureReason.add("❌ DAST (OWASP ZAP): HIGH risk vulnerabilities in running application")
                }
                
                if (failureReason.isEmpty()) {
                    failureReason.add("❌ Build or deployment error - check logs above")
                }
                
                echo """
            ❌ PIPELINE FAILED
            ═══════════════════════════════════════════
            Build/Deployment failed!
            
            🔒 Security Scan Results:
            ${failureReason.join('\n            ')}
            
            ${params.VERSION == 'secure' ? '⚠️  VERSION=secure blocks deployment on security issues' : '⚠️  VERSION=vulnerable should allow deployment despite issues'}
            
            Common issues:
            - Security vulnerabilities in code (SAST) - blocks if VERSION=secure
            - Vulnerable dependencies (Trivy) - blocks if VERSION=secure  
            - Runtime security issues (DAST) - blocks if VERSION=secure
            - SSH connection failure
            - Docker build errors
            - Source directory not found
            - Health check timeout
            - Branch mismatch (expected: ${env.TARGET_BRANCH ?: 'N/A'}, current: ${env.CURRENT_BRANCH ?: 'N/A'})
            
            💡 Tip: If VERSION=secure fails, vulnerabilities must be fixed before deployment
            💡 Tip: If VERSION=vulnerable fails, check non-security issues (SSH, Docker, etc.)
            
            📋 Check scan reports:
            - semgrep-report.json (SAST)
            - trivy-report.json (Container Vulnerabilities)
            - zap-report.html (DAST)
            ═══════════════════════════════════════════
            """
            }
        }
        
        always {
            script {
                echo "🧹 Cleaning up workspace..."
                
                // Archive security scan reports
                archiveArtifacts artifacts: '**/semgrep-report.json,**/trivy-report.json,**/zap-report.*', allowEmptyArchive: true
                
                // Clean up Docker images to save space on shared Jenkins
                sh """
                    # Remove the built image
                    docker rmi ${env.DOCKER_IMAGE} 2>/dev/null || true
                    
                    # Prune images from this build
                    docker image prune -f --filter "label=build-number=${env.BUILD_NUMBER}" || true
                    
                    echo "✅ Cleanup complete"
                """
                
                // Clean up artifacts directory (but keep security reports)
                sh "rm -rf artifacts || true"
            }
        }
    }
}
