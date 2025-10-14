import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

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
        const response = await fetch('http://localhost:5000/api/moodle-courses');
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
            <button style={{marginTop:12,width:'100%',background:'#2563eb',color:'#fff',padding:'10px 12px',border:'none',borderRadius:10,cursor:'pointer'}}>View Course</button>
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
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setSuccess('Account created successfully');
      setTimeout(() => navigate('/'), 1200);
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}