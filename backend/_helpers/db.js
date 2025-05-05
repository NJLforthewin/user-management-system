const config = require('../config');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        const dbConfig = process.env.NODE_ENV === 'production' 
            ? {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASS,
                database: process.env.DB_NAME
            } 
            : config.database;
        
        if (process.env.NODE_ENV !== 'production') {
            try {
                const connection = await mysql.createConnection({ 
                    host: dbConfig.host, 
                    port: dbConfig.port, 
                    user: dbConfig.user, 
                    password: dbConfig.password 
                });
                await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
            } catch (error) {
                console.error('Failed to create database:', error);
            }
        }
        
        const sequelize = new Sequelize(
            dbConfig.database, 
            dbConfig.user, 
            dbConfig.password, 
            { 
                host: dbConfig.host,
                port: dbConfig.port,
                dialect: 'mysql',
                dialectOptions: process.env.NODE_ENV === 'production' ? {
                    ssl: {
                        rejectUnauthorized: false
                    }
                } : {}
            }
        );

        db.sequelize = sequelize;
        
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        
        db.Employee = require('../employees/employee.model')(sequelize);
        db.Department = require('../departments/department.model')(sequelize);
        db.Workflow = require('../workflows/workflow.model')(sequelize);
        db.Request = require('../requests/request.model')(sequelize);
        db.RequestItem = require('../requests/request-item.model')(sequelize);

        db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account);
        
        db.Account.hasOne(db.Employee);
        db.Employee.belongsTo(db.Account);
        
        db.Department.hasMany(db.Employee);
        db.Employee.belongsTo(db.Department);
        
        db.Employee.hasMany(db.Workflow);
        db.Workflow.belongsTo(db.Employee);
        
        db.Employee.hasMany(db.Request);
        db.Request.belongsTo(db.Employee);
        
        db.Request.hasMany(db.RequestItem, { onDelete: 'CASCADE' });
        db.RequestItem.belongsTo(db.Request);

        const syncOptions = process.env.NODE_ENV === 'production' 
            ? { alter: false } 
            : { alter: true };
        
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        await sequelize.sync(syncOptions);
        console.log('Database synchronized successfully.');
        
        db.isConnected = true;
        
    } catch (error) {
        console.error('Database initialization error:', error);
        console.log('Running in maintenance mode without database connection');
        
        db.isConnected = false;
        
        db.Account = { findOne: () => null, create: () => null };
        db.RefreshToken = { findOne: () => null, create: () => null };
        db.Employee = { findOne: () => null, create: () => null };
        db.Department = { findOne: () => null, findAll: () => [] };
        db.Workflow = { findOne: () => null, create: () => null };
        db.Request = { findOne: () => null, create: () => null };
        db.RequestItem = { findOne: () => null, create: () => null };
    }
}