const express = require('express');  
const mysql = require('mysql2');  
const bodyParser = require('body-parser');  
const path = require('path');
const session = require('express-session');
const app = express();  

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(express.static('pub'));  // Ensure static files are served  
app.use(session({  
    secret: 'your_secret_key', // change this to a more secure secret  
    resave: false,  
    saveUninitialized: true,  
    cookie: { secure: false } // Set to true if using HTTPS  
}));

const connection = mysql.createConnection({  
    host: 'localhost',  
    user: 'root',  
    password: 'root',  
    database: 'hacktricksNew'  
});  

connection.connect();  

// Serve register.html
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pub', 'register.html'));
});

app.post('/register', (req, res) => {
    const { team_name, password } = req.body;
    connection.query('SELECT * FROM teams WHERE team_name = ?', [team_name], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error registering team');
        } else if (results.length > 0) {
            res.send('Team already registered');
        } else {
            connection.query('INSERT INTO teams (team_name, password) VALUES(?, ?)', [team_name, password], (err, results) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error registering team');
                } else {
                    req.session.userId = results.insertId;
                    res.redirect('/submit');
                }
            });
        }
    });
});

// Serve login.html
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pub', 'login.html'));
});

app.post('/login', (req, res) => {
    const { team_name, password } = req.body;
    connection.query('SELECT * FROM teams WHERE team_name = ? AND password = ?', [team_name, password], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error logging in');
        } else if (results.length > 0) {
            req.session.userId = results[0].id;
            res.redirect('/submit');
        } else if (team_name === 'host_name' && password === 'host_password') {
            req.session.host = true;
            res.redirect('/scoreboard');
        } else {
            res.send('Invalid team name or password');
        }
    });
});

// Serve scoreboard (only for host)
app.get('/scoreboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pub', 'scoreboard.html'));
});

app.get('/scoreboard/data', async (req, res) => {
  console.log('Requesting scoreboard data...');
  try {
    const result = await connection.execute('SELECT team_name, points FROM teams ORDER BY points DESC');
    console.log('Result:', result);
    const rows = result[0];
    console.log('Rows:', rows);
    if (rows.length === 0) {
      res.json({ message: 'No data found' });
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error retrieving scoreboard data' });
  }
});

// Serve submit.html (ensure user is logged in)
app.get('/submit', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'pub', 'submitflag.html'));
    } else {
        res.redirect('/login');
    }
});

app.post('/submit', (req, res) => {
    const { flag } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login');
    }

    connection.query('SELECT * FROM submissions WHERE team_id = ? AND flag = ?', [userId, flag], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error submitting flag');
        } else if (results.length > 0) {
            res.send('You have already submitted this flag');
        } else {
            connection.query('SELECT * FROM flags WHERE flag = ?', [flag], (err, results) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error submitting flag');
                } else if (results.length > 0) {
                    connection.query('INSERT INTO submissions (team_id, flag, is_correct) VALUES (?, ?, ?)', [userId, flag, true], (err) => {
                        if (err) {
                            console.error(err);
                            res.status(500).send('Error submitting flag');
                        } else {
                            connection.query('UPDATE teams SET points = points + ? WHERE id = ?', [results[0].points, userId], (err) => {
                                if (err) {
                                    console.error(err);
                                    res.status(500).send('Error submitting flag');
                                } else {
                                    res.redirect('/submit');
                                }
                            });
                        }
                    });
                } else {
                    res.send('Invalid flag submitted');
                }
            });
        }
    });
});

app.listen(3000, () => {  
    console.log('Server is running on http://localhost:3000');  
});
