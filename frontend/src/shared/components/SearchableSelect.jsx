import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// A select-like control whose popover has a live-filter text input, useful
// once an option list gets long enough that scrolling a plain <select> is
// painful (project lists, sprint lists, ...). Purely presentational — the
// caller decides what "no selection" looks like by including an option with
// value: "" in `options` (e.g. { value: "", label: "All Projects" }); when
// `value` doesn't match any option (including while `disabled`), the button
// falls back to `placeholder`.
export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = filterText
    ? options.filter((option) => option.label.toLowerCase().includes(filterText.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setFilterText("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    setHighlightedIndex((i) => Math.min(i, Math.max(0, filteredOptions.length - 1)));
  }, [filterText, filteredOptions.length]);

  function openPopover() {
    if (disabled) return;
    setFilterText("");
    const initialIndex = options.findIndex((option) => option.value === value);
    setHighlightedIndex(Math.max(0, initialIndex));
    setOpen(true);
  }

  function closePopover() {
    setOpen(false);
    setFilterText("");
  }

  function selectOption(option) {
    onChange(option.value);
    closePopover();
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const option = filteredOptions[highlightedIndex];
      if (option) selectOption(option);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closePopover();
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? closePopover() : openPopover())}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 rounded-control border border-border px-3 py-2 text-sm bg-white transition-colors ${
          disabled
            ? "text-slate-400 cursor-not-allowed"
            : "text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        }`}
      >
        <span className={`truncate ${selectedOption ? "text-ink" : "text-slate-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 ${disabled ? "text-slate-300" : "text-ink-muted"}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1.5 w-full min-w-[14rem] bg-white border border-border rounded-card shadow-card overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full rounded-control border border-border px-2.5 py-1.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-ink-muted">No matches</li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;
                return (
                  <li key={option.value} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectOption(option)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                        isHighlighted ? "bg-orange-100 text-orange-600" : "text-ink hover:bg-[#FFF7ED]"
                      }`}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
