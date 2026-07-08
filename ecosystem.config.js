// ecosystem.config.js — configuración de PM2 para producción
// Uso: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "riojamap-backend",
      script: "dist/src/index.js",
      cwd: "./server",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      max_memory_restart: "500M",
      out_file: "/var/log/pm2/riojamap-out.log",
      error_file: "/var/log/pm2/riojamap-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
