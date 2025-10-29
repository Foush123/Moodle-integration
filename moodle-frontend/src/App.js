import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';

function Navbar() {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px',position:'sticky',top:0,background:'#fff',borderBottom:'1px solid #eee',zIndex:10}}>
      <div style={{fontWeight:700,fontSize:20,color:'#2547D0'}}>Class.</div>
      <div style={{display:'flex',gap:20,alignItems:'center'}}>
        <Link to="/" style={{textDecoration:'none',color:'#0f172a'}}>Buy a course</Link>
        <a href="#success" style={{textDecoration:'none',color:'#0f172a'}}>Success</a>
        <a href="#categories" style={{textDecoration:'none',color:'#0f172a'}}>Categories</a>
        <a href="#pricing" style={{textDecoration:'none',color:'#0f172a'}}>Pricing</a>
      </div>
      <AuthActions />
    </div>
  );
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function setStoredUser(user) {
  try {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } catch (_) {}
}

// Intentionally no explicit logout or login UI
function clearStoredUser() {
  try { localStorage.removeItem('currentUser'); } catch (_) {}
}

function AuthActions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  useEffect(() => {
    const onStorage = () => setUser(getStoredUser());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  if (user) {
    return (
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <Link to="/profile" style={{textDecoration:'none',color:'#0f172a'}}>Profile</Link>
        <span style={{color:'#334155'}}>Hi, {user.firstname || user.username}</span>
        <button onClick={() => { clearStoredUser(); setUser(null); navigate('/'); }} style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:10,background:'#fff',cursor:'pointer'}}>Logout</button>
      </div>
    );
  }
  return (
    <div style={{display:'flex',gap:10}}>
      <Link to="/login" style={{padding:'8px 12px',border:'1px solid #e5e7eb',borderRadius:10,color:'#0f172a',textDecoration:'none'}}>Login</Link>
      <Link to="/register" style={{padding:'8px 14px',border:'2px solid #2b6ef2',borderRadius:10,color:'#2b6ef2',textDecoration:'none',fontWeight:600}}>Get started</Link>
    </div>
  );
}

function Hero() {
  return (
    <div style={{display:'grid',gridTemplateColumns:'1.2fr 1fr',gap:24,alignItems:'center',background:'#e8dd94',borderRadius:24,padding:32,margin:'24px'}}>
      <div>
        <div style={{color:'#0f172a',fontSize:14,marginBottom:8}}>World class education</div>
        <h1 style={{fontSize:54,lineHeight:1.05,margin:'0 0 12px 0',color:'#0f172a'}}>Become <span style={{color:'#1d4ed8'}}>→</span><br/>a professional in<br/>either field.</h1>
        <p style={{color:'#334155',maxWidth:520,marginBottom:16}}>Edcamp helps to gain skills for jobs relevant to the market. Over 1000 courses for both teams and individuals.</p>
        <div style={{display:'flex',gap:12}}>
          <a href="#courses" style={{background:'#0f3c7e',color:'#fff',padding:'12px 16px',borderRadius:12,textDecoration:'none'}}>Get started</a>
          <a href="#learn" style={{background:'#f3f4f6',color:'#111827',padding:'12px 16px',borderRadius:12,textDecoration:'none',border:'1px solid #e5e7eb'}}>Learn more</a>
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'center'}}>
        <div style={{width:360,height:360,background:'#f3f4f6',borderRadius:24,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 10px 30px rgba(0,0,0,0.08)'}}>🤝</div>
      </div>
    </div>
  );
}

