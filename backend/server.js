const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./_middleware/error-handler');
const db = require('./_helpers/db');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

app.use(express.static(publicDir));

const maintenancePagePath = path.join(publicDir, 'maintenance.html');

// Create a simple maintenance.html file if it doesn't exist
if (!fs.existsSync(maintenancePagePath)) {
    const basicMaintenancePage = `
        <!DOCTYPE html>
        <html>
        <head>  <title>System Maintenance</title>
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
                h1 {
                    color: #2b5797;
                }
                p {
                    margin-bottom: 20px;
                }
                .btn {
                    display: inline-block;
                    background-color: #2b5797;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                    border: none;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>System Maintenance</h1>
                <p>Our system is currently undergoing maintenance. We apologize for any inconvenience.</p>
                <p>Estimated completion time: 30 minutes</p>
                <button class="btn" onclick="window.location.reload()">Refresh Page</button>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Last updated: ${new Date().toLocaleString()}</p>
            </div>
        </body>
        </html>
    `;  fs.writeFileSync(maintenancePagePath, basicMaintenancePage);
}

app.get('/api/status', (req, res) => {
    res.json({
        status: db.isConnected ? 'online' : 'maintenance',
        timestamp: new Date().toISOString()
    });
});

app.use((req, res, next) => {
    // Always proceed to the next middleware, ignoring db.isConnected
    next();
    
    /* Original code commented out
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
            return res.status(503).sendFile(maintenancePagePath);
        }
    }
    
    next();
    */
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
                <head> <title>Email Verification</title>
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
            `);   
        })    .catch(error => res.status(400).send('Verification failed: ' + error));
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