import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const ADMIN_TOKEN_KEY = "admin_token";

function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

async function adminFetch(path: string, opts: RequestInit = {}) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    throw new Error("Unauthorized");
  }
  return res;
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      onLogin();
    } catch {
      setError("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-1">CodePath Administration</p>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" placeholder="admin@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

type Tab = "dashboard" | "users" | "courses" | "achievements";

function Sidebar({ tab, setTab, onLogout }: { tab: Tab; setTab: (t: Tab) => void; onLogout: () => void }) {
  const items: { key: Tab; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "courses", label: "Courses", icon: "📚" },
    { key: "users", label: "Users", icon: "👥" },
    { key: "achievements", label: "Achievements", icon: "🏆" },
  ];

  return (
    <aside className="w-64 bg-slate-900/80 border-r border-white/10 flex flex-col min-h-screen">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <div>
            <div className="text-white font-semibold text-sm">CodePath</div>
            <div className="text-white/40 text-xs">Admin Panel</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(i => (
          <button key={i.key} onClick={() => setTab(i.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${tab === i.key ? "bg-indigo-600/20 text-indigo-300 font-medium" : "text-white/60 hover:bg-white/5 hover:text-white/80"}`}>
            <span>{i.icon}</span>
            <span>{i.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all">
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}

function StatsCard({ label, value, icon }: { label: string; value: number | string; icon: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-white/50 text-sm mt-1">{label}</div>
    </div>
  );
}

function DashboardTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    adminFetch("/admin/stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="text-white/50 p-8">Loading...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Dashboard Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard icon="👥" label="Total Users" value={stats.users} />
        <StatsCard icon="📚" label="Courses" value={stats.courses} />
        <StatsCard icon="📖" label="Lessons" value={stats.lessons} />
        <StatsCard icon="📦" label="Modules" value={stats.modules} />
        <StatsCard icon="🏆" label="Achievements" value={stats.achievements} />
        <StatsCard icon="🎓" label="Enrollments" value={stats.enrollments} />
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const loadUsers = useCallback(() => {
    adminFetch("/admin/users").then(r => r.json()).then(setUsers).catch(() => {});
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await adminFetch(`/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setEditForm({ username: user.username, email: user.email, displayName: user.displayName || "", isAdmin: user.isAdmin });
  };

  const handleSave = async () => {
    if (editingId === null) return;
    await adminFetch(`/admin/users/${editingId}`, { method: "PATCH", body: JSON.stringify(editForm) });
    setEditingId(null);
    loadUsers();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Users Management</h2>
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Username</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Level</th>
              <th className="text-left px-4 py-3 font-medium">XP</th>
              <th className="text-left px-4 py-3 font-medium">Admin</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5 text-white/80 hover:bg-white/5">
                <td className="px-4 py-3">{u.id}</td>
                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <input value={editForm.username} onChange={e => setEditForm({ ...editForm, username: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-28" />
                  ) : u.username}
                </td>
                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-44" />
                  ) : u.email}
                </td>
                <td className="px-4 py-3">{u.currentLevel}</td>
                <td className="px-4 py-3">{u.totalXP}</td>
                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <input type="checkbox" checked={editForm.isAdmin} onChange={e => setEditForm({ ...editForm, isAdmin: e.target.checked })} />
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.isAdmin ? "bg-indigo-500/20 text-indigo-300" : "bg-white/10 text-white/40"}`}>
                      {u.isAdmin ? "Yes" : "No"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-white/40 hover:text-white/60 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(u)} className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoursesTab() {
  const [courses, setCourses] = useState<any[]>([]);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState<any>({});
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", language: "python", difficulty: "beginner", isPublished: false, totalLessons: 0, estimatedHours: 1, xpReward: 100 });
  const [showNewModule, setShowNewModule] = useState<number | null>(null);
  const [newModule, setNewModule] = useState({ title: "", description: "", orderIndex: 0 });
  const [showNewLesson, setShowNewLesson] = useState<number | null>(null);
  const [newLesson, setNewLesson] = useState({ title: "", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 5, content: "" });

  const loadCourses = useCallback(() => {
    adminFetch("/admin/courses").then(r => r.json()).then(setCourses).catch(() => {});
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  const loadModules = async (courseId: number) => {
    const res = await adminFetch(`/admin/courses/${courseId}/modules`);
    const data = await res.json();
    setModules(data);
  };

  const loadLessons = async (moduleId: number) => {
    const res = await adminFetch(`/admin/modules/${moduleId}/lessons`);
    const data = await res.json();
    setLessons(data);
  };

  const toggleCourse = (courseId: number) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
      setModules([]);
    } else {
      setExpandedCourse(courseId);
      setExpandedModule(null);
      setLessons([]);
      loadModules(courseId);
    }
  };

  const toggleModule = (moduleId: number) => {
    if (expandedModule === moduleId) {
      setExpandedModule(null);
      setLessons([]);
    } else {
      setExpandedModule(moduleId);
      loadLessons(moduleId);
    }
  };

  const handleCreateCourse = async () => {
    await adminFetch("/admin/courses", { method: "POST", body: JSON.stringify(newCourse) });
    setShowNewCourse(false);
    setNewCourse({ title: "", description: "", language: "python", difficulty: "beginner", isPublished: false, totalLessons: 0, estimatedHours: 1, xpReward: 100 });
    loadCourses();
  };

  const handleEditCourse = (c: any) => {
    setEditingCourse(c.id);
    setCourseForm({ title: c.title, description: c.description, language: c.language, difficulty: c.difficulty, isPublished: c.isPublished, totalLessons: c.totalLessons, estimatedHours: c.estimatedHours, xpReward: c.xpReward });
  };

  const handleSaveCourse = async () => {
    if (editingCourse === null) return;
    await adminFetch(`/admin/courses/${editingCourse}`, { method: "PATCH", body: JSON.stringify(courseForm) });
    setEditingCourse(null);
    loadCourses();
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm("Delete this course and all its content? This cannot be undone.")) return;
    await adminFetch(`/admin/courses/${id}`, { method: "DELETE" });
    loadCourses();
  };

  const handleCreateModule = async (courseId: number) => {
    await adminFetch("/admin/modules", { method: "POST", body: JSON.stringify({ ...newModule, courseId }) });
    setShowNewModule(null);
    setNewModule({ title: "", description: "", orderIndex: 0 });
    loadModules(courseId);
  };

  const handleDeleteModule = async (moduleId: number) => {
    if (!confirm("Delete this module and all its lessons?")) return;
    await adminFetch(`/admin/modules/${moduleId}`, { method: "DELETE" });
    if (expandedCourse) loadModules(expandedCourse);
  };

  const handleCreateLesson = async (moduleId: number) => {
    await adminFetch("/admin/lessons", { method: "POST", body: JSON.stringify({ ...newLesson, moduleId }) });
    setShowNewLesson(null);
    setNewLesson({ title: "", type: "theory", orderIndex: 0, xpReward: 10, estimatedMinutes: 5, content: "" });
    loadLessons(moduleId);
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!confirm("Delete this lesson?")) return;
    await adminFetch(`/admin/lessons/${lessonId}`, { method: "DELETE" });
    if (expandedModule) loadLessons(expandedModule);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Courses Management</h2>
        <button onClick={() => setShowNewCourse(!showNewCourse)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Course
        </button>
      </div>

      {showNewCourse && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newCourse.title} onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} placeholder="Course Title" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
            <select value={newCourse.language} onChange={e => setNewCourse({ ...newCourse, language: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
            </select>
            <select value={newCourse.difficulty} onChange={e => setNewCourse({ ...newCourse, difficulty: e.target.value })} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <label className="flex items-center gap-2 text-white/70 text-sm">
              <input type="checkbox" checked={newCourse.isPublished} onChange={e => setNewCourse({ ...newCourse, isPublished: e.target.checked })} />
              Published
            </label>
          </div>
          <textarea value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 min-h-[60px]" />
          <div className="flex gap-2">
            <button onClick={handleCreateCourse} className="bg-green-600 hover:bg-green-500 text-white text-sm px-4 py-2 rounded-lg">Create</button>
            <button onClick={() => setShowNewCourse(false)} className="text-white/50 hover:text-white/70 text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {courses.map(c => (
          <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5" onClick={() => toggleCourse(c.id)}>
              <div className="flex items-center gap-3">
                <span className="text-lg">{expandedCourse === c.id ? "▼" : "▶"}</span>
                <div>
                  {editingCourse === c.id ? (
                    <input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} onClick={e => e.stopPropagation()} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm" />
                  ) : (
                    <div className="text-white font-medium">{c.title}</div>
                  )}
                  <div className="text-white/40 text-xs mt-0.5">{c.language} • {c.difficulty} • {c.totalLessons} lessons</div>
                </div>
              </div>
              <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                <span className={`text-xs px-2 py-0.5 rounded ${c.isPublished ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {c.isPublished ? "Published" : "Draft"}
                </span>
                {editingCourse === c.id ? (
                  <div className="flex gap-2">
                    <button onClick={handleSaveCourse} className="text-green-400 hover:text-green-300 text-xs">Save</button>
                    <button onClick={() => setEditingCourse(null)} className="text-white/40 text-xs">Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleEditCourse(c)} className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
                    <button onClick={() => handleDeleteCourse(c.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                  </div>
                )}
              </div>
            </div>

            {expandedCourse === c.id && (
              <div className="border-t border-white/10 px-5 py-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/50 text-sm font-medium">Modules</span>
                  <button onClick={() => setShowNewModule(showNewModule === c.id ? null : c.id)} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Add Module</button>
                </div>

                {showNewModule === c.id && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 mb-2">
                    <input value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} placeholder="Module Title" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-white/30" />
                    <input value={newModule.description} onChange={e => setNewModule({ ...newModule, description: e.target.value })} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-white/30" />
                    <div className="flex gap-2">
                      <button onClick={() => handleCreateModule(c.id)} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded">Create</button>
                      <button onClick={() => setShowNewModule(null)} className="text-white/40 text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {modules.map(m => (
                  <div key={m.id} className="bg-white/5 border border-white/5 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5" onClick={() => toggleModule(m.id)}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white/40">{expandedModule === m.id ? "▼" : "▶"}</span>
                        <span className="text-white/80 text-sm">{m.title}</span>
                        <span className="text-white/30 text-xs">#{m.orderIndex}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteModule(m.id); }} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </div>

                    {expandedModule === m.id && (
                      <div className="border-t border-white/5 px-4 py-3 space-y-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/40 text-xs font-medium">Lessons</span>
                          <button onClick={() => setShowNewLesson(showNewLesson === m.id ? null : m.id)} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Add Lesson</button>
                        </div>

                        {showNewLesson === m.id && (
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2 mb-2">
                            <input value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })} placeholder="Lesson Title" className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white text-sm placeholder-white/30" />
                            <div className="grid grid-cols-3 gap-2">
                              <select value={newLesson.type} onChange={e => setNewLesson({ ...newLesson, type: e.target.value })} className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs">
                                <option value="theory">Theory</option>
                                <option value="quiz">Quiz</option>
                                <option value="challenge">Challenge</option>
                              </select>
                              <input type="number" value={newLesson.xpReward} onChange={e => setNewLesson({ ...newLesson, xpReward: parseInt(e.target.value) || 0 })} placeholder="XP" className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs" />
                              <input type="number" value={newLesson.estimatedMinutes} onChange={e => setNewLesson({ ...newLesson, estimatedMinutes: parseInt(e.target.value) || 0 })} placeholder="Minutes" className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleCreateLesson(m.id)} className="bg-green-600 text-white text-xs px-3 py-1.5 rounded">Create</button>
                              <button onClick={() => setShowNewLesson(null)} className="text-white/40 text-xs">Cancel</button>
                            </div>
                          </div>
                        )}

                        {lessons.map(l => (
                          <div key={l.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs">{l.type === "theory" ? "📖" : l.type === "quiz" ? "❓" : "💻"}</span>
                              <span className="text-white/70 text-sm">{l.title}</span>
                              <span className="text-white/30 text-xs">({l.type} • {l.xpReward}xp • {l.estimatedMinutes}min)</span>
                            </div>
                            <button onClick={() => handleDeleteLesson(l.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                          </div>
                        ))}
                        {lessons.length === 0 && <div className="text-white/30 text-xs py-2">No lessons yet</div>}
                      </div>
                    )}
                  </div>
                ))}
                {modules.length === 0 && <div className="text-white/30 text-xs">No modules yet</div>}
              </div>
            )}
          </div>
        ))}
        {courses.length === 0 && <div className="text-white/40 text-sm text-center py-8">No courses yet. Create one to get started.</div>}
      </div>
    </div>
  );
}

