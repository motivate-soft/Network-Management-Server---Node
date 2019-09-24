module.exports = {
  apps: [{
    name: "wcm",
    script: "bin/www",

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: "8080"
    },
    output: "/wanos/wcm.out.log",
    error: "/wanos/wcm.error.log",
    log: "/wanos/wanos.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
};