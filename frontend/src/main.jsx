import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Users, ClipboardList, MapPinned, FileText,
  Settings, Search, Bell, Plus, MapPin, Clock3, CheckCircle2,
  AlertCircle, Menu, LogOut, UploadCloud, ArrowUpRight,
  ShieldCheck, Activity, X, File, LocateFixed, Filter,
  ChevronRight, CalendarDays, UserRound, Save, Pencil
} from 'lucide-react';
import './styles.css';
import { PublicSurvey, SurveyAdmin } from './Survey';

const API = 'http://127.0.0.1:8000';

const demoUsers = [
  { id:'u1', name:'Aarav Sharma', username:'aarav', area:'Ward 04', status:'active', lat:30.3398, lng:76.3869, last_seen:new Date().toISOString() },
  { id:'u2', name:'Simran Kaur', username:'simran', area:'Ward 07', status:'active', lat:30.347, lng:76.4, last_seen:new Date().toISOString() },
  { id:'u3', name:'Rahul Verma', username:'rahul', area:'Village North', status:'offline', lat:30.33, lng:76.37, last_seen:new Date().toISOString() }
];

const demoEntries = [
  { id:'e1', title:'Community visit summary', area:'Ward 04', notes:'Met local residents; follow-up requested.', created_by_name:'Aarav Sharma', created_at:new Date(Date.now()-12*60000).toISOString(), status:'Pending', files:[] },
  { id:'e2', title:'Field observation', area:'Ward 07', notes:'Uploaded field notes for review.', created_by_name:'Simran Kaur', created_at:new Date(Date.now()-55*60000).toISOString(), status:'Approved', files:[] },
  { id:'e3', title:'Local infrastructure note', area:'Village North', notes:'Site observation submitted for verification.', created_by_name:'Rahul Verma', created_at:new Date(Date.now()-2*3600000).toISOString(), status:'Rejected', files:[] }
];

const demoTasks = [
  { id:'t1', title:'Complete assigned area visit', area:'Ward 04', assigned_to:'u1', due_date:'2026-11-10', status:'In Progress' },
  { id:'t2', title:'Submit field observations', area:'Ward 07', assigned_to:'u2', due_date:'2026-11-12', status:'Pending' }
];

const initials = name =>
  (name || '?').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();

const fmt = s =>
  s ? new Date(s).toLocaleString([], {
    month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'
  }) : 'Not reported';

