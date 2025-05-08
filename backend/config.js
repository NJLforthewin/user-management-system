let config;

try {
  config = require('./config.json');
} catch (error) {
  config = {
    database: {
      host: process.env.DB_HOST || '153.92.15.31',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'u875409848_sancija',
      password: process.env.DB_PASS || 'SN81s*0^n',
      database: process.env.DB_NAME || 'u875409848_sancija'
    },
    secret: process.env.JWT_SECRET || 'TcxtoIgRRbUqqgW174x1zAA==',
    emailFrom: process.env.EMAIL_FROM || 'johnchristiansancija0@gmail.com',
    smtpOptions: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'johnchristiansancija0@gmail.com',
        pass: process.env.SMTP_PASS || 'cmzdnhabjdrdldlt'
      }
    }
  };
}

module.exports = config;