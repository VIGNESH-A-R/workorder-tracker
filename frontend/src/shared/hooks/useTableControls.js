import { useEffect, useMemo, useState } from "react";

const SEARCH_DEBOUNCE_MS = 250;
const PAGE_SIZE = 8;

function compareValues(a, b) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1; // empty values always sort last
  if (bEmpty) return -1;
  if (typeof a === "string" && typeof b === "string") return a.localeCompare(b);
  return a < b ? -1 : a > b ? 1 : 0;
}

// Shared client-side search + sort + pagination for the app's data tables.
// `searchFields` are getter functions run against the debounced query;
// `sortAccessors` maps a column key to a getter that returns a comparable value.
// An optional single-value dropdown filter (e.g. "filter by customer") can be
// layered on via `filterValue` + `filterFn(item, filterValue)`; it participates
// in the same page-reset-on-change behavior as search and sort.
export function useTableControls({
  data,
  searchFields,
  sortAccessors,
  pageSize = PAGE_SIZE,
  filterValue,
  filterFn,
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState(null); // { key, direction: "asc" | "desc" }
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, sort, filterValue]);

  const filtered = useMemo(() => {
    let result = data;
    if (filterValue && filterFn) {
      result = result.filter((item) => filterFn(item, filterValue));
    }
    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((item) =>
        searchFields.some((getField) => (getField(item) || "").toLowerCase().includes(q))
      );
    }
    return result;
  }, [data, debouncedQuery, searchFields, filterValue, filterFn]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const accessor = sortAccessors[sort.key];
    if (!accessor) return filtered;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const result = compareValues(accessor(a), accessor(b));
      return sort.direction === "asc" ? result : -result;
    });
    return copy;
  }, [filtered, sort, sortAccessors]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize]
  );

  function toggleSort(key) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  }

  function sortStateFor(key) {
    if (!sort || sort.key !== key) return null;
    return sort.direction;
  }

  return {
    query,
    setQuery,
    debouncedQuery,
    items: pageItems,
    totalCount: sorted.length,
    page: currentPage,
    setPage,
    totalPages,
    toggleSort,
    sortStateFor,
  };
}
