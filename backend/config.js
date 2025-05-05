let config;

try {
  config = require('./config.json');
} catch (error) {
  config = {
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'roots',
      password: process.env.DB_PASS || 'Sancija-11',
      database: process.env.DB_NAME || 'node-mysql-signup-verification-api'
    },
    secret: process.env.JWT_SECRET || 'TcxtoIgRRbUqqgW174x1zAA==',
    emailFrom: process.env.EMAIL_FROM || 'info@node-mysql-signup-verification-api.com',
    smtpOptions: {
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'ladarius66@ethereal.email',
        pass: process.env.SMTP_PASS || 'HaCUhbSy1XEmTpTExr'
      }
    }
  };
}

module.exports = config;