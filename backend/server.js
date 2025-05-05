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

// Add status endpoint to check API health
app.get('/api/status', (req, res) => {
    res.json({
        status: db.isConnected ? 'online' : 'maintenance',
        timestamp: new Date().toISOString()
    });
});

// Add database maintenance mode middleware
app.use((req, res, next) => {
    // Skip for status endpoints, static resources, and email verification
    if (req.path === '/api/status' || 
        req.path.startsWith('/api-docs') || 
        req.path === '/accounts/verify-email' ||
        req.path === '/account/verify-email') {
        return next();
    }
    
    // If database is not connected, return maintenance mode response
    if (!db.isConnected) {
        return res.status(503).json({ 
            message: 'Service temporarily unavailable, maintenance in progress', 
            status: 'maintenance' 
        });
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