import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

// Shared page shell: every page supplies its own top-bar icon + label (shown
// inline in the Topbar, not as a separate large in-page heading) instead of
// repeating heading markup per page. `fullBleed` skips the padded, page-
// scrolling `<main>` wrapper for screens (the Issue Workspace) that manage
// their own internal panel layout and per-panel scrolling edge to edge.
export default function AppShell({ titleIcon, title, fullBleed = false, children }) {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar icon={titleIcon} title={title} />
        {fullBleed ? (
          <main className="flex-1 flex min-h-0 overflow-hidden">{children}</main>
        ) : (
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        )}
      </div>
    </div>
  );
}
