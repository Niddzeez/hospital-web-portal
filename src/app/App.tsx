import { useState } from 'react';
import { AcceptInvitePage } from '../pages/AcceptInvitePage';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import type { User } from '../services/apiClient';
import { PlatformAdminDashboard } from '../pages/PlatformAdminDashboard';
import { HospitalAdminDashboard } from '../pages/HospitalAdminDashboard';

export function App() { const [user,setUser]=useState<User|null>(()=>{try{return JSON.parse(localStorage.getItem('dd_user')||'null');}catch{return null;}}); const token=new URLSearchParams(window.location.search).get('invite'); const logout=()=>{localStorage.removeItem('dd_token');localStorage.removeItem('dd_user');setUser(null);}; const signedIn=(next:User)=>{localStorage.setItem('dd_user',JSON.stringify(next));setUser(next);}; if(token&&!user)return <AcceptInvitePage token={token} onAccepted={signedIn}/>; if(!user)return <LoginPage onLogin={signedIn}/>; if(user.role==='platform_admin'||user.role==='admin')return <PlatformAdminDashboard user={user} onLogout={logout}/>; if(user.role==='hospital_admin')return <HospitalAdminDashboard user={user} onLogout={logout}/>; return <DashboardPage user={user} onLogout={logout}/>; }
