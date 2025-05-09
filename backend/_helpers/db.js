const config = require('../config');
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        // Set database config based on environment
        const dbConfig = process.env.NODE_ENV === 'production' 
            ? {
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '3306', 10),
                user: process.env.DB_USER,
                password: process.env.DB_PASS || process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            } 
            : config.database;
        
        console.log('Connecting to database...');
        
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
                console.error('Failed to create database');
            }
        }
        
        // Create Sequelize instance with logging enabled
        const sequelize = new Sequelize(
            dbConfig.database, 
            dbConfig.user, 
            dbConfig.password, 
            { 
                host: dbConfig.host,
                port: dbConfig.port,
                dialect: 'mysql',
                logging: console.log, // Enable SQL logging - THIS IS THE KEY CHANGE
                dialectOptions: {
                    connectTimeout: 60000,
                    supportBigNumbers: true,
                    bigNumberStrings: true,
                    charset: 'utf8mb4',
                    ssl: false
                },
                pool: {
                    max: 2,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            }
        );
        
        db.sequelize = sequelize;
        
        // Test the connection
        await sequelize.authenticate();
        console.log('Database connection authenticated.');
        
        // Define models
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);
        db.Employee = require('../employees/employee.model')(sequelize);
        db.Department = require('../departments/department.model')(sequelize);
        db.Workflow = require('../workflows/workflow.model')(sequelize);
        db.Request = require('../requests/request.model')(sequelize);
        db.RequestItem = require('../requests/request-item.model')(sequelize);

        // Define relationships
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

        // Sync database
        const syncOptions = { alter: true }; // Create tables if they don't exist
        await sequelize.sync(syncOptions);
        console.log('Database synchronized.');
        
        db.isConnected = true;

    } catch (error) {
        console.error('Database initialization error:', error.message);
        db.isConnected = false;
        
        // Create basic mock functionality to prevent crashes
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
        
        // Mock models
        class MockModel {
            static findOne() { return Promise.resolve(null); }
            static findAll() { return Promise.resolve([]); }
            static create() { return Promise.resolve(null); }
            static update() { return Promise.resolve([0]); }
            static destroy() { return Promise.resolve(0); }
            static count() { return Promise.resolve(0); }
            static findByPk() { return Promise.resolve(null); }
            
            constructor() {}
            save() { return Promise.resolve(this); }
            update() { return Promise.resolve(this); }
            destroy() { return Promise.resolve(this); }
        }
        
        // Initialize models with mock
        db.Account = MockModel;
        db.RefreshToken = MockModel;
        db.Employee = MockModel;
        db.Department = MockModel;
        db.Workflow = MockModel;
        db.Request = MockModel;
        db.RequestItem = MockModel;
    }
}