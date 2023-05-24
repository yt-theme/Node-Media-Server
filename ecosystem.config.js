module.exports = {
  apps : [
      {
        name: "node-media-server",
        script: './bin/app.js',
        instances: 1,
        max_memory_restart: "2G"
      }
  ],

  deploy : {
    production : {
      user : 'yt',
      host : ['192.168.0.104'],
      ref  : 'origin/master',
      repo : 'https://github.com/yt-theme/Node-Media-Server.git',
      path : '/home/yt/node_media_server',
      'pre-deploy-local': '',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
