const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');
const db = require('./_helpers/db');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

app.get('/api/status', (req, res) => {
    res.json({
        status: db.isConnected ? 'online' : 'maintenance',
        timestamp: new Date().toISOString()
    });
});

app.use((req, res, next) => {
    if (req.path === '/api/status' || 
        req.path.startsWith('/api-docs') || 
        req.path === '/accounts/verify-email' ||
        req.path === '/account/verify-email') {
        return next();
    }
    
    if (!db.isConnected) {
        const acceptHeader = req.headers.accept || '';
        
        if (acceptHeader.includes('application/json') || req.path.startsWith('/accounts/')) {
            return res.status(503).json({ 
                message: 'Service temporarily unavailable, maintenance in progress', 
                status: 'maintenance',
                estimatedCompletion: '30 minutes',
                details: 'Our database is currently undergoing maintenance. Please try again later.',
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(503).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Maintenance Mode</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background-color: #f5f7fa;
                            color: #333;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            padding: 20px;
                            text-align: center;
                        }
                        .maintenance-container {
                            background-color: white;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                            padding: 40px;
                            max-width: 600px;
                            width: 100%;
                        }
                        .maintenance-icon {
                            font-size: 64px;
                            margin-bottom: 20px;
                        }
                        h1 {
                            color: #2b5797;
                            margin-bottom: 10px;
                        }
                        p {
                            color: #666;
                            font-size: 18px;
                            line-height: 1.6;
                            margin-bottom: 30px;
                        }
                        .estimated-time {
                            background-color: #f0f4f8;
                            border-radius: 4px;
                            padding: 10px 15px;
                            display: inline-block;
                            font-weight: 500;
                            margin-bottom: 30px;
                        }
                        .refresh-button {
                            background-color: #2b5797;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            padding: 12px 24px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: background-color 0.3s;
                        }
                        .refresh-button:hover {
                            background-color: #1e3a6a;
                        }
                        .footer {
                            margin-top: 30px;
                            font-size: 14px;
                            color: #999;
                        }
                    </style>
                </head>
                <body>
                    <div class="maintenance-container">
                        <div class="maintenance-icon">🛠️</div>
                        <h1>System Maintenance</h1>
                        <p>Our system is currently undergoing scheduled maintenance to improve your experience.</p>
                        <div class="estimated-time">Estimated completion time: 30 minutes</div>
                        <p>We apologize for any inconvenience this may cause. Thank you for your patience.</p>
                        <button class="refresh-button" onclick="window.location.reload()">Refresh Page</button>
                        <div class="footer">
                            <p>Last updated: ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }
    }
    
    next();
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
                        body {       font-family: Arial, sans-serif;
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
            `);   })
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
app.listen(port, () => console.log('Server listening on port ' + port));