function App() {
  if (window.location.pathname === '/survey') return <PublicSurvey />;
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Update the dashboard clock every second using the browser's local time.
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting =
    hour >= 5 && hour < 12 ? 'Good Morning' :
    hour >= 12 && hour < 17 ? 'Good Afternoon' :
    hour >= 17 && hour < 21 ? 'Good Evening' :
    'Good Night';

  const [user, setUser] = useState(null);
  const [loginMode, setLoginMode] = useState('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [page, setPage] = useState('Overview');

  const [data, setData] = useState({
    users:demoUsers,
    entries:demoEntries,
    tasks:demoTasks,
    activity:[],
    stats:{
      total_users:3,
      active_users:2,
      total_entries:3,
      pending_review:1,
      tasks_open:2
    }
  });

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const [showEntry, setShowEntry] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showTask, setShowTask] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [entryForm, setEntryForm] = useState({
    title:'', area:'', notes:''
  });

  const [entryFiles, setEntryFiles] = useState([]);

  const [newUser, setNewUser] = useState({
    name:'',
    username:'',
    password:'field123',
    area:''
  });

  const [newTask, setNewTask] = useState({
    title:'',
    area:'',
    assigned_to:'u1',
    due_date:''
  });

  const [isDemo, setIsDemo] = useState(true);

  // MY PROFILE STATES
  const [myProfile, setMyProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name:'',
    area:''
  });

  const isAdmin = user?.role === 'admin' || user?.id === 'admin';
  const isCandidate = user?.role === 'candidate';
  const isFieldUser = Boolean(user) && !isAdmin && !isCandidate;

  // LOGOUT FUNCTION - ADMIN AND FIELD USER
  function handleLogout() {
    setUser(null);
    setPage('Overview');

    setLoginMode('admin');
    setUsername('admin');
    setPassword('admin123');

    setMyProfile(null);
    setProfileLoading(false);
    setEditingProfile(false);
    setProfileForm({ name:'', area:'' });

    setSelectedUser(null);
    setMobileNav(false);

    setShowEntry(false);
    setShowUser(false);
    setShowTask(false);

    setEntryForm({ title:'', area:'', notes:'' });
    setEntryFiles([]);

    setQuery('');
    setNotice('You have been logged out successfully.');
  }

  async function refresh() {
    try {
      const r = await fetch(`${API}/api/dashboard`);
      if (!r.ok) throw Error();
      const d = await r.json();
      setData(d);
      setIsDemo(false);
    } catch {
      setIsDemo(true);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  // LOGIN
  async function login(e) {
    e.preventDefault();

    if (loginMode === 'admin') {
      if (username === 'admin' && password === 'admin123') {
        setUser({ id:'admin', name:'Admin User', role:'admin' });
        setPage('Overview');
        setNotice('Welcome back, Admin.');
      } else {
        setNotice('Demo admin: use admin / admin123');
      }
    } else if (loginMode === 'candidate') {
      if (username === 'candidate' && password === 'candidate123') {
        setUser({ id:'candidate', name:'Candidate Viewer', username:'candidate', role:'candidate' });
        setPage('Team Activity');
        setNotice('Welcome, Candidate. You have read-only team visibility.');
      } else {
        setNotice('Candidate demo: use candidate / candidate123');
      }
    } else {
      try {
        const r = await fetch(`${API}/api/login`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ username, password })
        });

        if (!r.ok) throw Error();

        const d = await r.json();
        setUser(d.user);
        setPage('My Field');
        setNotice(`Welcome, ${d.user.name}`);
      } catch {
        const u = demoUsers.find(x => x.username === username);

        if (u && password === 'field123') {
          setUser(u);
          setPage('My Field');
          setNotice(`Welcome, ${u.name} (demo mode)`);
        } else {
          setNotice('Field demo: aarav / field123');
        }
      }
    }
  }

  // LOCATION
  async function sendLocation(posUser) {
    const u = posUser || user;
    if (!u || u.role === 'admin' || u.role === 'candidate') return;

    const send = async (lat, lng) => {
      try {
        await fetch(`${API}/api/location`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ user_id:u.id, lat, lng })
        });
      } catch {}

      setData(old => ({
        ...old,
        users:old.users.map(x =>
          x.id === u.id
            ? { ...x, lat, lng, status:'active', last_seen:new Date().toISOString() }
            : x
        )
      }));

      setNotice('Location updated for this demo session.');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => send(p.coords.latitude, p.coords.longitude),
        () => setNotice('Location permission unavailable. Allow location in browser.'),
        { enableHighAccuracy:true, timeout:8000 }
      );
    } else {
      setNotice('Geolocation is not supported by this browser.');
    }
  }

  // SUBMIT ENTRY
  async function submitEntry(e) {
    e.preventDefault();

    if (!entryForm.title.trim()) {
      setNotice('Please add a title');
      return;
    }

    const u = isFieldUser ? user : data.users[0];

    try {
      const fd = new FormData();
      fd.append('user_id', u.id);
      fd.append('title', entryForm.title);
      fd.append('area', entryForm.area || u.area || '');
      fd.append('notes', entryForm.notes);

      if (u.lat) fd.append('lat', u.lat);
      if (u.lng) fd.append('lng', u.lng);

      entryFiles.forEach(f => fd.append('files', f));

      const r = await fetch(`${API}/api/entries`, {
        method:'POST',
        body:fd
      });

      if (!r.ok) throw Error();
    } catch {
      setData(d => ({
        ...d,
        entries:[
          {
            id:'e'+Date.now(),
            ...entryForm,
            area:entryForm.area || u.area,
            created_by_name:u.name,
            created_at:new Date().toISOString(),
            status:'Pending',
            files:entryFiles.map(f => ({ name:f.name, local:true }))
          },
          ...d.entries
        ]
      }));
    }

    setShowEntry(false);
    setEntryForm({ title:'', area:'', notes:'' });
    setEntryFiles([]);
    setNotice('Entry submitted for admin review.');
    refresh();
  }

  // CREATE USER
  async function createUser(e) {
    e.preventDefault();

    try {
      const r = await fetch(`${API}/api/users`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify(newUser)
      });

      if (!r.ok) throw Error();
    } catch {
      setData(d => ({
        ...d,
        users:[
          ...d.users,
          {
            ...newUser,
            id:'u'+Date.now(),
            status:'offline',
            lat:null,
            lng:null
          }
        ]
      }));
    }

    setShowUser(false);
    setNewUser({ name:'', username:'', password:'field123', area:'' });
    setNotice('Field user created.');
    refresh();
  }

  // CREATE TASK
  async function createTask(e) {
    e.preventDefault();

    try {
      const r = await fetch(`${API}/api/tasks`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify(newTask)
      });

      if (!r.ok) throw Error();
    } catch {
      setData(d => ({
        ...d,
        tasks:[
          { ...newTask, id:'t'+Date.now(), status:'Pending' },
          ...d.tasks
        ]
      }));
    }

    setShowTask(false);
    setNotice('Task assigned successfully.');
    refresh();
  }

  // REVIEW ENTRY
  async function review(entry, status) {
    try {
      await fetch(`${API}/api/entries/${entry.id}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ status })
      });
    } catch {}

    setData(d => ({
      ...d,
      entries:d.entries.map(x =>
        x.id === entry.id ? { ...x, status } : x
      )
    }));

    setNotice(`Entry marked ${status.toLowerCase()}.`);
    refresh();
  }

  // LOAD FIELD USER PROFILE
  async function loadMyProfile() {
    if (!user || !isFieldUser) return;

    setProfileLoading(true);

    try {
      const response = await fetch(
        `${API}/api/users/${user.id}/profile`
      );

      if (!response.ok) throw Error('Profile API failed');

      const result = await response.json();
      const profile = result.profile || result.user || result;

      setMyProfile(result);

      setProfileForm({
        name:profile.name || user.name || '',
        area:profile.area || user.area || ''
      });
    } catch {
      setMyProfile({
        profile:{
          name:user.name,
          username:user.username,
          area:user.area,
          id:user.id
        },
        stats:{}
      });

      setProfileForm({
        name:user.name || '',
        area:user.area || ''
      });
    } finally {
      setProfileLoading(false);
    }
  }

  // SAVE FIELD USER PROFILE
  async function saveMyProfile(e) {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API}/api/users/${user.id}/profile`,
        {
          method:'PATCH',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify(profileForm)
        }
      );

      if (!response.ok) throw Error('Profile update failed');

      const result = await response.json();
      const updatedProfile = result.profile || result.user || result;

      const updatedUser = {
        ...user,
        name:updatedProfile.name || profileForm.name,
        area:updatedProfile.area || profileForm.area
      };

      setUser(updatedUser);

      setMyProfile(old => ({
        ...(old || {}),
        profile:updatedProfile
      }));

      setEditingProfile(false);
      setNotice('Profile updated successfully!');

      await refresh();
      await loadMyProfile();
    } catch {
      setNotice('Profile update failed. Check backend connection.');
    }
  }

  useEffect(() => {
    if (page === 'My Profile' && user && isFieldUser) {
      loadMyProfile();
    }
  }, [page, user?.id, isFieldUser]);

  const filteredUsers = useMemo(
    () => data.users.filter(u =>
      (u.name+' '+u.area+' '+u.username).toLowerCase().includes(query.toLowerCase())
    ),
    [data.users, query]
  );

  const filteredEntries = useMemo(
    () => data.entries.filter(x =>
      (x.title+' '+x.area+' '+x.created_by_name).toLowerCase().includes(query.toLowerCase())
    ),
    [data.entries, query]
  );

  const nav = isAdmin
    ? [
        { name:'Overview', icon:LayoutDashboard },
        { name:'Field Users', icon:Users },
        { name:'Live Tracking', icon:MapPinned },
        { name:'Data Entries', icon:ClipboardList },
        { name:'Tasks & Assignments', icon:CalendarDays },
        { name:'Public Survey', icon:ClipboardList }
      ]
    : isCandidate
      ? [
          { name:'Team Activity', icon:Activity }
        ]
      : [
          { name:'My Field', icon:LayoutDashboard },
          { name:'My Submissions', icon:ClipboardList },
          { name:'My Tasks', icon:CalendarDays },
          { name:'My Profile', icon:UserRound }
        ];

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="login-shell">
        <div className="login-art">
          <div className="brand light">
            <div className="brand-mark"><ShieldCheck size={24}/></div>
            <div>
              <b>FieldPulse</b>
              <span>Election Field Management</span>
            </div>
          </div>

          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse"></span>
              FIELD OPERATIONS PLATFORM
            </div>
            <h1>Every field visit.<br/><em>One clear picture.</em></h1>
            <p>
              Coordinate field teams, collect verified information,
              and keep every submission accountable — from one command center.
            </p>
            <div className="hero-points">
              <span><MapPinned size={17}/> Location visibility</span>
              <span><ClipboardList size={17}/> Structured data capture</span>
              <span><ShieldCheck size={17}/> Review & audit trail</span>
            </div>
          </div>

          <div className="art-map">
            <div className="map-grid"></div>
            <div className="map-line line-a"></div>
            <div className="map-line line-b"></div>
            <div className="map-dot dot-a"><span></span></div>
            <div className="map-dot dot-b"><span></span></div>
            <div className="map-dot dot-c"><span></span></div>
            <div className="map-label label-a">WARD 04 <b>Active</b></div>
            <div className="map-label label-b">WARD 07 <b>On field</b></div>
            <div className="map-card">
              <Activity size={15}/>
              <div>
                <b>Field operations</b>
                <small>Demo preview · Sample data</small>
              </div>
              <span className="mini-live">LIVE</span>
            </div>
          </div>

          <div className="login-foot">
            Designed for transparent, accountable field operations.
          </div>
        </div>

        <div className="login-panel">
          <form className="login-card" onSubmit={login}>
            <div className="mobile-brand brand">
              <div className="brand-mark"><ShieldCheck size={22}/></div>
              <div>
                <b>FieldPulse</b>
                <span>Election Field Management</span>
              </div>
            </div>

            <div className="login-kicker">WELCOME TO FIELDPULSE</div>
            <h2>Sign in to your workspace</h2>
            <p className="muted">Use your assigned account to continue.</p>

            <div className="role-switch">
              <button
                type="button"
                className={loginMode==='admin'?'selected':''}
                onClick={() => {
                  setLoginMode('admin');
                  setUsername('admin');
                  setPassword('admin123');
                }}
              >
                Administrator
              </button>

              <button
                type="button"
                className={loginMode==='candidate'?'selected':''}
                onClick={() => {
                  setLoginMode('candidate');
                  setUsername('candidate');
                  setPassword('candidate123');
                }}
              >
                Candidate
              </button>

              <button
                type="button"
                className={loginMode==='user'?'selected':''}
                onClick={() => {
                  setLoginMode('user');
                  setUsername('aarav');
                  setPassword('field123');
                }}
              >
                Field user
              </button>
            </div>

            <label>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />

            <button className="primary login-btn" type="submit">
              Sign in <ArrowUpRight size={17}/>
            </button>

            <div className="demo-credentials">
              <ShieldCheck size={16}/>
              <div>
                <b>Interactive prototype credentials</b>
                <span>Admin: admin / admin123</span>
                <span>Candidate: candidate / candidate123</span>
                <span>Field: aarav / field123 · simran / field123</span>
              </div>
            </div>

            <p className="login-legal">
              Prototype only · Use fictional/sample records for demonstrations.
            </p>
          </form>
        </div>

        {notice && (
          <div className="toast" onClick={() => setNotice('')}>
            {notice}<X size={14}/>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav?'open':''}`}>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={23}/></div>
          <div>
            <b>FieldPulse</b>
            <span>FIELD MANAGEMENT</span>
          </div>
          <button
            className="mobile-close icon-btn"
            onClick={() => setMobileNav(false)}
          >
            <X size={18}/>
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav>
          {nav.map(n => (
            <button
              key={n.name}
              className={`nav-item ${page===n.name?'active':''}`}
              onClick={() => {
                setPage(n.name);
                setMobileNav(false);
                setSelectedUser(null);
                setEditingProfile(false);
              }}
            >
              <n.icon size={18}/>
              <span>{n.name}</span>
              {n.name==='Data Entries' && (
                <i>
                  {data.stats?.pending_review ??
                    data.entries.filter(e=>e.status==='Pending').length}
                </i>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><ShieldCheck size={18}/></div>
            <b>Keep field work clear</b>
            <p>Assign, collect, verify — all in one place.</p>
          </div>

          <button
            className="nav-item settings-item"
            onClick={() => setNotice('Settings area is planned for the production build.')}
          >
            <Settings size={18}/> <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">{initials(user.name)}</div>
            <div className="profile-text">
              <b>{user.name}</b>
              <span>{isAdmin ? 'Administrator' : isCandidate ? 'Candidate · View only' : 'Field officer'}</span>
            </div>

            {/* LOGOUT BUTTON FOR ADMIN AND FIELD USER */}
            <button
              className="logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={17}/>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button
              className="mobile-menu icon-btn"
              onClick={() => setMobileNav(true)}
            >
              <Menu/>
            </button>
            <div className="breadcrumb">
              Workspace <ChevronRight size={14}/> <b>{page}</b>
            </div>
          </div>

          <div className="top-actions">
            <div className="search-box">
              <Search size={16}/>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search users, entries..."
              />
              <kbd>⌘ K</kbd>
            </div>

            <button
              className="notification icon-btn"
              onClick={() => setPage(isAdmin ? 'Data Entries' : isCandidate ? 'Team Activity' : 'My Submissions')}
            >
              <Bell size={18}/><i></i>
            </button>

            <div className="top-avatar">{initials(user.name)}</div>
          </div>
        </header>

        <div className="content">

          {isDemo && (
            <div className="demo-banner">
              <span><span className="demo-dot"></span> Prototype preview</span>
              <span>Showing sample records until the Python API is connected.</span>
              <button onClick={refresh}>Retry connection</button>
            </div>
          )}

          {/* ADMIN OVERVIEW */}
          {page==='Overview' && isAdmin && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">
                    COMMAND CENTER <span className="tiny-line"></span> {currentTime.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).toUpperCase()}
                  </div>
                  <h1>{greeting}, Admin <span>✦</span></h1>
                  <p>
                    Here’s what’s happening across your field operations today.
                    <span className="live-dashboard-time">{' '}{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</span>
                  </p>
                </div>
                <div className="heading-actions">
                  <button className="secondary" onClick={() => setPage('Data Entries')}>
                    <FileText size={16}/> View reports
                  </button>
                  <button className="primary" onClick={() => setShowTask(true)}>
                    <Plus size={17}/> Assign task
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                <Stat icon={Users} label="Total field users" value={data.stats?.total_users??data.users.length} sub="Registered team members" tone="violet" trend="Team"/>
                <Stat icon={MapPinned} label="Active in field" value={data.stats?.active_users??data.users.filter(u=>u.status==='active').length} sub="Sharing a recent location" tone="green" trend="Live"/>
                <Stat icon={ClipboardList} label="Total submissions" value={data.stats?.total_entries??data.entries.length} sub="Field records collected" tone="blue" trend="All time"/>
                <Stat icon={Clock3} label="Pending review" value={data.stats?.pending_review??data.entries.filter(e=>e.status==='Pending').length} sub="Need admin attention" tone="orange" trend="Review"/>
              </div>

              <div className="dashboard-grid">
                <section className="panel team-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Field team overview</h3>
                      <p>Quick view of your field officers</p>
                    </div>
                    <button className="text-btn" onClick={() => setPage('Field Users')}>
                      View all <ArrowUpRight size={15}/>
                    </button>
                  </div>

                  <div className="team-list">
                    {data.users.slice(0,4).map(u => (
                      <div
                        className="team-row"
                        key={u.id}
                        onClick={() => {
                          setSelectedUser(u);
                          setPage('Field Users');
                        }}
                      >
                        <div className="avatar">{initials(u.name)}</div>
                        <div className="team-info">
                          <b>{u.name}</b>
                          <span><MapPin size={12}/>{u.area||'Area not assigned'}</span>
                        </div>
                        <div className="team-state">
                          <span className={`status-dot ${u.status==='active'?'online':''}`}></span>
                          <span>{u.status==='active'?'Active':'Offline'}</span>
                        </div>
                        <ChevronRight size={16} className="row-arrow"/>
                      </div>
                    ))}
                  </div>

                  <button className="panel-bottom-link" onClick={() => setPage('Live Tracking')}>
                    <MapPinned size={15}/> Open live tracking <ArrowUpRight size={15}/>
                  </button>
                </section>

                <section className="panel activity-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Recent activity</h3>
                      <p>Latest updates from the field</p>
                    </div>
                    <span className="live-chip"><span></span> UPDATING</span>
                  </div>

                  {(data.activity?.length ? data.activity :
                    data.entries.slice(0,4).map(e => ({
                      id:e.id,
                      message:`${e.created_by_name} submitted “${e.title}”`,
                      created_at:e.created_at
                    }))
                  ).slice(0,4).map((a,i) => (
                    <div className="activity-row" key={a.id}>
                      <div className={`activity-icon ai-${i%4}`}>
                        {i%2===0?<ClipboardList size={16}/>:<MapPin size={16}/>}
                      </div>
                      <div className="activity-copy">
                        <b>{a.message}</b>
                        <span>{fmt(a.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </section>
              </div>

              <section className="panel submissions-panel">
                <div className="panel-head">
                  <div>
                    <h3>Latest data submissions</h3>
                    <p>Review field data submitted by your team</p>
                  </div>
                  <button className="text-btn" onClick={() => setPage('Data Entries')}>
                    All submissions <ArrowUpRight size={15}/>
                  </button>
                </div>
                <EntriesTable entries={data.entries.slice(0,4)} review={review} admin={true}/>
              </section>
            </>
          )}

          {/* ADMIN FIELD USERS */}
          {page==='Field Users' && isAdmin && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">TEAM MANAGEMENT</div>
                  <h1>Field users</h1>
                  <p>Manage field staff, review assigned areas, and open individual profiles.</p>
                </div>
                <button className="primary" onClick={() => setShowUser(true)}>
                  <Plus size={17}/> Add field user
                </button>
              </div>

              <div className="user-grid">
                {filteredUsers.map(u => (
                  <div className="user-card" key={u.id}>
                    <div className="user-card-top">
                      <div className="avatar large">{initials(u.name)}</div>
                      <span className={`status-pill ${u.status==='active'?'good':'neutral'}`}>
                        <span className={`status-dot ${u.status==='active'?'online':''}`}></span>
                        {u.status==='active'?'Active':'Offline'}
                      </span>
                    </div>
                    <h3>{u.name}</h3>
                    <p className="user-handle">@{u.username}</p>
                    <div className="user-meta"><MapPin size={15}/><span>{u.area||'No area assigned'}</span></div>
                    <div className="user-meta"><Clock3 size={15}/><span>Last seen: {fmt(u.last_seen)}</span></div>
                    <button className="full-secondary" onClick={() => setSelectedUser(u)}>
                      Open user profile <ArrowUpRight size={15}/>
                    </button>
                  </div>
                ))}
              </div>

              {selectedUser && (
                <Modal title="Field user profile" close={() => setSelectedUser(null)}>
                  <div className="profile-modal-head">
                    <div className="avatar large">{initials(selectedUser.name)}</div>
                    <div>
                      <h2>{selectedUser.name}</h2>
                      <p>{selectedUser.area} · @{selectedUser.username}</p>
                      <span className={`status-pill ${selectedUser.status==='active'?'good':'neutral'}`}>
                        {selectedUser.status==='active'?'Active in field':'Currently offline'}
                      </span>
                    </div>
                  </div>

                  <div className="detail-grid">
                    <Detail label="User ID" value={selectedUser.id}/>
                    <Detail label="Assigned area" value={selectedUser.area||'Unassigned'}/>
                    <Detail label="Latitude" value={selectedUser.lat??'Not available'}/>
                    <Detail label="Longitude" value={selectedUser.lng??'Not available'}/>
                    <Detail label="Last location update" value={fmt(selectedUser.last_seen)}/>
                    <Detail label="Submissions" value={data.entries.filter(e=>e.created_by===selectedUser.id||e.created_by_name===selectedUser.name).length}/>
                  </div>

                  <button
                    className="primary full-btn"
                    onClick={() => {
                      setSelectedUser(null);
                      setPage('Live Tracking');
                    }}
                  >
                    <MapPinned size={16}/> View on tracking map
                  </button>
                </Modal>
              )}
            </>
          )}

          {/* LIVE TRACKING */}
          {page==='Live Tracking' && isAdmin && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">LOCATION INTELLIGENCE</div>
                  <h1>Live field tracking</h1>
                  <p>Last reported positions of field users who have enabled location sharing.</p>
                </div>
                <button className="secondary" onClick={refresh}>
                  <Activity size={16}/> Refresh positions
                </button>
              </div>

              <div className="tracking-layout">
                <section className="panel map-panel">
                  <div className="map-head">
                    <div>
                      <h3>Field team map</h3>
                      <p>Demo coordinates · Patiala region</p>
                    </div>
                    <span className="live-chip"><span></span> LOCATION FEED</span>
                  </div>

                  <div className="large-map">
                    <div className="map-grid"></div>
                    <div className="road road1"></div>
                    <div className="road road2"></div>
                    <div className="road road3"></div>
                    <div className="map-water"></div>

                    {data.users.map((u,i) => (
                      <button
                        key={u.id}
                        className={`map-pin pin-${i%4}`}
                        style={{
                          left:`${[34,63,49,75][i%4]}%`,
                          top:`${[37,53,68,27][i%4]}%`
                        }}
                        onClick={() => setSelectedUser(u)}
                      >
                        <span>{initials(u.name)}</span>
                        <b>{u.name.split(' ')[0]}</b>
                      </button>
                    ))}

                    <div className="map-legend">
                      <span><i className="legend-green"></i> Active</span>
                      <span><i className="legend-grey"></i> Offline / stale</span>
                    </div>
                    <div className="map-credit">
                      Illustrative map · connect a map provider for real geographic tiles
                    </div>
                  </div>
                </section>

                <section className="panel location-list">
                  <div className="panel-head">
                    <div>
                      <h3>Team locations</h3>
                      <p>{data.users.filter(u=>u.status==='active').length} active · {data.users.length} total</p>
                    </div>
                    <LocateFixed size={18} className="subtle-icon"/>
                  </div>

                  {data.users.map(u => (
                    <button className="location-user" key={u.id} onClick={() => setSelectedUser(u)}>
                      <div className="avatar small">{initials(u.name)}</div>
                      <div className="location-user-info">
                        <b>{u.name}</b>
                        <span>{u.area||'No area assigned'}</span>
                        <small>{u.lat&&u.lng ? `${Number(u.lat).toFixed(4)}, ${Number(u.lng).toFixed(4)}` : 'Location not reported'}</small>
                      </div>
                      <span className={`status-dot ${u.status==='active'?'online':''}`}></span>
                    </button>
                  ))}

                  <div className="privacy-note">
                    <ShieldCheck size={16}/>
                    <span>Location is shared only with permission. Production tracking should be limited to disclosed work periods.</span>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ADMIN DATA ENTRIES */}
          {page==='Data Entries' && isAdmin && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">FIELD DATA REVIEW</div>
                  <h1>Data submissions</h1>
                  <p>Review collected notes and attached evidence, then approve or return entries.</p>
                </div>
                <button className="primary" onClick={() => setShowEntry(true)}>
                  <Plus size={17}/> Add entry
                </button>
              </div>

              <div className="filter-strip">
                <div className="filter-label">
                  <Filter size={16}/> All submissions <span>{filteredEntries.length}</span>
                </div>
                <div className="filter-help">Newest first · Search by title, user or area</div>
              </div>

              <section className="panel entries-full">
                <EntriesTable entries={filteredEntries} review={review} admin={true}/>
              </section>
            </>
          )}

          {/* PUBLIC OPINION SURVEY ADMIN */}
          {page==='Public Survey' && isAdmin && <SurveyAdmin />}

          {/* ADMIN TASKS */}
          {page==='Tasks & Assignments' && isAdmin && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">FIELD WORKFLOW</div>
                  <h1>Tasks & assignments</h1>
                  <p>Give field officers a clear area, deliverable, and due date.</p>
                </div>
                <button className="primary" onClick={() => setShowTask(true)}>
                  <Plus size={17}/> Assign task
                </button>
              </div>

              <div className="stats-grid task-stats">
                <Stat icon={ClipboardList} label="All tasks" value={data.tasks.length} sub="Created assignments" tone="blue"/>
                <Stat icon={Clock3} label="In progress" value={data.tasks.filter(t=>t.status==='In Progress').length} sub="Currently underway" tone="violet"/>
                <Stat icon={AlertCircle} label="Pending" value={data.tasks.filter(t=>t.status==='Pending').length} sub="Awaiting start" tone="orange"/>
                <Stat icon={CheckCircle2} label="Completed" value={data.tasks.filter(t=>t.status==='Completed').length} sub="Finished tasks" tone="green"/>
              </div>

              <section className="panel task-panel">
                <div className="panel-head">
                  <div>
                    <h3>All assignments</h3>
                    <p>Tasks assigned to your field team</p>
                  </div>
                </div>

                {data.tasks.map(t => (
                  <div className="task-row" key={t.id}>
                    <div className="task-icon"><ClipboardList size={18}/></div>
                    <div className="task-copy">
                      <b>{t.title}</b>
                      <span><MapPin size={12}/>{t.area}</span>
                    </div>
                    <div className="task-assignee">
                      <small>ASSIGNED TO</small>
                      <b>{data.users.find(u=>u.id===t.assigned_to)?.name||t.assigned_to}</b>
                    </div>
                    <div className="task-due">
                      <small>DUE DATE</small>
                      <b>{t.due_date||'Not set'}</b>
                    </div>
                    <Status status={t.status}/>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* CANDIDATE READ-ONLY TEAM ACTIVITY */}
          {page==='Team Activity' && isCandidate && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">CANDIDATE WORKSPACE · READ ONLY</div>
                  <h1>Team activity overview</h1>
                  <p>Monitor field-team progress and submitted updates. You cannot edit records or manage users.</p>
                </div>
                <button className="secondary" onClick={refresh}>
                  <Activity size={16}/> Refresh activity
                </button>
              </div>

              <div className="stats-grid">
                <Stat
                  icon={Users}
                  label="Field team members"
                  value={data.users.length}
                  sub="Registered field users"
                  tone="violet"
                />
                <Stat
                  icon={MapPinned}
                  label="Currently active"
                  value={data.users.filter(u=>u.status==='active').length}
                  sub="Users reporting active status"
                  tone="green"
                />
                <Stat
                  icon={ClipboardList}
                  label="Total submissions"
                  value={data.entries.length}
                  sub="Field records received"
                  tone="blue"
                />
                <Stat
                  icon={Clock3}
                  label="Awaiting review"
                  value={data.entries.filter(e=>e.status==='Pending').length}
                  sub="Pending admin review"
                  tone="orange"
                />
              </div>

              <div className="candidate-activity-grid">
                <section className="panel">
                  <div className="panel-head">
                    <div>
                      <h3>Field team status</h3>
                      <p>Read-only view of field team availability</p>
                    </div>
                    <span className="live-chip"><span></span> TEAM STATUS</span>
                  </div>
                  <div className="team-list">
                    {data.users.filter(u =>
                      (u.name+' '+u.area+' '+u.username).toLowerCase().includes(query.toLowerCase())
                    ).map(u => (
                      <div className="team-row candidate-team-row" key={u.id}>
                        <div className="avatar">{initials(u.name)}</div>
                        <div className="team-info">
                          <b>{u.name}</b>
                          <span><MapPin size={12}/>{u.area||'Area not assigned'}</span>
                        </div>
                        <div className="team-state">
                          <span className={`status-dot ${u.status==='active'?'online':''}`}></span>
                          <span>{u.status==='active'?'Active':'Offline'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="panel activity-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Recent field activity</h3>
                      <p>Latest submissions from the team</p>
                    </div>
                    <span className="live-chip"><span></span> UPDATING</span>
                  </div>
                  {(data.activity?.length ? data.activity : data.entries.map(e => ({
                    id:e.id,
                    message:`${e.created_by_name} submitted “${e.title}”`,
                    created_at:e.created_at
                  }))).filter(a =>
                    (a.message||'').toLowerCase().includes(query.toLowerCase())
                  ).slice(0,12).map((a,i) => (
                    <div className="activity-row" key={a.id}>
                      <div className={`activity-icon ai-${i%4}`}>
                        {i%2===0?<ClipboardList size={16}/>:<MapPin size={16}/>}
                      </div>
                      <div className="activity-copy">
                        <b>{a.message}</b>
                        <span>{fmt(a.created_at)}</span>
                      </div>
                    </div>
                  ))}
                  {!data.entries.length && !data.activity?.length && (
                    <div className="candidate-empty">No field activity has been submitted yet.</div>
                  )}
                </section>
              </div>

              <section className="panel submissions-panel">
                <div className="panel-head">
                  <div>
                    <h3>Team submissions</h3>
                    <p>Read-only reports submitted by field users</p>
                  </div>
                </div>
                <EntriesTable entries={data.entries.filter(e =>
                  (e.title+' '+e.area+' '+e.created_by_name).toLowerCase().includes(query.toLowerCase())
                )} review={() => {}} admin={false}/>
              </section>
            </>
          )}

          {/* FIELD USER DASHBOARD */}
          {page==='My Field' && isFieldUser && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">FIELD WORKSPACE</div>
                  <h1>Welcome, {user.name.split(' ')[0]}</h1>
                  <p>Your assigned area and field submission workspace.</p>
                </div>
                <button className="primary" onClick={() => setShowEntry(true)}>
                  <Plus size={17}/> Add data entry
                </button>
              </div>

              <div className="stats-grid">
                <Stat icon={MapPin} label="Assigned area" value={user.area||'Unassigned'} sub="Your current field area" tone="violet"/>
                <Stat icon={ClipboardList} label="My submissions" value={data.entries.filter(e=>e.created_by===user.id||e.created_by_name===user.name).length} sub="Records submitted" tone="blue"/>
                <Stat icon={Clock3} label="Awaiting review" value={data.entries.filter(e=>(e.created_by===user.id||e.created_by_name===user.name)&&e.status==='Pending').length} sub="Pending admin review" tone="orange"/>
                <Stat icon={CalendarDays} label="My tasks" value={data.tasks.filter(t=>t.assigned_to===user.id).length} sub="Assigned tasks" tone="green"/>
              </div>

              <section className="panel field-action-panel">
                <div className="field-action-icon"><UploadCloud size={25}/></div>
                <div>
                  <h3>Record a field visit</h3>
                  <p>Add a written report, attach photos, audio, video or documents, and submit it for review.</p>
                </div>
                <button className="primary" onClick={() => setShowEntry(true)}>
                  <Plus size={17}/> New submission
                </button>
              </section>

              <section className="panel submissions-panel">
                <div className="panel-head">
                  <div>
                    <h3>My recent submissions</h3>
                    <p>Track review status of the information you sent</p>
                  </div>
                </div>
                <EntriesTable
                  entries={data.entries.filter(e=>e.created_by===user.id||e.created_by_name===user.name)}
                  review={review}
                  admin={false}
                />
              </section>
            </>
          )}

          {/* MY SUBMISSIONS */}
          {page==='My Submissions' && isFieldUser && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">YOUR RECORDS</div>
                  <h1>My submissions</h1>
                  <p>All field entries submitted from your account.</p>
                </div>
                <button className="primary" onClick={() => setShowEntry(true)}>
                  <Plus size={17}/> Add data entry
                </button>
              </div>

              <section className="panel entries-full">
                <EntriesTable
                  entries={data.entries.filter(e=>e.created_by===user.id||e.created_by_name===user.name)}
                  review={review}
                  admin={false}
                />
              </section>
            </>
          )}

          {/* MY TASKS */}
          {page==='My Tasks' && isFieldUser && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">YOUR WORK PLAN</div>
                  <h1>My tasks</h1>
                  <p>Review assignments from your administrator.</p>
                </div>
              </div>

              <section className="panel task-panel">
                {data.tasks.filter(t=>t.assigned_to===user.id).map(t => (
                  <div className="task-row" key={t.id}>
                    <div className="task-icon"><ClipboardList size={18}/></div>
                    <div className="task-copy">
                      <b>{t.title}</b>
                      <span><MapPin size={12}/>{t.area}</span>
                    </div>
                    <div className="task-due">
                      <small>DUE DATE</small>
                      <b>{t.due_date||'Not set'}</b>
                    </div>
                    <Status status={t.status}/>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* FIELD USER MY PROFILE */}
          {page==='My Profile' && isFieldUser && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow dark">ACCOUNT SETTINGS</div>
                  <h1>My Profile</h1>
                  <p>View and manage your field officer account information.</p>
                </div>

                {!editingProfile && (
                  <button
                    className="primary"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Pencil size={16}/> Edit profile
                  </button>
                )}
              </div>

              {profileLoading ? (
                <section className="panel">
                  <p>Loading your profile...</p>
                </section>
              ) : (
                <>
                  <section className="panel my-profile-card">
                    <div className="my-profile-header">
                      <div className="avatar profile-avatar">
                        {initials(user.name)}
                      </div>

                      <div>
                        <h2>{user.name}</h2>
                        <p>Field Officer · @{user.username}</p>
                        <span className="status-pill good">
                          <span className="status-dot online"></span>
                          Active account
                        </span>
                      </div>
                    </div>

                    <div className="profile-divider"></div>

                    {editingProfile ? (
                      <form className="modal-form" onSubmit={saveMyProfile}>
                        <label>Full name</label>
                        <input
                          value={profileForm.name}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            name:e.target.value
                          })}
                          required
                        />

                        <label>Assigned area</label>
                        <input
                          value={profileForm.area}
                          onChange={e => setProfileForm({
                            ...profileForm,
                            area:e.target.value
                          })}
                          placeholder="Enter your assigned area"
                        />

                        <div className="modal-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setEditingProfile(false)}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="primary">
                            <Save size={16}/> Save changes
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="profile-details-grid">
                        <Detail label="Full name" value={user.name}/>
                        <Detail label="Username" value={`@${user.username}`}/>
                        <Detail label="Assigned area" value={user.area||'Not assigned'}/>
                        <Detail label="Account ID" value={user.id}/>
                        <Detail label="Account role" value="Field Officer"/>
                        <Detail label="Account status" value={user.status||'Active'}/>
                      </div>
                    )}
                  </section>

                  <div className="stats-grid profile-stats">
                    <Stat
                      icon={ClipboardList}
                      label="Total submissions"
                      value={myProfile?.stats?.total_entries ??
                        data.entries.filter(e=>e.created_by===user.id||e.created_by_name===user.name).length}
                      sub="Your submitted records"
                      tone="blue"
                    />
                    <Stat
                      icon={CheckCircle2}
                      label="Approved"
                      value={myProfile?.stats?.approved_entries ??
                        data.entries.filter(e=>(e.created_by===user.id||e.created_by_name===user.name)&&e.status==='Approved').length}
                      sub="Approved submissions"
                      tone="green"
                    />
                    <Stat
                      icon={Clock3}
                      label="Pending"
                      value={myProfile?.stats?.pending_entries ??
                        data.entries.filter(e=>(e.created_by===user.id||e.created_by_name===user.name)&&e.status==='Pending').length}
                      sub="Awaiting review"
                      tone="orange"
                    />
                    <Stat
                      icon={CalendarDays}
                      label="Assigned tasks"
                      value={myProfile?.stats?.total_tasks ??
                        data.tasks.filter(t=>t.assigned_to===user.id).length}
                      sub="Your assigned work"
                      tone="violet"
                    />
                  </div>
                </>
              )}
            </>
          )}

        </div>

        <footer className="footer">
          <span>FieldPulse <span className="footer-dot">·</span> Election Field Management Prototype</span>
          <span>
            <ShieldCheck size={13}/> Secure-by-design direction
            <span className="footer-dot">·</span> Sample data for demo
          </span>
        </footer>
      </main>

      {/* NEW ENTRY MODAL */}
      {showEntry && (
        <Modal
          title={isFieldUser ? "Punjab Public Opinion & Development Survey" : "New field data entry"}
          subtitle={isFieldUser ? "Complete the survey and submit your answers for admin review." : "Submit notes and supporting files for admin review."}
          close={() => setShowEntry(false)}
        >
          {isFieldUser ? <PublicSurvey /> : (
          <form className="modal-form" onSubmit={submitEntry}>
            <label>Entry title *</label>
            <input
              value={entryForm.title}
              onChange={e => setEntryForm({...entryForm,title:e.target.value})}
              placeholder="e.g. Community visit report"
              required
            />

            <label>Area / location</label>
            <input
              value={entryForm.area}
              onChange={e => setEntryForm({...entryForm,area:e.target.value})}
              placeholder={user.area||'Enter area name'}
            />

            <label>Notes / observations</label>
            <textarea
              rows="4"
              value={entryForm.notes}
              onChange={e => setEntryForm({...entryForm,notes:e.target.value})}
              placeholder="Write the details collected during the field visit..."
            />

            <label>Attachments</label>
            <label className="upload-zone">
              <UploadCloud size={25}/>
              <b>Click to attach evidence</b>
              <span>Photos, audio recordings, videos, PDFs, documents</span>
              <input
                type="file"
                multiple
                accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={e => setEntryFiles(Array.from(e.target.files||[]))}
              />
            </label>

            {entryFiles.length>0 && (
              <div className="file-list">
                {entryFiles.map((f,i) => (
                  <span key={i}>
                    <File size={14}/>{f.name}
                    <button
                      type="button"
                      onClick={() => setEntryFiles(a=>a.filter((_,j)=>j!==i))}
                    >
                      <X size={13}/>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="form-note">
              <ShieldCheck size={15}/>
              Submit only information you are authorized to collect. Avoid unnecessary personal voter data.
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowEntry(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <UploadCloud size={16}/> Submit entry
              </button>
            </div>
          </form>
          )}
        </Modal>
      )}

      {/* ADD USER MODAL */}
      {showUser && (
        <Modal
          title="Add field user"
          subtitle="Create an account for a field team member."
          close={() => setShowUser(false)}
        >
          <form className="modal-form" onSubmit={createUser}>
            <label>Full name *</label>
            <input
              value={newUser.name}
              onChange={e => setNewUser({...newUser,name:e.target.value})}
              required
              placeholder="Enter full name"
            />

            <label>Username *</label>
            <input
              value={newUser.username}
              onChange={e => setNewUser({...newUser,username:e.target.value})}
              required
              placeholder="Create username"
            />

            <label>Temporary password *</label>
            <input
              value={newUser.password}
              onChange={e => setNewUser({...newUser,password:e.target.value})}
              required
            />

            <label>Assigned area</label>
            <input
              value={newUser.area}
              onChange={e => setNewUser({...newUser,area:e.target.value})}
              placeholder="Ward / village / area"
            />

            <div className="form-note">
              <ShieldCheck size={15}/>
              Demo credentials are not production-secure. Add password hashing before real deployment.
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowUser(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Plus size={16}/> Create user
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ASSIGN TASK MODAL */}
      {showTask && (
        <Modal
          title="Assign field task"
          subtitle="Assign a clear deliverable to one field officer."
          close={() => setShowTask(false)}
        >
          <form className="modal-form" onSubmit={createTask}>
            <label>Task title *</label>
            <input
              value={newTask.title}
              onChange={e => setNewTask({...newTask,title:e.target.value})}
              required
              placeholder="e.g. Complete area visit"
            />

            <label>Area *</label>
            <input
              value={newTask.area}
              onChange={e => setNewTask({...newTask,area:e.target.value})}
              required
              placeholder="Ward / village / area"
            />

            <label>Assign to *</label>
            <select
              value={newTask.assigned_to}
              onChange={e => setNewTask({...newTask,assigned_to:e.target.value})}
            >
              {data.users.map(u => (
                <option key={u.id} value={u.id}>{u.name} — {u.area}</option>
              ))}
            </select>

            <label>Due date</label>
            <input
              type="date"
              value={newTask.due_date}
              onChange={e => setNewTask({...newTask,due_date:e.target.value})}
            />

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowTask(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Plus size={16}/> Assign task
              </button>
            </div>
          </form>
        </Modal>
      )}

      {notice && (
        <div className="toast" onClick={() => setNotice('')}>
          {notice}<X size={14}/>
        </div>
      )}
    </div>
  );
}

function Stat({icon:Icon,label,value,sub,tone,trend}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${tone}`}><Icon size={19}/></div>
        {trend && <span className={`stat-trend ${tone}`}>{trend}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function Status({status}) {
  const cls =
    status==='Approved'||status==='Completed' ? 'approved' :
    status==='Rejected' ? 'rejected' :
    status==='In Progress' ? 'progress' : 'pending';

  return <span className={`status-pill ${cls}`}>{status}</span>;
}

function EntriesTable({entries,review,admin}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ENTRY DETAILS</th>
            <th>SUBMITTED BY</th>
            <th>AREA</th>
            <th>DATE & TIME</th>
            <th>STATUS</th>
            {admin && <th>REVIEW</th>}
          </tr>
        </thead>

        <tbody>
          {entries.length ? entries.map(e => (
            <tr key={e.id}>
              <td>
                <div className="entry-title">
                  <div className="entry-icon"><FileText size={16}/></div>
                  <div>
                    <b>{e.title}</b>
                    <span>{e.files?.length?`${e.files.length} attachment(s)`:'Field notes'}</span>

                    {e.files?.length>0 && (
                      <div className="attachment-links">
                        {e.files.map((f,i) => (
                          <a
                            key={i}
                            href={f.url?`${API}${f.url}`:'#'}
                            target="_blank"
                            rel="noreferrer"
                            onClick={ev => {
                              if (!f.url) ev.preventDefault();
                            }}
                          >
                            {f.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="entry-note">{e.notes}</div>
              </td>

              <td>
                <div className="submitter">
                  <div className="avatar tiny">{initials(e.created_by_name)}</div>
                  {e.created_by_name}
                </div>
              </td>

              <td>
                <span className="area-label">
                  <MapPin size={13}/>{e.area||'—'}
                </span>
              </td>

              <td><span className="date-label">{fmt(e.created_at)}</span></td>
              <td><Status status={e.status}/></td>

              {admin && (
                <td>
                  <div className="review-actions">
                    <button title="Approve" className="approve-btn" onClick={() => review(e,'Approved')}>
                      <CheckCircle2 size={15}/>
                    </button>
                    <button title="Reject" className="reject-btn" onClick={() => review(e,'Rejected')}>
                      <X size={15}/>
                    </button>
                  </div>
                </td>
              )}
            </tr>
          )) : (
            <tr>
              <td colSpan={admin?6:5}>
                <div className="empty-state">
                  <ClipboardList size={22}/>
                  <b>No submissions found</b>
                  <span>Try another search or add a new entry.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Modal({title,subtitle,close,children}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target===e.currentTarget) close();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={close}>
            <X size={19}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Detail({label,value}) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <b>{String(value)}</b>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);