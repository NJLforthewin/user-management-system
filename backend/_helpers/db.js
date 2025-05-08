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
        console.error('Database initialization error:', error);
        console.log('Running in maintenance mode without database connection');
        
        db.isConnected = false;
        
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
        
        db.Account = MockModel;
        db.RefreshToken = MockModel;
        db.Employee = MockModel;
        db.Department = MockModel;
        db.Workflow = MockModel;
        db.Request = MockModel;
        db.RequestItem = MockModel;
        
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
    }
}