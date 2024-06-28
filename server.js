const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3000; // You can change the port number if needed

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Create a connection to the database
const db = mysql.createConnection({
  host: 'localhost', // Replace with your database host
  user: 'root', // Replace with your database username
  password: '', // Replace with your database password
  database: 'myform' // Replace with your database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    return;
  }
  console.log('Connected to the database.');
});

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve the index.html file when accessing the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submission
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const query = 'INSERT INTO users (email, password, reg_date) VALUES (?, ?, NOW())';
    db.query(query, [email, hashedPassword], (err, results) => {
      if (err) {
        console.error('Error inserting data into the database:', err.stack);
        res.status(500).send('Database error');
        return;
      }
      res.status(200).send('Signup successful');
    });
  } catch (err) {
    console.error('Error hashing the password:', err.stack);
    res.status(500).send('Server error');
  }
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists in the database
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
      if (err) {
        console.error('Error retrieving user:', err.stack);
        res.status(500).send('Database error');
        return;
      }

      if (results.length === 0) {
        res.status(401).send('Invalid email or password');
        return;
      }

      // Compare hashed password
      const hashedPassword = results[0].password;
      const isPasswordMatch = await bcrypt.compare(password, hashedPassword);

      if (!isPasswordMatch) {
        res.status(401).send('Invalid email or password');
        return;
      }

      // Login successful
      res.status(200).send('Login successful');
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Internal server error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
