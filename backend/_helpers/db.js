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
                password: process.env.DB_PASS || process.env.DB_PASSWORD, // Try both env var names
                database: process.env.DB_NAME
            } 
            : config.database;
        
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log(`DB connection parameters:
            Host: ${dbConfig.host}
            Port: ${dbConfig.port}
            User: ${dbConfig.user}
            Database: ${dbConfig.database}
            Password defined: ${dbConfig.password ? 'Yes' : 'No'}
        `);
        
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
                logging: false,
                dialectOptions: process.env.NODE_ENV === 'production' 
                    ? {
                        ssl: {
                            rejectUnauthorized: false
                        },
                        connectTimeout: 60000, 
                        supportBigNumbers: true,
                        bigNumberStrings: true
                    } 
                    : {},
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 60000, 
                    idle: 10000
                },
                retry: {
                    max: 5 
                }
            }
        );
        
        db.sequelize = sequelize;
        
        let retries = 5;
        let authenticated = false;
        
        while (retries > 0 && !authenticated) {
            try {
                await sequelize.authenticate();
                console.log('Database connection established successfully.');
                authenticated = true;
            } catch (error) {
                retries--;
                console.log(`Failed to connect to database. Retries left: ${retries}`);
                console.log(`Connection error details: ${error.message}`);
                console.log(`Error code: ${error.code}`);
                console.log(`Full error: ${JSON.stringify(error, null, 2)}`);
                if (retries === 0) throw error;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
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
        
        await sequelize.sync(syncOptions);
        console.log('Database synchronized successfully.');
        
        db.isConnected = true;

    } catch (error) {
        console.error('==========================================');
        console.error('DATABASE INITIALIZATION ERROR');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        console.error('==========================================');
        
        // Set isConnected to false but don't set up maintenance mode
        db.isConnected = false;
        
        // Initialize sequelize with minimum functionality to prevent errors
        db.sequelize = {
            transaction: (fn) => Promise.resolve(fn({ commit: () => Promise.resolve(), rollback: () => Promise.resolve() })),
            literal: (val) => val,
            Op: {
                eq: Symbol('eq'),
                ne: Symbol('ne'),
                gte: Symbol('gte'),
                gt: Symbol('gt'),
                lte: Symbol('lte'),
                lt: Symbol('lt'),
                in: Symbol('in'),
                notIn: Symbol('notIn'),
                is: Symbol('is'),
                like: Symbol('like'),
                notLike: Symbol('notLike')
            }
        };
        
        db.Account = { findOne: () => Promise.resolve(null) };
        db.RefreshToken = { findOne: () => Promise.resolve(null) };
        db.Employee = { findOne: () => Promise.resolve(null) };
        db.Department = { findOne: () => Promise.resolve(null) };
        db.Workflow = { findOne: () => Promise.resolve(null) };
        db.Request = { findOne: () => Promise.resolve(null) };
        db.RequestItem = { findOne: () => Promise.resolve(null) };
    }
}