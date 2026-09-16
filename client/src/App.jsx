import { useEffect, useState } from 'react';
import { api } from './api';

const roles = ['STORE_ADMIN', 'CASHIER'];
export default function App() {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true);
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState(''), [tab, setTab] = useState('stores');
  const [stores, setStores] = useState([]), [users, setUsers] = useState([]);
  const [storeForm, setStoreForm] = useState({ name:'', code:'', address:'' });
  const [userForm, setUserForm] = useState({ name:'', email:'', password:'', role:'CASHIER', storeIds:[] });
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const [s,u] = await Promise.all([api('/admin/stores'), api('/admin/users')]);
    setStores(s.stores); setUsers(u.users);
  }
  useEffect(() => { api('/auth/me').then(d => setUser(d.user)).catch(()=>{}).finally(()=>setLoading(false)); }, []);
  useEffect(() => { if (user?.role === 'SUPER_ADMIN') refresh().catch(e=>setError(e.message)); }, [user]);
  async function login(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { const d = await api('/auth/login', { method:'POST', body:JSON.stringify({email,password}) }); setUser(d.user); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  async function logout() { await api('/auth/logout',{method:'POST'}); setUser(null); }
  async function createStore(e) {
    e.preventDefault(); setError('');
    try { await api('/admin/stores',{method:'POST',body:JSON.stringify(storeForm)}); setStoreForm({name:'',code:'',address:''}); await refresh(); }
    catch(e) { setError(e.message); }
  }
  async function createUser(e) {
    e.preventDefault(); setError('');
    try { await api('/admin/users',{method:'POST',body:JSON.stringify(userForm)}); setUserForm({name:'',email:'',password:'',role:'CASHIER',storeIds:[]}); await refresh(); }
    catch(e) { setError(e.message); }
  }
  async function toggleActive(u) {
    try { await api(`/admin/users/${u.id}`,{method:'PATCH',body:JSON.stringify({active:!u.active})}); await refresh(); }
    catch(e) { setError(e.message); }
  }
  async function updateRole(u, role) {
    try { await api(`/admin/users/${u.id}`,{method:'PATCH',body:JSON.stringify({role})}); await refresh(); }
    catch(e) { setError(e.message); }
  }
  async function updateStores(u, storeIds) {
    try { await api(`/admin/users/${u.id}`,{method:'PATCH',body:JSON.stringify({storeIds})}); await refresh(); }
    catch(e) { setError(e.message); }
  }
  if (loading) return <main className="center">Loading Moon Star POS…</main>;
  if (!user) return <main className="login-wrap"><form className="login card" onSubmit={login}>
    <div className="brand-mark">✦</div><p className="eyebrow">MOON STAR · RETAIL SYSTEM</p><h1>Welcome back</h1><p className="muted">Sign in to manage your stores.</p>
    {error && <div className="alert">{error}</div>}
    <label>Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
    <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <button disabled={busy}>{busy?'Signing in…':'Sign in securely'}</button>
    <small className="muted">Ask your Super Admin for account access.</small>
  </form></main>;
  return <div className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark small">✦</span><div><b>MOON STAR POS</b><small>Store operations</small></div></div><div className="account"><span>{user.name}<small>{user.role.replace('_',' ')}</small></span><button className="ghost" onClick={logout}>Log out</button></div></header>
    <main className="content"><div className="page-title"><div><p className="eyebrow">CONTROL CENTER</p><h1>{user.role==='SUPER_ADMIN'?'Administration':'Welcome'}</h1><p className="muted">{user.role==='SUPER_ADMIN'?'Manage stores, users, and access.':'Your account is active. Store modules will appear here as they are enabled.'}</p></div></div>
      {error && <div className="alert">{error}<button className="ghost" onClick={()=>setError('')}>Dismiss</button></div>}
      {user.role==='SUPER_ADMIN' ? <>
        <div className="stats"><div className="stat card"><span>Stores</span><b>{stores.length}</b></div><div className="stat card"><span>Users</span><b>{users.length}</b></div><div className="stat card"><span>Active users</span><b>{users.filter(x=>x.active).length}</b></div></div>
        <nav className="tabs"><button className={tab==='stores'?'selected':''} onClick={()=>setTab('stores')}>Stores</button><button className={tab==='users'?'selected':''} onClick={()=>setTab('users')}>Users & permissions</button></nav>
        {tab==='stores' ? <section className="grid">
          <form className="card panel" onSubmit={createStore}><h2>Add a store</h2><p className="muted">Create a store location for inventory and sales.</p><label>Store name<input required value={storeForm.name} onChange={e=>setStoreForm({...storeForm,name:e.target.value})} placeholder="Downtown"/></label><label>Store code<input required value={storeForm.code} onChange={e=>setStoreForm({...storeForm,code:e.target.value})} placeholder="DOWNTOWN"/></label><label>Address (optional)<input value={storeForm.address} onChange={e=>setStoreForm({...storeForm,address:e.target.value})} placeholder="Location"/></label><button>Create store</button></form>
          <section className="card panel"><h2>Stores</h2>{stores.length===0?<p className="muted">No stores created yet.</p>:<div className="list">{stores.map(s=><div className="list-row" key={s._id}><div><b>{s.name}</b><small>{s.code} · {s.address||'No address'}</small></div><span className={`pill ${s.active?'green':'gray'}`}>{s.active?'Active':'Inactive'}</span></div>)}</div>}</section>
        </section> : <section className="grid">
          <form className="card panel" onSubmit={createUser}><h2>Create a user</h2><p className="muted">Assign access only to the required store(s).</p><label>Full name<input required value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})}/></label><label>Email<input type="email" required value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})}/></label><label>Temporary password (12+ characters)<input type="password" minLength="12" required value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})}/></label><label>Role<select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}>{roles.map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}</select></label><fieldset><legend>Allowed stores</legend>{stores.filter(s=>s.active).map(s=><label className="check" key={s._id}><input type="checkbox" checked={userForm.storeIds.includes(s._id)} onChange={e=>setUserForm(f=>({...f,storeIds:e.target.checked?[...f.storeIds,s._id]:f.storeIds.filter(id=>id!==s._id)}))}/>{s.name}</label>)}{stores.length===0&&<small className="muted">Create a store first.</small>}</fieldset><button>Create user</button></form>
          <section className="card panel"><h2>Users & permissions</h2><p className="muted">Change roles, store assignments, or deactivate access.</p>{users.length===0?<p className="muted">No users yet.</p>:<div className="list">{users.map(u=><div className="user-row" key={u.id}><div className="user-head"><div><b>{u.name}</b><small>{u.email}</small></div><span className={`pill ${u.active?'green':'gray'}`}>{u.active?'Active':'Inactive'}</span></div>{u.role!=='SUPER_ADMIN'&&<><label>Role<select value={u.role} onChange={e=>updateRole(u,e.target.value)}>{roles.map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}</select></label><label>Store access<select multiple value={u.storeIds.map(x=>String(x._id||x))} onChange={e=>updateStores(u,[...e.target.selectedOptions].map(o=>o.value))}>{stores.filter(s=>s.active).map(s=><option key={s._id} value={s._id}>{s.name}</option>)}</select><small className="muted">Use Ctrl (Windows) or Command (Mac) to select multiple.</small></label><button className={u.active?'danger':'secondary'} onClick={()=>toggleActive(u)}>{u.active?'Deactivate user':'Reactivate user'}</button></>}</div>)}</div>}</section>
        </section>}
      </> : <section className="card panel"><h2>Access assigned</h2><p className="muted">Your role is {user.role.replace('_',' ')}. Your assigned store access is managed by your Super Admin.</p><div className="chips">{(user.storeIds||[]).map(id=><span className="pill green" key={id}>{String(id)}</span>)}</div></section>}
    </main><footer>Moon Star POS · Secure store management</footer>
  </div>;
}
