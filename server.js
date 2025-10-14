const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MOODLE_URL = 'http://localhost/moodle/webservice/rest/server.php';
const WS_TOKEN = 'a2cd2377ff57c4d85ee67c58544ee941';

// Create Moodle user
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, firstname, lastname, email } = req.body || {};

    if (!username || !password || !firstname || !lastname || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const params = new URLSearchParams();
    params.append('wstoken', WS_TOKEN);
    params.append('wsfunction', 'core_user_create_users');
    params.append('moodlewsrestformat', 'json');
    // users[0][field]=value format required by Moodle
    params.append('users[0][username]', username);
    params.append('users[0][password]', password);
    params.append('users[0][firstname]', firstname);
    params.append('users[0][lastname]', lastname);
    params.append('users[0][email]', email);

    const response = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.message || 'Moodle error' });
    }

    // Moodle returns created user ids or an error structure
    return res.json(data);
  } catch (error) {
    console.error('Error creating Moodle user:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/moodle-courses', async (req, res) => {
  try {
    const url = `${MOODLE_URL}?wstoken=${WS_TOKEN}&wsfunction=core_course_get_courses&moodlewsrestformat=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Moodle error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from Moodle:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});