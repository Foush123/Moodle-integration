const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const MOODLE_URL = 'http://localhost/moodle/webservice/rest/server.php';
const MOODLE_TOKEN_URL = 'http://localhost/moodle/login/token.php';
const WS_TOKEN = 'a2cd2377ff57c4d85ee67c58544ee941';
// External service shortname to request user tokens. Ensure this service exists and includes needed functions
const USER_SERVICE = 'moodle_mobile_app';

// Create Moodle user (idempotent by username)
app.post('/api/register', async (req, res) => {
  try {
    let { username, password, firstname, lastname, email } = req.body || {};
    if (typeof username === 'string') username = username.trim().toLowerCase();

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

// Get a single course by id (basic metadata)
app.get('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const params = new URLSearchParams();
    params.append('wstoken', WS_TOKEN);
    params.append('wsfunction', 'core_course_get_courses_by_field');
    params.append('moodlewsrestformat', 'json');
    params.append('field', 'id');
    params.append('value', id);

    const response = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await response.json();
    if (data && data.exception) {
      return res.status(400).json({ error: data.message, details: data });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get course sections and activities
app.get('/api/courses/:id/contents', async (req, res) => {
  try {
    const { id } = req.params;
    const params = new URLSearchParams();
    params.append('wstoken', WS_TOKEN);
    params.append('wsfunction', 'core_course_get_contents');
    params.append('moodlewsrestformat', 'json');
    params.append('courseid', id);
    // include section/module details
    params.append('options[0][name]', 'includestealthmodules');
    params.append('options[0][value]', '1');

    const response = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await response.json();
    if (data && data.exception) {
      return res.status(400).json({ error: data.message, details: data });
    }
    res.json(data);
  } catch (error) {
    console.error('Error fetching course contents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Diagnostics: verify REST token/service and user context
app.get('/api/moodle-siteinfo', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('wstoken', WS_TOKEN);
    params.append('wsfunction', 'core_webservice_get_site_info');
    params.append('moodlewsrestformat', 'json');
    const response = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await response.json();
    if (data && data.exception) {
      return res.status(400).json({ error: data.message, details: data });
    }
    res.json(data);
  } catch (error) {
    console.error('Error calling site info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lightweight login: resolves Moodle user by username (idempotent, no password check here)
app.post('/api/login', async (req, res) => {
  try {
    let { username, password, service } = req.body || {};
    if (typeof username === 'string') username = username.trim().toLowerCase();
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing username or password' });
    }

    // Since token.php isn't working with your service setup, 
    // we'll use the admin token to verify the user exists and return a mock token
    // In production, you'd want to set up proper user authentication
    
    // 1) Check if user exists using admin token
    const checkParams = new URLSearchParams();
    checkParams.append('wstoken', WS_TOKEN);
    checkParams.append('wsfunction', 'core_user_get_users_by_field');
    checkParams.append('moodlewsrestformat', 'json');
    checkParams.append('field', 'username');
    checkParams.append('values[0]', username);

    const checkResp = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: checkParams.toString(),
    });
    const checkData = await checkResp.json();
    
    if (checkData && checkData.exception) {
      return res.status(400).json({ error: checkData.message || 'User lookup failed', details: checkData });
    }
    if (!Array.isArray(checkData) || checkData.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = checkData[0];
    
    // 2) Return user info with a mock token (since we can't get real user tokens)
    // In a real setup, you'd either:
    // - Fix the service configuration to allow token.php
    // - Use a different auth method
    // - Generate your own session tokens
    return res.json({ 
      token: `mock_token_${user.id}_${Date.now()}`, 
      user: {
        userid: user.id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login using a pre-generated Moodle token (Manage tokens) and return profile
app.post('/api/login-with-token', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'Missing token' });
    }

    const siteParams = new URLSearchParams();
    siteParams.append('wstoken', token);
    siteParams.append('wsfunction', 'core_webservice_get_site_info');
    siteParams.append('moodlewsrestformat', 'json');

    const siteResp = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: siteParams.toString(),
    });
    const siteData = await siteResp.json();
    if (!siteResp.ok || (siteData && siteData.exception)) {
      return res.status(siteResp.status || 400).json({ error: siteData?.message || 'Invalid token', details: siteData });
    }
    return res.json({ token, user: siteData });
  } catch (error) {
    console.error('Error during token login:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enroll a user into a Moodle course (manual enrol method)
app.post('/api/enroll', async (req, res) => {
  try {
    let { username, userid, courseid, roleid } = req.body || {};
    if (typeof username === 'string') username = username.trim().toLowerCase();

    if (!courseid) {
      return res.status(400).json({ error: 'Missing required field: courseid' });
    }
    if (!username && !userid) {
      return res.status(400).json({ error: 'Provide either username or userid' });
    }

    // Resolve user id if username provided
    let resolvedUserId = userid;
    if (!resolvedUserId && username) {
      const lookupParams = new URLSearchParams();
      lookupParams.append('wstoken', WS_TOKEN);
      lookupParams.append('wsfunction', 'core_user_get_users_by_field');
      lookupParams.append('moodlewsrestformat', 'json');
      lookupParams.append('field', 'username');
      lookupParams.append('values[0]', username);

      const lookupResp = await fetch(MOODLE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: lookupParams.toString(),
      });
      const lookupData = await lookupResp.json();
      if (lookupData && lookupData.exception) {
        return res.status(400).json({ error: lookupData.message || 'Moodle lookup error', details: lookupData });
      }
      if (!Array.isArray(lookupData) || lookupData.length === 0 || !lookupData[0]?.id) {
        return res.status(404).json({ error: 'User not found in Moodle by username' });
      }
      resolvedUserId = lookupData[0].id;
    }

    // Default student role id in Moodle is typically 5, allow override
    const effectiveRoleId = roleid ?? 5;

    const enrolParams = new URLSearchParams();
    enrolParams.append('wstoken', WS_TOKEN);
    enrolParams.append('wsfunction', 'enrol_manual_enrol_users');
    enrolParams.append('moodlewsrestformat', 'json');
    enrolParams.append('enrolments[0][roleid]', String(effectiveRoleId));
    enrolParams.append('enrolments[0][userid]', String(resolvedUserId));
    enrolParams.append('enrolments[0][courseid]', String(courseid));

    const enrolResp = await fetch(MOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: enrolParams.toString(),
    });
    const enrolData = await enrolResp.json();

    // Success returns empty object {}, errors return exception structure
    if (enrolData && enrolData.exception) {
      return res.status(400).json({ error: enrolData.message || 'Moodle enrol error', details: enrolData });
    }

    return res.json({ enrolled: true, userid: Number(resolvedUserId), courseid: Number(courseid), roleid: Number(effectiveRoleId) });
  } catch (error) {
    console.error('Error enrolling user into course:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});