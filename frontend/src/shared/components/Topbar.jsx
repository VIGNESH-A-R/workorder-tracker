// `icon` + `title`: the compact page-title indicator every page shows here
// instead of a large in-page heading — icon + bold text, inline, left side.
// User identity/logout lives in the Sidebar's footer, not here.
export default function Topbar({ icon: Icon, title }) {
  return (
    <header className="h-12 shrink-0 bg-white border-b border-border flex items-center px-6">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon className="h-[18px] w-[18px] text-ink shrink-0" strokeWidth={2.25} />}
        {title && <span className="text-[15px] font-bold text-ink truncate">{title}</span>}
      </div>
    </header>
  );
}
