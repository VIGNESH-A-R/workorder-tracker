import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createWorkOrder } from "../api.js";
import { getCustomers } from "../../customers/api.js";
import { getTechnicians } from "../../technicians/api.js";

const EMPTY_FORM = {
  title: "",
  description: "",
  customerId: "",
  location: "",
  technicianId: "",
  scheduledDate: "",
};

const inputClass =
  "w-full rounded-control border border-border px-3 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";
const labelClass = "block text-sm font-medium text-ink mb-1.5";

export default function WorkOrderModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    if (!open) return;
    getCustomers().then(setCustomers).catch(() => setCustomers([]));
    getTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
  }, [open]);

  if (!open) return null;

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createWorkOrder({
        ...form,
        customerId: form.customerId ? Number(form.customerId) : null,
        technicianId: form.technicianId ? Number(form.technicianId) : null,
        scheduledDate: form.scheduledDate || null,
      });
      setForm(EMPTY_FORM);
      toast.success("Work order created");
      await onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create work order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 h-16 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-ink">New Work Order</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-control flex items-center justify-center text-ink-muted hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label htmlFor="title" className={labelClass}>
                Title
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={inputClass}
                placeholder="e.g. Replace HVAC compressor"
              />
            </div>

            <div>
              <label htmlFor="customerId" className={labelClass}>
                Customer
              </label>
              <select
                id="customerId"
                value={form.customerId}
                onChange={(e) => handleChange("customerId", e.target.value)}
                className={inputClass}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className={labelClass}>
                Location
              </label>
              <input
                id="location"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className={inputClass}
                placeholder="Site address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="technicianId" className={labelClass}>
                  Technician
                </label>
                <select
                  id="technicianId"
                  value={form.technicianId}
                  onChange={(e) => handleChange("technicianId", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="scheduledDate" className={labelClass}>
                  Scheduled Date
                </label>
                <input
                  id="scheduledDate"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => handleChange("scheduledDate", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className={labelClass}>
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className={inputClass}
                placeholder="Optional details about the job"
              />
            </div>
          </div>

          <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-control px-4 py-2 text-sm font-medium text-ink-muted hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-control bg-primary hover:bg-primary-hover disabled:opacity-60 text-white text-sm font-medium px-4 py-2 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Work Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
