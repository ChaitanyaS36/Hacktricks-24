const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('pub')); 
app.use(session({
    secret: 'your_secret_key', 
    resave: false, 
    saveUninitialized: true, 
    cookie: { secure: false } 
}));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'ctf'
});

connection.connect();

// Serve register.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pub', 'register.html'));
});

// Serve login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pub', 'login.html'));
});

app.post('/login', (req, res) => {
    const { team_name, password } = req.body;
    connection.query('SELECT * FROM users WHERE team_name = ? AND password = ?', [team_name, password], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            req.session.userId = results[0].id; 
            req.session.username = results[0].team_name; 
        }
        res.redirect('/submit');
    });
});

// Serve submit.html (ensure user is logged in)
app.get('/submit', (req, res) => {
    if (req.session.userId) {  
        res.sendFile(path.join(__dirname, 'pub', 'submitflag.html'));
    } else {  
        res.redirect('/login');  
    }
});

app.post('/submit-flag', (req, res) => {
    const { flag } = req.body;
    const userId = req.session.userId;
    const username = req.session.username;

    connection.query('SELECT * FROM flags WHERE flag = ?', [flag], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            connection.query('SELECT * FROM submissions WHERE user_id = ? AND flag = ?', [userId, flag], (err, submissionResults) => {
                if (err) throw err;
                if (submissionResults.length === 0) {
                    connection.query('INSERT INTO submissions (user_id, flag, is_correct) VALUES (?, ?, ?)', [userId, flag, true], (err) => {
                        if (err) throw err;
                        connection.query('UPDATE users SET points = points + ? WHERE id = ?', [results[0].points, userId]);
                        res.send(`Flag submitted successfully for ${username}!`);
                    });
                } else {
                    res.send(`You have already submitted this flag, ${username}!`);
                }
            });
        } else {
            res.send(`Invalid flag!`);
        }
    });
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});