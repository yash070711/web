export default function Header({open,onToggle}) {
  return <header className="topbar">
    <div className="top-left"><button className="hamburger" aria-label="Toggle navigation" aria-controls="sidebar" aria-expanded={open} onClick={onToggle}>?</button><div className="brand">Veri<em>Dex</em></div><div className="portal">PRODUCT STUDIO</div></div>
    <div className="top-right"><span className="notif">?</span><div className="avatar">YS</div><div className="account">Yash Gaur ? Admin</div></div>
  </header>;
}
