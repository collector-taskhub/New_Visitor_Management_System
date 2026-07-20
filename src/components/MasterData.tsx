"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Plus, Pencil, Trash2, Loader2, X, Power } from "lucide-react";

export default function MasterData() {
  const [tab, setTab] = useState<"departments" | "staff">("departments");

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("departments")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "departments" ? "bg-navy text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Building2 size={15} /> Departments
        </button>
        <button
          onClick={() => setTab("staff")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === "staff" ? "bg-navy text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Users size={15} /> Staff / Officers
        </button>
      </div>

      {tab === "departments" ? <DepartmentsPanel /> : <StaffPanel />}
    </div>
  );
}

// ============================== DEPARTMENTS ==============================

function DepartmentsPanel() {
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; dept: any }>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/departments?all=true");
    const data = await res.json();
    setDepts(data.departments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(dept: any) {
    await fetch(`/api/departments/${dept.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !dept.active }),
    });
    load();
  }

  async function remove(dept: any) {
    if (!confirm(`Delete "${dept.name}"? This only works if no visitors or staff reference it.`)) return;
    const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    load();
  }

  return (
    <div className="bg-white rounded-2xl card-shadow p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-navy text-sm">All Departments</h3>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-saffron text-navy font-semibold hover:bg-saffron-light"
        >
          <Plus size={14} /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-6">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="py-2 pr-3">Name (English)</th>
                <th className="py-2 pr-3">Name (Marathi)</th>
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Officers</th>
                <th className="py-2 pr-3">Visitors</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {depts.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2.5 pr-3 font-medium">{d.name}</td>
                  <td className="py-2.5 pr-3 marathi">{d.nameMarathi}</td>
                  <td className="py-2.5 pr-3 text-xs text-gray-500">{d.code}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {d.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs">{d._count?.users ?? 0}</td>
                  <td className="py-2.5 pr-3 text-xs">{d._count?.visitors ?? 0}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setModal({ mode: "edit", dept: d })} className="text-gray-400 hover:text-navy" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleActive(d)} className="text-gray-400 hover:text-amber-600" title={d.active ? "Deactivate" : "Activate"}>
                        <Power size={14} />
                      </button>
                      <button onClick={() => remove(d)} className="text-gray-400 hover:text-red-600" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {depts.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-6">No departments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <DepartmentFormModal
          mode={modal.mode}
          dept={modal.mode === "edit" ? modal.dept : undefined}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function DepartmentFormModal({
  mode,
  dept,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  dept?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(dept?.name || "");
  const [nameMarathi, setNameMarathi] = useState(dept?.nameMarathi || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || !nameMarathi.trim()) {
      setError("Both names are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(mode === "add" ? "/api/departments" : `/api/departments/${dept.id}`, {
        method: mode === "add" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nameMarathi: nameMarathi.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
        <h3 className="font-bold text-navy text-lg mb-4">{mode === "add" ? "Add Department" : "Edit Department"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name (English)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Name (Marathi)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={nameMarathi} onChange={(e) => setNameMarathi(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-saffron text-navy font-bold py-2.5 rounded-lg hover:bg-saffron-light transition disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {mode === "add" ? "Add Department" : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================== STAFF ==============================

const ROLES = ["DEPARTMENT_OFFICER", "PA", "COLLECTOR", "ADMIN"];

function StaffPanel() {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | { mode: "add" } | { mode: "edit"; person: any }>(null);

  async function load() {
    setLoading(true);
    const [usersRes, deptRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/departments?all=true"),
    ]);
    const usersData = await usersRes.json();
    const deptData = await deptRes.json();
    setStaff(usersData.users || []);
    setDepartments(deptData.departments || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(person: any) {
    if (!confirm(`Delete staff account for "${person.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${person.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error);
      return;
    }
    load();
  }

  async function toggleActive(person: any) {
    await fetch(`/api/users/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !person.active }),
    });
    load();
  }

  return (
    <div className="bg-white rounded-2xl card-shadow p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-navy text-sm">All Staff / Officers</h3>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-saffron text-navy font-semibold hover:bg-saffron-light"
        >
          <Plus size={14} /> Add Staff
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-6">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Department</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2.5 pr-3 font-medium">{s.name}</td>
                  <td className="py-2.5 pr-3 text-xs text-gray-500">{s.email}</td>
                  <td className="py-2.5 pr-3 text-xs">{s.role.replace("_", " ")}</td>
                  <td className="py-2.5 pr-3 text-xs">{s.department || "-"}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.active ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {s.active ? "Active" : "Pending/Inactive"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setModal({ mode: "edit", person: s })} className="text-gray-400 hover:text-navy" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleActive(s)} className="text-gray-400 hover:text-amber-600" title={s.active ? "Deactivate" : "Activate"}>
                        <Power size={14} />
                      </button>
                      <button onClick={() => remove(s)} className="text-gray-400 hover:text-red-600" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-6">No staff accounts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <StaffFormModal
          mode={modal.mode}
          person={modal.mode === "edit" ? modal.person : undefined}
          departments={departments}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function StaffFormModal({
  mode,
  person,
  departments,
  onClose,
  onSaved,
}: {
  mode: "add" | "edit";
  person?: any;
  departments: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(person?.name || "");
  const [email, setEmail] = useState(person?.email || "");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(person?.role || "DEPARTMENT_OFFICER");
  const [departmentId, setDepartmentId] = useState(person?.departmentId || "");
  const [designation, setDesignation] = useState(person?.designation || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (role === "DEPARTMENT_OFFICER" && !departmentId) {
      setError("Please select a department for a Department Officer.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "add") {
        if (!name || !email || !mobile || !password) {
          setError("Please fill all fields.");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, mobile, password, role, departmentId, designation }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add staff");
      } else {
        const res = await fetch(`/api/users/${person.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, role, departmentId, designation }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update staff");
      }
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={18} />
        </button>
        <h3 className="font-bold text-navy text-lg mb-4">{mode === "add" ? "Add Staff" : "Edit Staff"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="input" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
          {mode === "add" ? (
            <>
              <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="input" placeholder="Mobile Number" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
              <input className="input" type="password" placeholder="Temporary Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
            </>
          ) : (
            <div>
              <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Changing this changes their login email. They must use the new address next time they log in.
              </p>
            </div>
          )}
          <input className="input" placeholder="Designation (e.g. Tahsildar)" value={designation} onChange={(e) => setDesignation(e.target.value)} />

          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>

          {role === "DEPARTMENT_OFFICER" && (
            <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-saffron text-navy font-bold py-2.5 rounded-lg hover:bg-saffron-light transition disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {mode === "add" ? "Add Staff" : "Save Changes"}
          </button>
        </form>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
