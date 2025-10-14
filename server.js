const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MOODLE_URL = 'http://localhost/moodle/webservice/rest/server.php';
const WS_TOKEN = 'a2cd2377ff57c4d85ee67c58544ee941';

// Create Moodle user (idempotent by username)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, firstname, lastname, email } = req.body || {};

    if (!username || !password || !firstname || !lastname || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Helper to POST form-encoded to Moodle
    const postToMoodle = async (formParams) => {
      const response = await fetch(MOODLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formParams.toString(),
      });
      const data = await response.json();
      return { response, data };
    };

    // 1) Check if user already exists by username
    const checkParams = new URLSearchParams();
    checkParams.append('wstoken', WS_TOKEN);
    checkParams.append('wsfunction', 'core_user_get_users_by_field');
    checkParams.append('moodlewsrestformat', 'json');
    checkParams.append('field', 'username');
    checkParams.append('values[0]', username);
    const { data: existingUsers } = await postToMoodle(checkParams);

    // Moodle can return { exception, errorcode, message } with HTTP 200
    if (existingUsers && existingUsers.exception) {
      return res.status(400).json({ error: existingUsers.message || 'Moodle lookup error', details: existingUsers });
    }

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      // Already present in Moodle user list
      return res.json({ created: false, user: existingUsers[0] });
    }

    // 2) Create user when not found
    const createParams = new URLSearchParams();
    createParams.append('wstoken', WS_TOKEN);
    createParams.append('wsfunction', 'core_user_create_users');
    createParams.append('moodlewsrestformat', 'json');
    // users[0][field]=value format required by Moodle
    createParams.append('users[0][username]', username);
    createParams.append('users[0][password]', password); // Requires manual auth policy
    createParams.append('users[0][firstname]', firstname);
    createParams.append('users[0][lastname]', lastname);
    createParams.append('users[0][email]', email);
    createParams.append('users[0][auth]', 'manual');

    const { response: createResp, data: createData } = await postToMoodle(createParams);

    // Treat Moodle JSON error objects as failures even with 200 status
    if (createData && createData.exception) {
      return res.status(400).json({ error: createData.message || 'Moodle error', details: createData });
    }
    if (!createResp.ok) {
      return res.status(createResp.status).json({ error: createData?.message || 'Moodle error' });
    }
    // Success shape is usually an array of { id: number }
    if (!Array.isArray(createData) || createData.length === 0 || !createData[0]?.id) {
      return res.status(500).json({ error: 'Unexpected Moodle response', details: createData });
    }

    return res.json({ created: true, id: createData[0].id });
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