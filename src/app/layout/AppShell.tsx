import { NavLink, Routes, Route } from "react-router-dom";

function Placeholder({ title }: { title: string }) {
  return (
    <div style={{ padding: 24 }}>
      <h1>{title}</h1>
      <p>Starter screen for {title}.</p>
    </div>
  );
}

export function AppShell() {
  const items = [
    ["Home", "/"],
    ["Installed", "/installed"],
    ["Catalog", "/catalog"],
    ["Packs", "/packs"],
    ["Updates", "/updates"],
    ["Create", "/create"],
    ["Scan", "/scan"],
    ["Describe", "/describe"],
    ["Drafts", "/drafts"],
    ["Sources", "/sources"],
    ["Settings", "/settings"]
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: 16 }}>
        <h2>Claude Agent Studio</h2>
        <nav style={{ display: "grid", gap: 8 }}>
          {items.map(([label, path]) => (
            <NavLink key={path} to={path} style={{ textDecoration: "none" }}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<Placeholder title="Home" />} />
          <Route path="/installed" element={<Placeholder title="Installed Agents" />} />
          <Route path="/catalog" element={<Placeholder title="Catalog" />} />
          <Route path="/packs" element={<Placeholder title="Packs" />} />
          <Route path="/updates" element={<Placeholder title="Updates" />} />
          <Route path="/create" element={<Placeholder title="Create Agent" />} />
          <Route path="/scan" element={<Placeholder title="Scan Project" />} />
          <Route path="/describe" element={<Placeholder title="Describe Your Project" />} />
          <Route path="/drafts" element={<Placeholder title="Drafts" />} />
          <Route path="/sources" element={<Placeholder title="Catalog Sources" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Routes>
      </main>
    </div>
  );
}
