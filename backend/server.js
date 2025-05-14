const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./_middleware/error-handler');
const db = require('./_helpers/db');

async function startServer() {
    try {
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());
        app.use(cookieParser());
        app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

        const publicDir = path.join(__dirname, 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        app.use(express.static(publicDir));

        app.get('/api/status', (req, res) => {
            res.json({
                status: db.isConnected ? 'online' : 'offline',
                timestamp: new Date().toISOString()
            });
        });

        app.get('/', (req, res) => {
            res.send(`
                <html>
                <head>
                    <title>User Management System API</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                        h1 { color: #2b5797; }
                        .endpoint { background: #f4f4f4; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
                        code { background: #e0e0e0; padding: 2px 4px; border-radius: 3px; }
                        .error { color: red; }
                        .success { color: green; }
                    </style>
                </head>
                <body>
                    <h1>User Management System API</h1>
                    <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
                    <p>Database Connection: <span class="${db.isConnected ? 'success' : 'error'}">${db.isConnected ? 'Connected' : 'Not Connected'}</span></p>
                    <p>DB Host: ${process.env.DB_HOST || 'Not set'}</p>
                    <p>DB Name: ${process.env.DB_NAME || 'Not set'}</p>
                    <p>DB User: ${process.env.DB_USER || 'Not set'}</p>
                    <p>DB Password: ${process.env.DB_PASS ? 'Set' : process.env.DB_PASSWORD ? 'Set as DB_PASSWORD instead of DB_PASS' : 'Not set'}</p>
                    
                    <h2>Available endpoints:</h2>
                    <div class="endpoint"><code>/api/status</code> - API status</div>
                    <div class="endpoint"><code>/accounts</code> - User account management</div>
                    <div class="endpoint"><code>/employees</code> - Employee data endpoints</div>
                    <div class="endpoint"><code>/departments</code> - Department data endpoints</div>
                    <div class="endpoint"><code>/workflows</code> - Workflow management</div>
                    <div class="endpoint"><code>/requests</code> - Request processing</div>
                    <div class="endpoint"><code>/api-docs</code> - API documentation</div>
                </body>
                </html>
            `);
        });

        app.get('/accounts/verify-email', (req, res) => {
            const token = req.query.token;
            const origin = req.query.origin || 'http://localhost:4200';
            
            if (!token) return res.status(400).send('Token is required');
            
            const accountService = require('./accounts/account.service');
            accountService.verifyEmail({ token })
                .then(() => {
                    res.send(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Email Verification</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    padding: 40px;
                                    line-height: 1.6;
                                }
                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    padding: 20px;
                                    border: 1px solid #ddd;
                                    border-radius: 5px;
                                }
                                .btn {
                                    display: inline-block;
                                    background-color: #4CAF50;
                                    color: white;
                                    padding: 10px 20px;
                                    text-decoration: none;
                                    border-radius: 4px;
                                    margin-top: 20px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h2>Email verification successful!</h2>
                                <p>Your email has been verified successfully. You can now log in to your account.</p>
                                <a href="${origin}/account/login" class="btn">Proceed to Login</a>
                            </div>
                        </body>
                        </html>
                    `);   
                })
                .catch(error => res.status(400).send('Verification failed: ' + error));
        });

        app.get('/account/verify-email', (req, res) => {
            res.redirect(`/accounts/verify-email?token=${req.query.token}`);
        });

        app.use('/accounts', require('./accounts/accounts.controller'));
        app.use('/employees', require('./employees/index'));
        app.use('/departments', require('./departments/index'));
        app.use('/workflows', require('./workflows/index'));
        app.use('/requests', require('./requests/index'));
        app.use('/api-docs', require('./_helpers/swagger'));
        app.use(errorHandler);

        const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
        
        app.listen(port, () => {
            console.log('Server listening on port ' + port);
            console.log('Database connection status:', db.isConnected ? 'Connected' : 'Not Connected');
            
            if (!db.isConnected) {
                console.log('WARNING: Server is running without database connection');
                console.log('The application will have limited functionality');
            }
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
}

startServer();