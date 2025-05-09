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
                password: process.env.DB_PASS || process.env.DB_PASSWORD, 
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
                        connectTimeout: 120000, // Increased timeout
                        supportBigNumbers: true,
                        bigNumberStrings: true
                    } 
                    : {},
                pool: {
                    max: 3, // Reduced pool size
                    min: 0,
                    acquire: 120000, // Increased timeout
                    idle: 20000
                }
            }
        );
        
        db.sequelize = sequelize;
        
        // Single attempt to connect, no retries
        try {
            await sequelize.authenticate();
            console.log('Database connection established successfully.');
            
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
            const syncOptions = process.env.NODE_ENV === 'production' 
                ? { alter: true } // Change to true to create tables in production
                : { alter: true };
            
            await sequelize.sync(syncOptions);
            console.log('Database synchronized successfully.');
            
            db.isConnected = true;
        } catch (error) {
            throw error; // Re-throw to be caught by the outer catch block
        }

    } catch (error) {
        console.error('Database initialization error:', error.message);
        
        db.isConnected = false;
        
        // Initialize sequelize with minimum functionality
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
        
        // Create mock models with all required methods
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
        
        // Initialize all models with the MockModel class
        db.Account = MockModel;
        db.RefreshToken = MockModel;
        db.Employee = MockModel;
        db.Department = MockModel;
        db.Workflow = MockModel;
        db.Request = MockModel;
        db.RequestItem = MockModel;
    }
}