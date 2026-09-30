'use client';
import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
export default function StudioShell({children}) {
  const [open,setOpen]=useState(false);
  const [collapsed,setCollapsed]=useState(false);
  return <><Header open={open} onToggle={()=>setOpen(!open)}/><div className="app" onKeyDown={event=>{if(event.key==='Escape')setOpen(false);}}>
    {open&&<button className="mobile-backdrop" aria-label="Close navigation" onClick={()=>setOpen(false)}/>}
    <Sidebar open={open} collapsed={collapsed} onNavigate={()=>setOpen(false)} onCollapse={()=>setCollapsed(!collapsed)}/>
    <main>{children}</main>
  </div></>;
}