function AchievementsTab() {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newAch, setNewAch] = useState({ key: "", title: "", description: "", icon: "🎯", xpReward: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const loadAchievements = useCallback(() => {
    adminFetch("/admin/achievements").then(r => r.json()).then(setAchievements).catch(() => {});
  }, []);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  const handleCreate = async () => {
    await adminFetch("/admin/achievements", { method: "POST", body: JSON.stringify(newAch) });
    setShowNew(false);
    setNewAch({ key: "", title: "", description: "", icon: "🎯", xpReward: 0 });
    loadAchievements();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this achievement?")) return;
    await adminFetch(`/admin/achievements/${id}`, { method: "DELETE" });
    loadAchievements();
  };

  const handleEdit = (a: any) => {
    setEditingId(a.id);
    setEditForm({ key: a.key, title: a.title, description: a.description, icon: a.icon, xpReward: a.xpReward });
  };

  const handleSave = async () => {
    if (editingId === null) return;
    await adminFetch(`/admin/achievements/${editingId}`, { method: "PATCH", body: JSON.stringify(editForm) });
    setEditingId(null);
    loadAchievements();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Achievements Management</h2>
        <button onClick={() => setShowNew(!showNew)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + New Achievement
        </button>
      </div>

      {showNew && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={newAch.key} onChange={e => setNewAch({ ...newAch, key: e.target.value })} placeholder="Key (e.g. streak_50)" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
            <input value={newAch.title} onChange={e => setNewAch({ ...newAch, title: e.target.value })} placeholder="Title" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
            <input value={newAch.icon} onChange={e => setNewAch({ ...newAch, icon: e.target.value })} placeholder="Icon emoji" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
            <input type="number" value={newAch.xpReward} onChange={e => setNewAch({ ...newAch, xpReward: parseInt(e.target.value) || 0 })} placeholder="XP Reward" className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
          </div>
          <input value={newAch.description} onChange={e => setNewAch({ ...newAch, description: e.target.value })} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg">Create</button>
            <button onClick={() => setShowNew(false)} className="text-white/50 text-sm px-4 py-2">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-white/50">
              <th className="text-left px-4 py-3 font-medium">Icon</th>
              <th className="text-left px-4 py-3 font-medium">Key</th>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium">Description</th>
              <th className="text-left px-4 py-3 font-medium">XP</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {achievements.map(a => (
              <tr key={a.id} className="border-b border-white/5 text-white/80 hover:bg-white/5">
                <td className="px-4 py-3 text-xl">
                  {editingId === a.id ? (
                    <input value={editForm.icon} onChange={e => setEditForm({ ...editForm, icon: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-12" />
                  ) : a.icon}
                </td>
                <td className="px-4 py-3 font-mono text-xs">{a.key}</td>
                <td className="px-4 py-3">
                  {editingId === a.id ? (
                    <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-32" />
                  ) : a.title}
                </td>
                <td className="px-4 py-3 text-white/50 text-xs max-w-[200px] truncate">
                  {editingId === a.id ? (
                    <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-full" />
                  ) : a.description}
                </td>
                <td className="px-4 py-3">
                  {editingId === a.id ? (
                    <input type="number" value={editForm.xpReward} onChange={e => setEditForm({ ...editForm, xpReward: parseInt(e.target.value) || 0 })} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-16" />
                  ) : a.xpReward}
                </td>
                <td className="px-4 py-3">
                  {editingId === a.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSave} className="text-green-400 hover:text-green-300 text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-white/40 text-xs">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(a)} className="text-indigo-400 hover:text-indigo-300 text-xs">Edit</button>
                      <button onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setLocation("/admin");
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Sidebar tab={tab} setTab={setTab} onLogout={handleLogout} />
      <main className="flex-1 p-8 overflow-y-auto">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "users" && <UsersTab />}
        {tab === "courses" && <CoursesTab />}
        {tab === "achievements" && <AchievementsTab />}
      </main>
    </div>
  );
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (token) {
      adminFetch("/admin/stats")
        .then(r => { if (r.ok) setAuthenticated(true); })
        .catch(() => {});
    }
  }, []);

  if (!authenticated) {
    return <AdminLogin onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminDashboard />;
}