function CourseGrid() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/moodle-courses');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setCourses(Array.isArray(result) ? result : []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <div style={{padding:24,textAlign:'center'}}>Loading courses...</div>;
  if (error) return <div style={{padding:24,textAlign:'center',color:'#dc2626'}}>Error: {error}</div>;
  if (courses.length === 0) return <div style={{padding:24,textAlign:'center'}}>No courses found.</div>;

  return (
    <div style={{padding:24,maxWidth:1100,margin:'0 auto'}} id="courses">
      <h2 style={{fontSize:28,fontWeight:700,marginBottom:16}}>Moodle Courses</h2>
      <div style={{display:'grid',gap:16,gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
        {courses.map((course) => (
          <div key={course.id} style={{border:'1px solid #e5e7eb',borderRadius:16,padding:16,background:'#fff',boxShadow:'0 6px 16px rgba(0,0,0,0.04)'}}>
            <h3 style={{fontSize:18,fontWeight:600,margin:'0 0 6px 0'}}>{course.fullname}</h3>
            <p style={{color:'#64748b',fontSize:13,margin:'0 0 10px 0'}}>{course.shortname}</p>
            <div style={{fontSize:13,color:'#334155'}}>
              {course.categoryid && <p><strong>Category ID:</strong> {course.categoryid}</p>}
              {course.idnumber && <p><strong>ID Number:</strong> {course.idnumber}</p>}
              {course.startdate && <p><strong>Start Date:</strong> {new Date(course.startdate * 1000).toLocaleDateString()}</p>}
            </div>
            <Link to={`/courses/${course.id}`} state={{ title: course.fullname }} style={{display:'inline-block',marginTop:12,width:'100%',textAlign:'center',background:'#2563eb',color:'#fff',padding:'10px 12px',border:'none',borderRadius:10,cursor:'pointer',textDecoration:'none'}}>View details</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div>
      <Navbar />
      <Hero />
      <CourseGrid />
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username:'', password:'', firstname:'', lastname:'', email:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const normalized = { ...form, username: form.username.trim().toLowerCase() };
      if (!normalized.username) {
        throw new Error('Please enter a valid username');
      }
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      // If backend returned the created user, sign-in locally immediately
      if (data?.user) {
        setStoredUser({
          id: data.user.id,
          username: data.user.username,
          firstname: data.user.firstname,
          lastname: data.user.lastname,
          token: '76b0021b6dd8585361cc977655a27ab0',
        });
        setSuccess('Account created and signed in');
        setTimeout(() => navigate('/'), 1000);
        return;
      }
      // Fallback to manual login page
      setSuccess('Account created. Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{maxWidth:520,margin:'32px auto',padding:24,border:'1px solid #e5e7eb',borderRadius:16,background:'#fff',boxShadow:'0 8px 20px rgba(0,0,0,0.05)'}}>
        <h2 style={{marginTop:0}}>Create your account</h2>
        <form onSubmit={onSubmit}>
          <div style={{display:'grid',gap:12}}>
            <input name="username" placeholder="Username" value={form.username} onChange={onChange} required style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
            <input name="password" type="password" placeholder="Password" value={form.password} onChange={onChange} required style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
            <input name="firstname" placeholder="First name" value={form.firstname} onChange={onChange} required style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
            <input name="lastname" placeholder="Last name" value={form.lastname} onChange={onChange} required style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
            <input name="email" type="email" placeholder="Email" value={form.email} onChange={onChange} required style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
          </div>
          {error && <div style={{color:'#dc2626',marginTop:10}}>{error}</div>}
          {success && <div style={{color:'#16a34a',marginTop:10}}>{success}</div>}
          <button disabled={submitting} style={{marginTop:16,width:'100%',background:'#2563eb',color:'#fff',padding:'12px 14px',border:'none',borderRadius:10,cursor:'pointer'}}>
            {submitting ? 'Creating...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Login UI removed per request
function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [service, setService] = useState(localStorage.getItem('moodleService') || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = { username: username.trim().toLowerCase(), password };
      if (!payload.username) {
        throw new Error('Please enter a valid username');
      }
      if (service.trim()) payload.service = service.trim();
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      setStoredUser({
        id: data?.user?.userid || data?.user?.id,
        username: data?.user?.username,
        firstname: data?.user?.firstname,
        lastname: data?.user?.lastname,
        token: '76b0021b6dd8585361cc977655a27ab0',
      });
      if (service.trim()) localStorage.setItem('moodleService', service.trim());
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{maxWidth:420,margin:'32px auto',padding:24,border:'1px solid #e5e7eb',borderRadius:16,background:'#fff',boxShadow:'0 8px 20px rgba(0,0,0,0.05)'}}>
        <h2 style={{marginTop:0}}>Login</h2>
        <form onSubmit={onSubmit}>
          <div style={{display:'grid',gap:12}}>
            <input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="Username" required style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" required style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
            <input value={service} onChange={(e)=>setService(e.target.value)} placeholder="Service (optional)" style={{padding:12,borderRadius:10,border:'1px solid #e5e7eb'}} />
          </div>
          {error && <div style={{color:'#dc2626',marginTop:10}}>{error}</div>}
          <button disabled={submitting} style={{marginTop:16,width:'100%',background:'#2563eb',color:'#fff',padding:'12px 14px',border:'none',borderRadius:10,cursor:'pointer'}}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CourseDetails() {
  const { id } = useParams();
  const location = useLocation();
  const titleFromState = location.state?.title;
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollUsername, setEnrollUsername] = useState('');
  const [enrollRoleId, setEnrollRoleId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(getStoredUser());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [metaRes, contentsRes] = await Promise.all([
          fetch(`/api/courses/${id}`),
          fetch(`/api/courses/${id}/contents`),
        ]);
        const meta = await metaRes.json();
        const contents = await contentsRes.json();
        if (meta?.exception) throw new Error(meta.message);
        if (contents?.exception) throw new Error(contents.message);
        setCourse(meta?.courses?.[0] || null);
        setSections(Array.isArray(contents) ? contents : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div>
      <Navbar />
      <div style={{maxWidth:1100,margin:'0 auto',padding:24}}>
        <h2 style={{marginTop:0}}>{titleFromState || course?.fullname || 'Course details'}</h2>
        {loading && <div>Loading course...</div>}
        {error && <div style={{color:'#dc2626'}}>{error}</div>}
        {!loading && !error && (
          <div>
            <div style={{marginBottom:16,padding:16,border:'1px solid #e5e7eb',borderRadius:14,background:'#fff'}}>
              <div style={{fontWeight:600,marginBottom:8}}>Enroll into this course</div>
              {currentUser ? (
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <button
                    onClick={async () => {
                      setEnrollMessage('');
                      try {
                        setEnrolling(true);
                        const body = { username: currentUser.username, courseid: Number(id) };
                        if (enrollRoleId) body.roleid = Number(enrollRoleId);
                        const res = await fetch('/api/enroll', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Enrollment failed');
                        setEnrollMessage(`Enrolled: user ${data.userid} into course ${data.courseid} (role ${data.roleid})`);
                      } catch (e) {
                        setEnrollMessage(`Error: ${e.message}`);
                      } finally {
                        setEnrolling(false);
                      }
                    }}
                    disabled={enrolling}
                    style={{background:'#2563eb',color:'#fff',padding:'10px 12px',border:'none',borderRadius:10,cursor:'pointer'}}
                  >
                    {enrolling ? 'Enrolling…' : 'Enroll me'}
                  </button>
                  <input
                    placeholder="Role ID (default 5)"
                    value={enrollRoleId}
                    onChange={(e) => setEnrollRoleId(e.target.value)}
                    style={{padding:10,border:'1px solid #e5e7eb',borderRadius:10}}
                  />
                </div>
              ) : (
                <div style={{display:'grid',gap:8,gridTemplateColumns:'1fr 180px 140px'}}>
                  <input
                    placeholder="Username"
                    value={enrollUsername}
                    onChange={(e) => setEnrollUsername(e.target.value)}
                    style={{padding:10,border:'1px solid #e5e7eb',borderRadius:10}}
                  />
                  <input
                    placeholder="Role ID (default 5)"
                    value={enrollRoleId}
                    onChange={(e) => setEnrollRoleId(e.target.value)}
                    style={{padding:10,border:'1px solid #e5e7eb',borderRadius:10}}
                  />
                  <button
                    onClick={async () => {
                      setEnrollMessage('');
                      if (!enrollUsername) {
                        setEnrollMessage('Please enter a username');
                        return;
                      }
                      try {
                        setEnrolling(true);
                        const body = {
                          username: enrollUsername.trim().toLowerCase(),
                          courseid: Number(id),
                        };
                        if (enrollRoleId) body.roleid = Number(enrollRoleId);
                        const res = await fetch('/api/enroll', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data?.error || 'Enrollment failed');
                        setEnrollMessage(`Enrolled: user ${data.userid} into course ${data.courseid} (role ${data.roleid})`);
                      } catch (e) {
                        setEnrollMessage(`Error: ${e.message}`);
                      } finally {
                        setEnrolling(false);
                      }
                    }}
                    disabled={enrolling}
                    style={{background:'#2563eb',color:'#fff',padding:'10px 12px',border:'none',borderRadius:10,cursor:'pointer'}}
                  >
                    {enrolling ? 'Enrolling…' : 'Enroll user'}
                  </button>
                </div>
              )}
              {enrollMessage && <div style={{marginTop:8,color: enrollMessage.startsWith('Error:') ? '#dc2626' : '#16a34a'}}>{enrollMessage}</div>}
            </div>
            {sections.map((section) => (
              <div key={section.id} style={{marginBottom:16,border:'1px solid #e5e7eb',borderRadius:14,padding:16}}>
                <div style={{fontWeight:600,marginBottom:8}}>{section.name || `Section ${section.section}`}</div>
                {Array.isArray(section.modules) && section.modules.length > 0 ? (
                  <ul style={{margin:0,paddingLeft:18}}>
                    {section.modules.map((m) => {
                      const token = (currentUser && currentUser.token) ? currentUser.token : '76b0021b6dd8585361cc977655a27ab0';
                      return (
                        <li key={m.id} style={{margin:'10px 0'}}>
                          <div>
                            <div style={{display:'flex',gap:8,alignItems:'baseline',flexWrap:'wrap'}}>
                              <span style={{fontWeight:600}}>{m.name}</span>
                              <span style={{color:'#64748b'}}>— {m.modname}</span>
                              {m.url && (
                                <a href={m.url} target="_blank" rel="noreferrer" style={{color:'#2563eb'}}>Open</a>
                              )}
                            </div>
                            {m.description && (
                              <div style={{marginTop:6,color:'#334155'}} dangerouslySetInnerHTML={{ __html: m.description }} />
                            )}
                            {Array.isArray(m.contents) && m.contents.length > 0 && (
                              <div style={{marginTop:6}}>
                                <div style={{fontSize:12,color:'#64748b',marginBottom:4}}>Files:</div>
                                <ul style={{margin:0,paddingLeft:18}}>
                                  {m.contents.map((c) => {
                                    const hasToken = typeof c.fileurl === 'string' && c.fileurl.includes('token=');
                                    const urlSep = typeof c.fileurl === 'string' && c.fileurl.includes('?') ? '&' : '?';
                                    const href = typeof c.fileurl === 'string' ? (hasToken ? c.fileurl : `${c.fileurl}${urlSep}token=${token}`) : '#';
                                    return (
                                      <li key={c.fileurl || Math.random()} style={{margin:'4px 0'}}>
                                        <a href={href} target="_blank" rel="noreferrer" style={{color:'#2563eb'}}>
                                          {c.filename || c.fileurl || 'Download'}
                                        </a>
                                        {c.filesize ? <span style={{color:'#64748b',marginLeft:6}}>({Math.round(c.filesize/1024)} KB)</span> : null}
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div style={{color:'#64748b'}}>No activities in this section.</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/courses/:id" element={<CourseDetails />} />
    </Routes>
  );
}