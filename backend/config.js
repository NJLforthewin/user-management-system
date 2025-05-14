let config;

try {
  config = require('./config.json');
} catch (error) {
  config = {
    database: {
      host: process.env.DB_HOST || '153.92.15.31',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'u875409848_alburo',
      password: process.env.DB_PASS || '9T2Z5$3UKkgSYzE',
      database: process.env.DB_NAME || 'u875409848_alburo'
    },
    secret: process.env.JWT_SECRET || 'TcxtoIgRRbUqqgW174x1zAA==',
    emailFrom: process.env.EMAIL_FROM || 'usermanagementsystem.sancija@gmail.com',
    smtpOptions: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'usermanagementsystem.sancija@gmail.com',
        pass: process.env.SMTP_PASS || 'cmzdnhabjdrdldlt'
      }
    }
  };
}

module.exports = config;