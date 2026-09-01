import { useEffect, useState } from "react";
import { Phone, SearchX, User, Wrench } from "lucide-react";
import AppShell from "../../../shared/components/AppShell.jsx";
import SearchInput from "../../../shared/components/SearchInput.jsx";
import SortableHeader from "../../../shared/components/SortableHeader.jsx";
import Pagination from "../../../shared/components/Pagination.jsx";
import { useTableControls } from "../../../shared/hooks/useTableControls.js";
import { getTechnicians } from "../api.js";

const SEARCH_FIELDS = [(tech) => tech.name, (tech) => tech.specialty];

const SORT_ACCESSORS = {
  name: (tech) => tech.name,
  workload: (tech) => tech.workload.open + tech.workload.done,
};

export default function Technicians() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTechnicians()
      .then(setTechnicians)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const { query, setQuery, debouncedQuery, items, page, totalPages, setPage, toggleSort, sortStateFor } =
    useTableControls({ data: technicians, searchFields: SEARCH_FIELDS, sortAccessors: SORT_ACCESSORS });

  return (
    <AppShell title="Technicians">
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-control px-3 py-2">
          Failed to load technicians: {error}
        </p>
      )}

      <div className="bg-white border border-border rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-150">
        {loading ? (
          <p className="px-6 py-8 text-sm text-ink-muted">Loading...</p>
        ) : technicians.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <User className="h-5 w-5 text-ink-muted" />
            </div>
            <p className="text-sm font-medium text-ink">No technicians yet</p>
          </div>
        ) : (
          <>
            <div className="px-4 pt-4">
              <SearchInput value={query} onChange={setQuery} placeholder="Search technicians..." />
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <SearchX className="h-5 w-5 text-ink-muted" />
                </div>
                <p className="text-sm font-medium text-ink">No results for &ldquo;{debouncedQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <SortableHeader
                        label="Name"
                        sortKey="name"
                        sortState={sortStateFor("name")}
                        onSort={toggleSort}
                      />
                      <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
                        Specialty
                      </th>
                      <th className="text-left font-medium text-ink-muted uppercase tracking-wide text-xs px-4 py-3">
                        Phone
                      </th>
                      <SortableHeader
                        label="Workload"
                        sortKey="workload"
                        sortState={sortStateFor("workload")}
                        onSort={toggleSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((tech) => (
                      <tr
                        key={tech.id}
                        className="border-b border-border last:border-0 hover:bg-[#FFF7ED] transition-colors duration-150"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-orange-100 text-primary-hover flex items-center justify-center shrink-0">
                              <User className="h-4 w-4" strokeWidth={2.25} />
                            </div>
                            <span className="font-medium text-ink">{tech.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted">
                          {tech.specialty ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Wrench className="h-3.5 w-3.5" />
                              {tech.specialty}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted">
                          {tech.phone ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {tech.phone}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-ink-muted">
                          <span className="font-medium text-ink">{tech.workload.open}</span> open ·{" "}
                          <span className="font-medium text-ink">{tech.workload.done}</span> done
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </AppShell>
  );
}
