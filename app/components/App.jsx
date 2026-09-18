 "use client";
import { useEffect, useState } from "react";

const roleLabel = role => ({ SUPER_ADMIN: "Super Admin", STORE_ADMIN: "Store Admin", CASHIER: "Cashier" }[role] || role);

export default function App() {
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [storeForm, setStoreForm] = useState({ name: "", code: "", address: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "CASHIER", storeIds: [] });

  async function request(url, options = {}) {
    const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }
  async function loadAdmin() {
    const [s, u] = await Promise.all([request("/api/admin/stores"), request("/api/admin/users")]);
    setStores(s.stores || []); setUsers(u.users || []);
  }
  async function refresh() {
    try {
      const data = await request("/api/auth/me");
      setUser(data.user);
      if (data.user?.role === "SUPER_ADMIN") await loadAdmin();
    } catch { /* signed out or backend unavailable */ }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  async function login(e) {
    e.preventDefault(); setError("");
    try {
      const data = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setUser(data.user); setPassword("");
      if (data.user.role === "SUPER_ADMIN") await loadAdmin();
    } catch (e) { setError(e.message); }
  }
  async function logout() {
    await request("/api/auth/logout", { method: "POST" });
    setUser(null); setStores([]); setUsers([]);
  }
  async function createStore(e) {
    e.preventDefault(); setError("");
    try {
      await request("/api/admin/stores", { method: "POST", body: JSON.stringify(storeForm) });
      setStoreForm({ name: "", code: "", address: "" }); await loadAdmin();
    } catch (e) { setError(e.message); }
  }
  async function createUser(e) {
    e.preventDefault(); setError("");
    try {
      await request("/api/admin/users", { method: "POST", body: JSON.stringify(userForm) });
      setUserForm({ name: "", email: "", password: "", role: "CASHIER", storeIds: [] }); await loadAdmin();
    } catch (e) { setError(e.message); }
  }
  async function toggleStore(store) {
    try { await request(`/api/admin/stores/${store._id}`, { method: "PATCH", body: JSON.stringify({ active: !store.active }) }); await loadAdmin(); }
    catch (e) { setError(e.message); }
  }
  async function toggleUser(person) {
    try { await request(`/api/admin/users/${person._id}`, { method: "PATCH", body: JSON.stringify({ active: !person.active }) }); await loadAdmin(); }
    catch (e) { setError(e.message); }
  }

  if (loading) return <main className="loading">Loading Moon Star POS…</main>;
  if (!user) return <main className="login-shell">
    <section className="login-card">
      <div className="brand-mark">☾</div><p className="eyebrow">INVESTMENT TRADING CORPORATION</p>
      <h1>Moon Star <span>POS</span></h1><p className="muted">Sign in to manage your stores and operations.</p>
      <form onSubmit={login} className="form-stack">
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" required /></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary full" type="submit">Sign in <span>→</span></button>
      </form>
      <p className="login-foot">Secure store administration · Powered by Moon Star</p>
    </section>
  </main>;

  const isSuper = user.role === "SUPER_ADMIN";
  const nav = isSuper ? ["Overview", "Stores", "Users"] : ["Overview", "My Stores"];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="side-brand"><div className="mini-mark">☾</div><div><b>MOON STAR</b><small>POINT OF SALE</small></div></div>
      <div className="nav-label">WORKSPACE</div>
      {nav.map(item=><button key={item} className={`nav-item ${tab===item?"selected":""}`} onClick={()=>setTab(item)}><span>{item==="Overview"?"▦":item==="Stores"||item==="My Stores"?"▣":"♙"}</span>{item}</button>)}
      <div className="sidebar-bottom"><div className="avatar">{user.name?.[0]?.toUpperCase() || "U"}</div><div className="profile"><b>{user.name}</b><small>{roleLabel(user.role)}</small></div><button className="logout" onClick={logout} title="Sign out">↗</button></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><span className="crumb">Workspace</span><span className="slash">/</span><b>{tab}</b></div><div className="top-right"><span className="status-dot"></span> System online <div className="top-avatar">{user.name?.[0]?.toUpperCase()}</div></div></header>
      <div className="content">
        <div className="welcome"><div><p className="eyebrow">MOON STAR POS / ADMINISTRATION</p><h1>{tab==="Overview"?"Good to see you, "+user.name.split(" ")[0]:tab}</h1><p className="muted">{isSuper?"Manage your stores, users, and access from one place.":"Here’s an overview of your assigned store access."}</p></div><span className="date-chip">● Live workspace</span></div>
        {error && <div className="notice">{error}<button onClick={()=>setError("")}>×</button></div>}
        {tab==="Overview" && <><div className="stats-grid">
          <Stat title="Total stores" value={isSuper?stores.length:(user.stores?.length||0)} note="Registered locations" icon="▣"/>
          <Stat title="Active users" value={isSuper?users.filter(x=>x.active).length:"—"} note="With system access" icon="♙"/>
          <Stat title="Your role" value={roleLabel(user.role)} note="Current permission level" icon="✳"/>
          <Stat title="System status" value="Online" note="Application available" icon="⌁" green/>
        </div><div className="panel"><div className="panel-head"><div><h2>Quick overview</h2><p className="muted">Your workspace at a glance</p></div>{isSuper&&<button className="secondary" onClick={()=>setTab("Stores")}>Manage stores →</button>}</div>
          {isSuper?<div className="overview-row"><div className="overview-icon">▣</div><div><b>Store management</b><p className="muted">Create locations and control their active status.</p></div><button className="text-button" onClick={()=>setTab("Stores")}>Open <span>→</span></button></div>:<div className="empty-state"><div className="empty-icon">▣</div><b>Your assigned stores</b><p>Stores assigned to your account appear here.</p></div>}
        </div></>}
        {(tab==="Stores" || tab==="My Stores") && <div className="panel"><div className="panel-head"><div><h2>{isSuper?"Store directory":"Assigned stores"}</h2><p className="muted">Locations available to your account</p></div><span className="count-pill">{isSuper?stores.length:(user.stores?.length||0)} stores</span></div>
          {isSuper&&<form className="inline-form" onSubmit={createStore}><input placeholder="Store name" value={storeForm.name} onChange={e=>setStoreForm({...storeForm,name:e.target.value})} required/><input placeholder="Code (e.g. STR001)" value={storeForm.code} onChange={e=>setStoreForm({...storeForm,code:e.target.value})} required/><input placeholder="Address (optional)" value={storeForm.address} onChange={e=>setStoreForm({...storeForm,address:e.target.value})}/><button className="primary" type="submit">＋ Add store</button></form>}
          <div className="table-wrap"><table><thead><tr><th>STORE</th><th>CODE</th><th>ADDRESS</th><th>STATUS</th>{isSuper&&<th></th>}</tr></thead><tbody>{(isSuper?stores:(user.stores||[])).map(s=><tr key={s._id||s.id}><td><b>{s.name}</b></td><td><span className="code-pill">{s.code}</span></td><td>{s.address||"—"}</td><td><span className={`pill ${s.active===false?"inactive":"active"}`}>{s.active===false?"Inactive":"Active"}</span></td>{isSuper&&<td><button className="text-button" onClick={()=>toggleStore(s)}>{s.active===false?"Activate":"Deactivate"}</button></td>}</tr>)}</tbody></table>{(isSuper?stores:(user.stores||[])).length===0&&<div className="empty-state">No stores to display yet.</div>}</div>
        </div>}
        {tab==="Users"&&isSuper&&<div className="panel"><div className="panel-head"><div><h2>User management</h2><p className="muted">Create accounts and assign store-level access.</p></div><span className="count-pill">{users.length} users</span></div>
          <form className="user-form" onSubmit={createUser}><input placeholder="Full name" value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} required/><input type="email" placeholder="Email address" value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})} required/><input type="password" minLength="12" placeholder="Temporary password (12+ chars)" value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})} required/><select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}><option value="CASHIER">Cashier</option><option value="STORE_ADMIN">Store Admin</option></select><div className="store-checks">{stores.map(s=><label key={s._id}><input type="checkbox" checked={userForm.storeIds.includes(s._id)} onChange={e=>setUserForm({...userForm,storeIds:e.target.checked?[...userForm.storeIds,s._id]:userForm.storeIds.filter(id=>id!==s._id)})}/>{s.name}</label>)}</div><button className="primary" type="submit">＋ Create user</button></form>
          <div className="table-wrap"><table><thead><tr><th>USER</th><th>ROLE</th><th>STORE ACCESS</th><th>STATUS</th><th></th></tr></thead><tbody>{users.map(p=><tr key={p._id}><td><b>{p.name}</b><small className="table-sub">{p.email}</small></td><td>{roleLabel(p.role)}</td><td>{(p.storeIds||[]).map(s=>s.name).join(", ")||"—"}</td><td><span className={`pill ${p.active?"active":"inactive"}`}>{p.active?"Active":"Inactive"}</span></td><td><button className="text-button" onClick={()=>toggleUser(p)}>{p.active?"Deactivate":"Activate"}</button></td></tr>)}</tbody></table>{users.length===0&&<div className="empty-state">No users created yet.</div>}</div>
        </div>}
      </div>
      <footer>© {new Date().getFullYear()} Moon Star POS <span>Secure workspace · v1.0</span></footer>
    </main>
  </div>;
}
function Stat({title,value,note,icon,green}) { return <div className="stat-card"><div className="stat-top"><span>{title}</span><i>{icon}</i></div><strong className={green?"green":""}>{value}</strong><small>{note}</small></div>; }
