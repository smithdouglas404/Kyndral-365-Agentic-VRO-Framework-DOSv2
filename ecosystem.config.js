/**
 * PM2 Ecosystem Configuration
 *
 * Production-grade process management for the Deep Agent System
 *
 * Features:
 * - Automatic restart on crashes
 * - Graceful shutdown with 30s timeout
 * - Memory limit monitoring (restart if >1GB)
 * - CPU limit monitoring
 * - Log rotation
 * - Cluster mode support (for production scaling)
 * - Environment-specific configurations
 *
 * Usage:
 *   Development: pm2 start ecosystem.config.js --env development
 *   Production:  pm2 start ecosystem.config.js --env production
 *   Staging:     pm2 start ecosystem.config.js --env staging
 *
 * Commands:
 *   pm2 start ecosystem.config.js        - Start application
 *   pm2 restart deep-agent-system        - Restart application
 *   pm2 stop deep-agent-system           - Stop application
 *   pm2 delete deep-agent-system         - Delete from PM2
 *   pm2 logs deep-agent-system           - View logs
 *   pm2 monit                            - Monitor resources
 *   pm2 save                             - Save process list
 *   pm2 startup                          - Enable auto-start on boot
 */

module.exports = {
  apps: [
    {
      name: 'deep-agent-system',
      script: 'dist/index.cjs',
      cwd: './',

      // ============================================================
      // EXECUTION MODE
      // ============================================================
      // Use 'cluster' for horizontal scaling (multiple instances)
      // Use 'fork' for single process (default for TypeScript/ESM)
      exec_mode: 'fork',
      instances: 1, // Set to 'max' for cluster mode (uses all CPU cores)

      // ============================================================
      // AUTO-RESTART POLICY
      // ============================================================
      autorestart: true,
      watch: false, // Don't watch files in production
      max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
      max_restarts: 10, // Max 10 restarts within...
      min_uptime: '10s', // ...10 seconds (prevents crash loop)
      restart_delay: 4000, // Wait 4s before restarting

      // ============================================================
      // GRACEFUL SHUTDOWN
      // ============================================================
      kill_timeout: 30000, // 30s for graceful shutdown (matches our processManager)
      wait_ready: true, // Wait for 'ready' signal
      listen_timeout: 10000, // Wait 10s for app to be ready

      // ============================================================
      // LOGGING
      // ============================================================
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      merge_logs: true,

      // ============================================================
      // ENVIRONMENT VARIABLES - DEVELOPMENT
      // ============================================================
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        LOG_LEVEL: 'debug',
        LOG_DIR: './logs',
      },

      // ============================================================
      // ENVIRONMENT VARIABLES - PRODUCTION
      // ============================================================
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        LOG_LEVEL: 'info',
        LOG_DIR: './logs',
      },

      // ============================================================
      // ENVIRONMENT VARIABLES - STAGING
      // ============================================================
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000,
        LOG_LEVEL: 'debug',
        LOG_DIR: './logs',
      },

      // ============================================================
      // MONITORING & METRICS
      // ============================================================
      // PM2 Plus (optional - requires account)
      // pmx: true,
      // post_update: ['npm install'],

      // ============================================================
      // RESOURCE LIMITS (Linux only)
      // ============================================================
      // max_memory_restart: '1G',
      // node_args: '--max-old-space-size=1024',

      // ============================================================
      // ADVANCED OPTIONS
      // ============================================================
      // interpreter: 'node',
      // interpreter_args: '--harmony',
      // source_map_support: true,
      // instance_var: 'INSTANCE_ID',
      // vizion: false, // Disable version control features
      // ignore_watch: ['node_modules', 'logs', 'dist'],
      // watch_options: {
      //   followSymlinks: false,
      // },

      // ============================================================
      // CRON RESTART (optional)
      // ============================================================
      // Restart daily at 3 AM (for memory cleanup, etc.)
      // cron_restart: '0 3 * * *',

      // ============================================================
      // HEALTH CHECK (optional)
      // ============================================================
      // PM2 will restart if health check fails
      // health_check: {
      //   url: 'http://localhost:5000/health/live',
      //   interval: 60000, // Check every 60s
      //   timeout: 5000,   // Timeout after 5s
      //   retries: 3,      // Retry 3 times before restart
      // },
    },
  ],

  /**
   * DEPLOYMENT CONFIGURATION (optional)
   * For deploying to remote servers via SSH
   */
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/deep-agent-system.git',
      path: '/var/www/deep-agent-system',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-deploy': 'git fetch --all',
    },
    staging: {
      user: 'deploy',
      host: ['your-staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/deep-agent-system.git',
      path: '/var/www/deep-agent-system-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
    },
  },
};
