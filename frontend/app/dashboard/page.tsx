"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { getUser, authHeaders, logout } from "@/lib/auth";
import { API_BASE, Report } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Trash2, Search, BarChart3, ListChecks } from "lucide-react";
import { motion } from "framer-motion";

interface DBReport {
  id: number;
  query: string;
  created_at: string;
  report_json: Report;
}

export default function DashboardPage() {
  const [reports, setReports] = useState<DBReport[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchReports();
  }, [user, router]);

  async function fetchReports() {
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setReports(Array.isArray(data) ? data : []);
      } else if (res.status === 401) {
        logout();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteReport(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this report?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/reports/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setReports(reports.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  function viewReport(report: Report) {
    sessionStorage.setItem("nova_report", JSON.stringify(report));
    router.push("/research");
  }

  const avgConf = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.report_json?.stats?.avg_confidence || 0), 0) / reports.length)
    : 0;

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
        <p className="text-slate-500 mb-8">Here is your research history.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ListChecks size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Reports</p>
              <p className="font-display text-2xl font-bold">{reports.length}</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Confidence</p>
              <p className="font-display text-2xl font-bold">{avgConf}%</p>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Search size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Searches</p>
              <p className="font-display text-2xl font-bold">{reports.length}</p>
            </div>
          </div>
        </div>

        <h2 className="font-display text-xl font-bold mb-4">Previous Reports</h2>
        
        {loading ? (
          <p className="text-slate-500">Loading reports...</p>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="font-display font-bold text-lg mb-2">No reports yet</h3>
            <p className="text-slate-500 mb-6">Start researching to see your history here.</p>
            <button onClick={() => router.push("/research")} className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:opacity-90 transition-opacity">
              Start Research
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={r.id}
                onClick={() => viewReport(r.report_json)}
                className="glass rounded-2xl p-5 cursor-pointer hover:border-primary/30 transition-colors relative group"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => deleteReport(r.id, e)} className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="font-semibold mb-2 pr-10 line-clamp-2" title={r.query}>{r.query}</h3>
                <p className="text-xs text-slate-500 mb-4">{new Date(r.created_at).toLocaleDateString()}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300">
                    {r.report_json?.stats?.total_claims || 0} claims
                  </span>
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                    {r.report_json?.stats?.avg_confidence || 0}% avg
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
