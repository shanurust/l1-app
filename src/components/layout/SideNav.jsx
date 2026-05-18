export function SideNav({ routes, activeRoute, onNavigate }) {
  return (
    <aside className="side-nav">
      <h2 className="side-nav-title">Supply Chain Control</h2>
      <p className="side-nav-subtitle">POC Command Center</p>
      <nav>
        {routes.map((route) => (
          <button
            key={route.path}
            type="button"
            className={`side-nav-link ${activeRoute === route.path ? 'active' : ''}`}
            onClick={() => onNavigate(route.path)}
          >
            <span>{route.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
