import { useState, useMemo } from "react";

// ─── SAMPLE DATA ────────────────────────────────────────────────────────────

const USERS = [
  { username: "Abhishek", password: "54321", role: "owner", displayName: "Abhishek (Owner)" },
  { username: "Director", password: "12345", role: "director", displayName: "Director" },
  { username: "Ravi", password: "1234", role: "agent", displayName: "Ravi Kumar" },
  { username: "Priya", password: "1234", role: "agent", displayName: "Priya Sharma" },
];

const CUSTOMERS = [
  { id: 1, name: "Suresh Enterprises", company: "Suresh Enterprises Pvt Ltd", contact: "Suresh Mehta", email: "suresh@seplimited.com", phone: "9876543210", creditDays: 15, graceDays: 3, escalationEmail: "director@seplimited.com" },
  { id: 2, name: "Kapoor Traders", company: "Kapoor Traders LLP", contact: "Vikram Kapoor", email: "vikram@kapoortraders.com", phone: "9123456780", creditDays: 15, graceDays: 5, escalationEmail: "md@kapoortraders.com" },
  { id: 3, name: "Mehta & Sons", company: "Mehta & Sons Co.", contact: "Rajesh Mehta", email: "rajesh@mehtasons.com", phone: "9988776655", creditDays: 15, graceDays: 3, escalationEmail: "ceo@mehtasons.com" },
  { id: 4, name: "Patel Industries", company: "Patel Industries Ltd", contact: "Ankit Patel", email: "ankit@patelindustries.com", phone: "9765432100", creditDays: 15, graceDays: 7, escalationEmail: "md@patelindustries.com" },
  { id: 5, name: "Sharma Exports", company: "Sharma Exports Pvt Ltd", contact: "Neha Sharma", email: "neha@sharmaexports.com", phone: "9345678901", creditDays: 15, graceDays: 3, escalationEmail: "director@sharmaexports.com" },
];

const today = new Date();
const daysAgo = (d) => new Date(today - d * 86400000).toISOString().split("T")[0];

const INVOICES_INIT = [
  { id: "INV-1021", invoiceDate: daysAgo(45), dueDate: daysAgo(30), customerId: 1, amount: 85000, received: 0, status: "Overdue" },
  { id: "INV-1022", invoiceDate: daysAgo(38), dueDate: daysAgo(23), customerId: 2, amount: 42000, received: 42000, status: "Paid" },
  { id: "INV-1023", invoiceDate: daysAgo(32), dueDate: daysAgo(17), customerId: 3, amount: 67500, received: 30000, status: "Partial" },
  { id: "INV-1024", invoiceDate: daysAgo(25), dueDate: daysAgo(10), customerId: 1, amount: 120000, received: 0, status: "Overdue" },
  { id: "INV-1025", invoiceDate: daysAgo(20), dueDate: daysAgo(5), customerId: 4, amount: 45000, received: 0, status: "Overdue" },
  { id: "INV-1026", invoiceDate: daysAgo(15), dueDate: daysAgo(0), customerId: 5, amount: 33000, received: 33000, status: "Paid" },
  { id: "INV-1027", invoiceDate: daysAgo(10), dueDate: daysAgo(5), customerId: 2, amount: 78000, received: 0, status: "Overdue" },
  { id: "INV-1028", invoiceDate: daysAgo(8), dueDate: daysAgo(3), customerId: 3, amount: 29500, received: 0, status: "Pending" },
  { id: "INV-1029", invoiceDate: daysAgo(5), dueDate: daysAgo(10), customerId: 5, amount: 55000, received: 0, status: "Pending" },
  { id: "INV-1030", invoiceDate: daysAgo(3), dueDate: daysAgo(18), customerId: 4, amount: 91000, received: 0, status: "Pending" },
];

const ACTIVITY_INIT = [
  { id: 1, date: daysAgo(0), agent: "Ravi Kumar", customerId: 1, invoiceId: "INV-1021", callDone: true, mailSent: true, remarks: "Customer said payment delayed due to cash flow", promised: daysAgo(-5), nextFollowUp: daysAgo(-3), paymentStatus: "Pending" },
  { id: 2, date: daysAgo(1), agent: "Priya Sharma", customerId: 4, invoiceId: "INV-1025", callDone: true, mailSent: false, remarks: "Director out of town, will confirm tomorrow", promised: daysAgo(-2), nextFollowUp: daysAgo(-1), paymentStatus: "Pending" },
  { id: 3, date: daysAgo(2), agent: "Ravi Kumar", customerId: 3, invoiceId: "INV-1023", callDone: true, mailSent: true, remarks: "Partial payment received, balance pending", promised: daysAgo(-7), nextFollowUp: daysAgo(-5), paymentStatus: "Partial" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const calcDaysOverdue = (dueDate) => {
  const due = new Date(dueDate);
  const diff = Math.floor((today - due) / 86400000);
  return diff > 0 ? diff : 0;
};

const getAging = (days) => {
  if (days <= 15) return "0–15";
  if (days <= 30) return "16–30";
  if (days <= 60) return "31–60";
  return "60+";
};

const formatCurrency = (n) =>
  "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const statusColor = (s) => {
  if (s === "Paid") return "#22c55e";
  if (s === "Partial") return "#f59e0b";
  if (s === "Overdue") return "#ef4444";
  return "#94a3b8";
};

const getReminderType = (days) => {
  if (days <= 3) return { label: "Polite Reminder", color: "#3b82f6" };
  if (days <= 10) return { label: "Formal Reminder", color: "#f59e0b" };
  return { label: "Strict Reminder", color: "#ef4444" };
};

const emailTemplate = (type, inv, customer) => {
  const bal = formatCurrency(inv.amount - inv.received);
  const templates = {
    "Polite Reminder": {
      subject: `Friendly Reminder: Invoice ${inv.id} – ${bal} Pending`,
      body: `Dear ${customer.contact},\n\nHope you're doing well. This is a gentle reminder that invoice ${inv.id} dated ${inv.invoiceDate} for ${bal} was due on ${inv.dueDate}.\n\nKindly arrange the payment at your earliest convenience.\n\nWarm regards,\nAccounts Team`,
    },
    "Formal Reminder": {
      subject: `Payment Reminder: Invoice ${inv.id} – ${bal} Overdue`,
      body: `Dear ${customer.contact},\n\nThis is to bring to your attention that invoice ${inv.id} for ${bal} is now overdue since ${inv.dueDate}. We request you to make the payment immediately to avoid any service disruption.\n\nIf payment has already been made, please share the transaction reference.\n\nRegards,\nAccounts Team`,
    },
    "Strict Reminder": {
      subject: `URGENT: Invoice ${inv.id} – ${bal} Severely Overdue`,
      body: `Dear ${customer.contact},\n\nDespite multiple reminders, invoice ${inv.id} for ${bal} (due: ${inv.dueDate}) remains unpaid. This is a final notice before escalation to management.\n\nWe strongly urge immediate payment within 48 hours to avoid further action.\n\nFinals Notice,\nAccounts & Collections Team`,
    },
  };
  return templates[type] || templates["Polite Reminder"];
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState(INVOICES_INIT);
  const [activities, setActivities] = useState(ACTIVITY_INIT);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loginError, setLoginError] = useState("");
  const [emailModal, setEmailModal] = useState(null);
  const [activityModal, setActivityModal] = useState(false);
  const [addInvoiceModal, setAddInvoiceModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleLogin = (username, password) => {
    const u = USERS.find(u => u.username === username && u.password === password);
    if (u) { setUser(u); setLoginError(""); }
    else setLoginError("Invalid credentials. Please try again.");
  };

  const canEdit = user && (user.role === "owner" || user.role === "director");

  const enrichedInvoices = useMemo(() =>
    invoices.map(inv => {
      const customer = CUSTOMERS.find(c => c.id === inv.customerId);
      const overdueDays = calcDaysOverdue(inv.dueDate);
      const balance = inv.amount - inv.received;
      return { ...inv, customer, overdueDays, balance, aging: getAging(overdueDays) };
    }), [invoices]);

  // KPIs
  const kpis = useMemo(() => {
    const pending = enrichedInvoices.filter(i => i.status !== "Paid");
    const overdue = enrichedInvoices.filter(i => i.overdueDays > 0 && i.status !== "Paid");
    const totalOutstanding = pending.reduce((s, i) => s + i.balance, 0);
    const totalOverdue = overdue.reduce((s, i) => s + i.balance, 0);
    const collectedToday = 85000; // simulated
    const over30 = overdue.filter(i => i.overdueDays > 30).reduce((s, i) => s + i.balance, 0);
    const over60 = overdue.filter(i => i.overdueDays > 60).reduce((s, i) => s + i.balance, 0);
    const escalationCases = overdue.filter(i => i.overdueDays > 90 || 
      enrichedInvoices.filter(x => x.customerId === i.customerId && x.status !== "Paid").length >= 3).length;
    return { totalOutstanding, totalOverdue, collectedToday, over30, over60, escalationCases, pendingCount: pending.length, overdueCount: overdue.length };
  }, [enrichedInvoices]);

  if (!user) return <LoginScreen onLogin={handleLogin} error={loginError} />;

  return (
    <div style={styles.app}>
      {/* SIDEBAR */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <div style={styles.logoIcon}>₹</div>
          <div>
            <div style={styles.logoTitle}>CollectPro</div>
            <div style={styles.logoSub}>Collections Suite</div>
          </div>
        </div>

        <div style={styles.userBadge}>
          <div style={styles.userAvatar}>{user.displayName[0]}</div>
          <div>
            <div style={styles.userName}>{user.displayName}</div>
            <div style={styles.userRole}>{user.role.toUpperCase()}</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: "dashboard", icon: "⬡", label: "Dashboard" },
            { id: "invoices", icon: "📄", label: "Invoices" },
            { id: "customers", icon: "👥", label: "Customers" },
            { id: "activity", icon: "📞", label: "Activity Log" },
            { id: "outstanding", icon: "⏳", label: "Outstanding" },
            { id: "emails", icon: "✉️", label: "Email Templates" },
            ...(canEdit ? [{ id: "reports", icon: "📊", label: "Reports" }] : []),
          ].map(item => (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(activeTab === item.id ? styles.navBtnActive : {}) }}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={() => setUser(null)}>⏻ Logout</button>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <div style={styles.headerTitle}>
              {{ dashboard: "Dashboard Overview", invoices: "Invoice Register", customers: "Customer Master", activity: "Collection Activity", outstanding: "Outstanding Report", emails: "Email Templates", reports: "Collection Reports" }[activeTab]}
            </div>
            <div style={styles.headerDate}>{today.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          <div style={styles.headerActions}>
            {activeTab === "invoices" && canEdit && (
              <button style={styles.primaryBtn} onClick={() => setAddInvoiceModal(true)}>+ Add Invoice</button>
            )}
            {activeTab === "activity" && (
              <button style={styles.primaryBtn} onClick={() => setActivityModal(true)}>+ Log Activity</button>
            )}
          </div>
        </header>

        <div style={styles.content}>
          {activeTab === "dashboard" && <DashboardView kpis={kpis} invoices={enrichedInvoices} activities={activities} />}
          {activeTab === "invoices" && <InvoicesView invoices={enrichedInvoices} canEdit={canEdit} setInvoices={setInvoices} onEmail={setEmailModal} showToast={showToast} />}
          {activeTab === "customers" && <CustomersView invoices={enrichedInvoices} />}
          {activeTab === "activity" && <ActivityView activities={activities} invoices={enrichedInvoices} />}
          {activeTab === "outstanding" && <OutstandingView invoices={enrichedInvoices} />}
          {activeTab === "emails" && <EmailTemplatesView invoices={enrichedInvoices} onOpen={setEmailModal} />}
          {activeTab === "reports" && <ReportsView kpis={kpis} invoices={enrichedInvoices} activities={activities} />}
        </div>
      </main>

      {/* MODALS */}
      {emailModal && <EmailModal data={emailModal} onClose={() => setEmailModal(null)} showToast={showToast} />}
      {activityModal && <ActivityFormModal invoices={enrichedInvoices} onClose={() => setActivityModal(false)} onSave={(a) => { setActivities(prev => [{ id: Date.now(), ...a }, ...prev]); setActivityModal(false); showToast("Activity logged successfully!"); }} />}
      {addInvoiceModal && <AddInvoiceModal onClose={() => setAddInvoiceModal(false)} onSave={(inv) => { setInvoices(prev => [...prev, inv]); setAddInvoiceModal(false); showToast("Invoice added successfully!"); }} />}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, error }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  return (
    <div style={styles.loginBg}>
      <div style={styles.loginCard}>
        <div style={styles.loginLogo}>₹</div>
        <h1 style={styles.loginTitle}>CollectPro</h1>
        <p style={styles.loginSub}>Payment Collections Management</p>
        <div style={styles.formGroup}>
          <label style={styles.label}>USERNAME</label>
          <input style={styles.input} value={u} onChange={e => setU(e.target.value)} placeholder="Enter username" />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>PASSWORD</label>
          <input style={styles.input} type="password" value={p} onChange={e => setP(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && onLogin(u, p)} />
        </div>
        {error && <div style={styles.loginError}>{error}</div>}
        <button style={styles.loginBtn} onClick={() => onLogin(u, p)}>SIGN IN →</button>
        <div style={styles.loginHint}>
          <strong>Demo:</strong> Abhishek / 54321 &nbsp;|&nbsp; Director / 12345 &nbsp;|&nbsp; Ravi / 1234
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function DashboardView({ kpis, invoices, activities }) {
  const agingData = [
    { label: "0–15 Days", count: invoices.filter(i => i.aging === "0–15" && i.status !== "Paid").length, color: "#22c55e" },
    { label: "16–30 Days", count: invoices.filter(i => i.aging === "16–30" && i.status !== "Paid").length, color: "#f59e0b" },
    { label: "31–60 Days", count: invoices.filter(i => i.aging === "31–60" && i.status !== "Paid").length, color: "#f97316" },
    { label: "60+ Days", count: invoices.filter(i => i.aging === "60+" && i.status !== "Paid").length, color: "#ef4444" },
  ];

  const topOverdue = invoices.filter(i => i.status !== "Paid" && i.overdueDays > 0).sort((a, b) => b.balance - a.balance).slice(0, 5);

  return (
    <div>
      {/* KPI CARDS */}
      <div style={styles.kpiGrid}>
        {[
          { label: "Total Outstanding", value: formatCurrency(kpis.totalOutstanding), icon: "💰", color: "#3b82f6", sub: `${kpis.pendingCount} pending invoices` },
          { label: "Total Overdue", value: formatCurrency(kpis.totalOverdue), icon: "⚠️", color: "#ef4444", sub: `${kpis.overdueCount} overdue invoices` },
          { label: "Collected Today", value: formatCurrency(kpis.collectedToday), icon: "✅", color: "#22c55e", sub: "Updated live" },
          { label: "Overdue > 30 Days", value: formatCurrency(kpis.over30), icon: "🔴", color: "#f97316", sub: "Requires attention" },
          { label: "Overdue > 60 Days", value: formatCurrency(kpis.over60), icon: "🚨", color: "#dc2626", sub: "Critical cases" },
          { label: "Escalation Cases", value: kpis.escalationCases, icon: "📢", color: "#8b5cf6", sub: "Sent to director" },
        ].map((k, i) => (
          <div key={i} style={{ ...styles.kpiCard, borderTop: `3px solid ${k.color}` }}>
            <div style={styles.kpiTop}>
              <span style={styles.kpiIcon}>{k.icon}</span>
              <span style={{ ...styles.kpiValue, color: k.color }}>{k.value}</span>
            </div>
            <div style={styles.kpiLabel}>{k.label}</div>
            <div style={styles.kpiSub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={styles.dashRow}>
        {/* AGING BUCKETS */}
        <div style={styles.dashCard}>
          <div style={styles.cardTitle}>Outstanding Ageing Buckets</div>
          {agingData.map((a, i) => (
            <div key={i} style={styles.agingRow}>
              <div style={{ ...styles.agingDot, background: a.color }} />
              <div style={styles.agingLabel}>{a.label}</div>
              <div style={styles.agingBar}>
                <div style={{ ...styles.agingBarFill, width: `${Math.min((a.count / 4) * 100, 100)}%`, background: a.color }} />
              </div>
              <div style={{ ...styles.agingCount, color: a.color }}>{a.count} inv.</div>
            </div>
          ))}
        </div>

        {/* TOP OVERDUE */}
        <div style={styles.dashCard}>
          <div style={styles.cardTitle}>Top Overdue Customers</div>
          {topOverdue.map((inv, i) => (
            <div key={i} style={styles.overdueRow}>
              <div style={styles.overdueRank}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.overdueCustomer}>{inv.customer?.name}</div>
                <div style={styles.overdueInv}>{inv.id} · {inv.overdueDays}d overdue</div>
              </div>
              <div style={{ ...styles.overdueAmt, color: "#ef4444" }}>{formatCurrency(inv.balance)}</div>
            </div>
          ))}
        </div>

        {/* RECENT ACTIVITY */}
        <div style={styles.dashCard}>
          <div style={styles.cardTitle}>Recent Activity</div>
          {activities.slice(0, 4).map((a, i) => (
            <div key={i} style={styles.activityRow}>
              <div style={styles.activityAgent}>{a.agent.split(" ")[0][0]}</div>
              <div style={{ flex: 1 }}>
                <div style={styles.activityText}>{a.agent} · {CUSTOMERS.find(c => c.id === a.customerId)?.name}</div>
                <div style={styles.activityRemarks}>{a.remarks}</div>
              </div>
              <div style={styles.activityDate}>{a.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* STATUS SUMMARY */}
      <div style={styles.dashCard}>
        <div style={styles.cardTitle}>Invoice Status Summary</div>
        <div style={styles.statusRow}>
          {["Paid", "Partial", "Pending", "Overdue"].map(s => {
            const count = invoices.filter(i => i.status === s).length;
            const pct = Math.round((count / invoices.length) * 100);
            return (
              <div key={s} style={styles.statusBlock}>
                <div style={{ ...styles.statusDot, background: statusColor(s) }} />
                <div style={{ ...styles.statusCount, color: statusColor(s) }}>{count}</div>
                <div style={styles.statusLabel}>{s}</div>
                <div style={styles.statusPct}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── INVOICES ────────────────────────────────────────────────────────────────

function InvoicesView({ invoices, canEdit, setInvoices, onEmail, showToast }) {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = invoices.filter(i =>
    (filter === "All" || i.status === filter) &&
    (i.id.toLowerCase().includes(search.toLowerCase()) || i.customer?.name.toLowerCase().includes(search.toLowerCase()))
  );

  const markPaid = (invId) => {
    setInvoices(prev => prev.map(i => i.id === invId ? { ...i, received: i.amount, status: "Paid" } : i));
    showToast("Invoice marked as Paid!");
  };

  return (
    <div>
      <div style={styles.filterBar}>
        <input style={styles.searchInput} placeholder="🔍 Search invoice or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={styles.filterBtns}>
          {["All", "Pending", "Overdue", "Partial", "Paid"].map(f => (
            <button key={f} style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Invoice #", "Customer", "Invoice Date", "Due Date", "Amount", "Received", "Balance", "Overdue Days", "Aging", "Status", "Actions"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv, i) => {
              const rem = getReminderType(inv.overdueDays);
              return (
                <tr key={inv.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#0f1923" : "#111d2a" }}>
                  <td style={{ ...styles.td, color: "#60a5fa", fontWeight: 600 }}>{inv.id}</td>
                  <td style={styles.td}>{inv.customer?.name}</td>
                  <td style={styles.td}>{inv.invoiceDate}</td>
                  <td style={styles.td}>{inv.dueDate}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{formatCurrency(inv.amount)}</td>
                  <td style={{ ...styles.td, color: "#22c55e" }}>{formatCurrency(inv.received)}</td>
                  <td style={{ ...styles.td, color: "#ef4444", fontWeight: 600 }}>{formatCurrency(inv.balance)}</td>
                  <td style={{ ...styles.td, color: inv.overdueDays > 0 ? "#f59e0b" : "#94a3b8" }}>{inv.overdueDays > 0 ? `${inv.overdueDays}d` : "—"}</td>
                  <td style={styles.td}><span style={{ ...styles.agingBadge, background: inv.aging === "60+" ? "#7f1d1d" : inv.aging === "31–60" ? "#431407" : "#1c1917" }}>{inv.aging}</span></td>
                  <td style={styles.td}><span style={{ ...styles.statusBadge, background: statusColor(inv.status) + "22", color: statusColor(inv.status), border: `1px solid ${statusColor(inv.status)}44` }}>{inv.status}</span></td>
                  <td style={styles.td}>
                    <div style={styles.actionBtns}>
                      {inv.status !== "Paid" && (
                        <>
                          <button style={{ ...styles.actionBtn, background: rem.color + "22", color: rem.color }} onClick={() => onEmail({ inv, template: rem.label })}>✉ {rem.label}</button>
                          {canEdit && <button style={{ ...styles.actionBtn, background: "#16a34a22", color: "#22c55e" }} onClick={() => markPaid(inv.id)}>✓ Mark Paid</button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CUSTOMERS ───────────────────────────────────────────────────────────────

function CustomersView({ invoices }) {
  return (
    <div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Customer", "Contact", "Email", "Phone", "Credit Days", "Total Invoices", "Outstanding", "Overdue", "Status"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUSTOMERS.map((c, i) => {
              const custInv = invoices.filter(inv => inv.customerId === c.id);
              const outstanding = custInv.filter(inv => inv.status !== "Paid").reduce((s, inv) => s + inv.balance, 0);
              const overdue = custInv.filter(inv => inv.overdueDays > 0 && inv.status !== "Paid").reduce((s, inv) => s + inv.balance, 0);
              const hasOverdue = overdue > 0;
              return (
                <tr key={c.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#0f1923" : "#111d2a" }}>
                  <td style={{ ...styles.td, fontWeight: 600, color: "#e2e8f0" }}>{c.name}</td>
                  <td style={styles.td}>{c.contact}</td>
                  <td style={{ ...styles.td, color: "#60a5fa" }}>{c.email}</td>
                  <td style={styles.td}>{c.phone}</td>
                  <td style={styles.td}>{c.creditDays}d</td>
                  <td style={styles.td}>{custInv.length}</td>
                  <td style={{ ...styles.td, color: "#f59e0b", fontWeight: 600 }}>{formatCurrency(outstanding)}</td>
                  <td style={{ ...styles.td, color: "#ef4444", fontWeight: 600 }}>{formatCurrency(overdue)}</td>
                  <td style={styles.td}><span style={{ ...styles.statusBadge, background: hasOverdue ? "#ef444422" : "#22c55e22", color: hasOverdue ? "#ef4444" : "#22c55e", border: `1px solid ${hasOverdue ? "#ef444444" : "#22c55e44"}` }}>{hasOverdue ? "Overdue" : "Clear"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ACTIVITY ────────────────────────────────────────────────────────────────

function ActivityView({ activities, invoices }) {
  return (
    <div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Date", "Agent", "Customer", "Invoice", "Call Done", "Mail Sent", "Remarks", "Promised Date", "Next Follow-Up", "Status"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activities.map((a, i) => {
              const inv = invoices.find(inv => inv.id === a.invoiceId);
              const customer = CUSTOMERS.find(c => c.id === a.customerId);
              return (
                <tr key={a.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#0f1923" : "#111d2a" }}>
                  <td style={styles.td}>{a.date}</td>
                  <td style={{ ...styles.td, color: "#a78bfa", fontWeight: 600 }}>{a.agent}</td>
                  <td style={styles.td}>{customer?.name}</td>
                  <td style={{ ...styles.td, color: "#60a5fa" }}>{a.invoiceId}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}><span style={{ color: a.callDone ? "#22c55e" : "#ef4444" }}>{a.callDone ? "✓" : "✗"}</span></td>
                  <td style={{ ...styles.td, textAlign: "center" }}><span style={{ color: a.mailSent ? "#22c55e" : "#ef4444" }}>{a.mailSent ? "✓" : "✗"}</span></td>
                  <td style={{ ...styles.td, maxWidth: 200, fontSize: 12 }}>{a.remarks}</td>
                  <td style={styles.td}>{a.promised}</td>
                  <td style={styles.td}>{a.nextFollowUp}</td>
                  <td style={styles.td}><span style={{ ...styles.statusBadge, background: statusColor(a.paymentStatus) + "22", color: statusColor(a.paymentStatus), border: `1px solid ${statusColor(a.paymentStatus)}44` }}>{a.paymentStatus}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── OUTSTANDING ─────────────────────────────────────────────────────────────

function OutstandingView({ invoices }) {
  const customerSummary = CUSTOMERS.map(c => {
    const custInv = invoices.filter(i => i.customerId === c.id && i.status !== "Paid");
    const total = custInv.reduce((s, i) => s + i.balance, 0);
    const overdue = custInv.filter(i => i.overdueDays > 0).reduce((s, i) => s + i.balance, 0);
    const buckets = { "0–15": 0, "16–30": 0, "31–60": 0, "60+": 0 };
    custInv.forEach(i => buckets[i.aging] = (buckets[i.aging] || 0) + i.balance);
    return { ...c, total, overdue, buckets, invoiceCount: custInv.length };
  }).filter(c => c.total > 0);

  return (
    <div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Customer", "Invoices", "0–15 Days", "16–30 Days", "31–60 Days", "60+ Days", "Total Outstanding", "Total Overdue"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customerSummary.map((c, i) => (
              <tr key={c.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#0f1923" : "#111d2a" }}>
                <td style={{ ...styles.td, fontWeight: 600, color: "#e2e8f0" }}>{c.name}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>{c.invoiceCount}</td>
                <td style={{ ...styles.td, color: "#22c55e" }}>{c.buckets["0–15"] ? formatCurrency(c.buckets["0–15"]) : "—"}</td>
                <td style={{ ...styles.td, color: "#f59e0b" }}>{c.buckets["16–30"] ? formatCurrency(c.buckets["16–30"]) : "—"}</td>
                <td style={{ ...styles.td, color: "#f97316" }}>{c.buckets["31–60"] ? formatCurrency(c.buckets["31–60"]) : "—"}</td>
                <td style={{ ...styles.td, color: "#ef4444" }}>{c.buckets["60+"] ? formatCurrency(c.buckets["60+"]) : "—"}</td>
                <td style={{ ...styles.td, color: "#f59e0b", fontWeight: 700 }}>{formatCurrency(c.total)}</td>
                <td style={{ ...styles.td, color: "#ef4444", fontWeight: 700 }}>{formatCurrency(c.overdue)}</td>
              </tr>
            ))}
            <tr style={{ background: "#1e3a5f", fontWeight: 700 }}>
              <td style={{ ...styles.td, color: "#60a5fa" }}>TOTAL</td>
              <td style={{ ...styles.td, textAlign: "center", color: "#60a5fa" }}>{customerSummary.reduce((s, c) => s + c.invoiceCount, 0)}</td>
              {["0–15", "16–30", "31–60", "60+"].map(b => (
                <td key={b} style={{ ...styles.td, color: "#60a5fa" }}>{formatCurrency(customerSummary.reduce((s, c) => s + (c.buckets[b] || 0), 0))}</td>
              ))}
              <td style={{ ...styles.td, color: "#fbbf24", fontSize: 15 }}>{formatCurrency(customerSummary.reduce((s, c) => s + c.total, 0))}</td>
              <td style={{ ...styles.td, color: "#ef4444", fontSize: 15 }}>{formatCurrency(customerSummary.reduce((s, c) => s + c.overdue, 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── EMAIL TEMPLATES ─────────────────────────────────────────────────────────

function EmailTemplatesView({ invoices, onOpen }) {
  const overdueInvoices = invoices.filter(i => i.status !== "Paid" && i.overdueDays > 0);
  return (
    <div>
      <div style={{ marginBottom: 16, color: "#94a3b8", fontSize: 14 }}>Auto-generated reminder emails based on overdue duration. Click to preview and send.</div>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>{["Invoice", "Customer", "Email", "Balance", "Overdue Days", "Reminder Type", "Action"].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {overdueInvoices.map((inv, i) => {
              const rem = getReminderType(inv.overdueDays);
              return (
                <tr key={inv.id} style={{ ...styles.tr, background: i % 2 === 0 ? "#0f1923" : "#111d2a" }}>
                  <td style={{ ...styles.td, color: "#60a5fa" }}>{inv.id}</td>
                  <td style={styles.td}>{inv.customer?.name}</td>
                  <td style={{ ...styles.td, color: "#94a3b8" }}>{inv.customer?.email}</td>
                  <td style={{ ...styles.td, color: "#ef4444", fontWeight: 600 }}>{formatCurrency(inv.balance)}</td>
                  <td style={{ ...styles.td, color: "#f59e0b" }}>{inv.overdueDays}d</td>
                  <td style={styles.td}><span style={{ ...styles.statusBadge, background: rem.color + "22", color: rem.color, border: `1px solid ${rem.color}44` }}>{rem.label}</span></td>
                  <td style={styles.td}><button style={{ ...styles.actionBtn, background: rem.color + "22", color: rem.color }} onClick={() => onOpen({ inv, template: rem.label })}>✉ Preview & Send</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

function ReportsView({ kpis, invoices, activities }) {
  const agentStats = USERS.filter(u => u.role === "agent").map(agent => {
    const agentActs = activities.filter(a => a.agent === agent.displayName);
    const calls = agentActs.filter(a => a.callDone).length;
    const mails = agentActs.filter(a => a.mailSent).length;
    return { name: agent.displayName, calls, mails, total: agentActs.length };
  });

  return (
    <div>
      <div style={styles.dashRow}>
        <div style={{ ...styles.dashCard, flex: 1 }}>
          <div style={styles.cardTitle}>Daily Collection Report</div>
          {[
            ["Amount Received Today", formatCurrency(kpis.collectedToday)],
            ["Total Outstanding (Before)", formatCurrency(kpis.totalOutstanding + kpis.collectedToday)],
            ["Balance After Receipt", formatCurrency(kpis.totalOutstanding)],
            ["Total Pending Invoices", kpis.pendingCount],
            ["Total Overdue Invoices", kpis.overdueCount],
            ["Escalation Cases", kpis.escalationCases],
          ].map(([label, val]) => (
            <div key={label} style={styles.reportRow}>
              <span style={{ color: "#94a3b8" }}>{label}</span>
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ ...styles.dashCard, flex: 1 }}>
          <div style={styles.cardTitle}>Agent Performance Today</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Agent", "Calls", "Mails", "Activities"].map(h => <th key={h} style={{ ...styles.th, textAlign: "left" }}>{h}</th>)}</tr></thead>
            <tbody>
              {agentStats.map((a, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={{ ...styles.td, color: "#a78bfa" }}>{a.name}</td>
                  <td style={{ ...styles.td, color: "#22c55e" }}>{a.calls}</td>
                  <td style={{ ...styles.td, color: "#3b82f6" }}>{a.mails}</td>
                  <td style={styles.td}>{a.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────────────────────

function EmailModal({ data, onClose, showToast }) {
  const { inv, template } = data;
  const customer = inv.customer;
  const tmpl = emailTemplate(template, inv, customer);
  const [sent, setSent] = useState(false);
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>✉ {template}</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "0 24px 24px" }}>
          <div style={styles.emailField}><span style={styles.emailLabel}>TO:</span> {customer?.email}</div>
          <div style={styles.emailField}><span style={styles.emailLabel}>CC:</span> {customer?.escalationEmail}</div>
          <div style={styles.emailField}><span style={styles.emailLabel}>SUBJECT:</span> {tmpl.subject}</div>
          <div style={styles.emailBody}>{tmpl.body}</div>
          <div style={styles.emailNote}>📎 Attachment: {inv.id}_Invoice.pdf &nbsp;·&nbsp; Outstanding Report</div>
          {sent
            ? <div style={{ color: "#22c55e", textAlign: "center", padding: 12, fontWeight: 600 }}>✓ Email Sent Successfully!</div>
            : <div style={styles.modalBtns}>
                <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
                <button style={styles.primaryBtn} onClick={() => { setSent(true); setTimeout(() => { showToast("Email sent to " + customer?.email); onClose(); }, 1200); }}>Send Email →</button>
              </div>
          }
        </div>
      </div>
    </div>
  );
}

function ActivityFormModal({ invoices, onClose, onSave }) {
  const [form, setForm] = useState({ date: today.toISOString().split("T")[0], agent: "Ravi Kumar", customerId: 1, invoiceId: "INV-1021", callDone: false, mailSent: false, remarks: "", promised: "", nextFollowUp: "", paymentStatus: "Pending" });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>📞 Log Activity</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Date" type="date" value={form.date} onChange={v => f("date", v)} />
          <FormField label="Agent" type="select" value={form.agent} onChange={v => f("agent", v)} options={USERS.filter(u => u.role === "agent").map(u => u.displayName)} />
          <FormField label="Customer" type="select" value={form.customerId} onChange={v => f("customerId", +v)} options={CUSTOMERS.map(c => c.name)} optionValues={CUSTOMERS.map(c => c.id)} />
          <FormField label="Invoice" type="select" value={form.invoiceId} onChange={v => f("invoiceId", v)} options={invoices.filter(i => i.customerId === form.customerId).map(i => i.id)} />
          <div style={styles.checkRow}><label style={styles.checkLabel}><input type="checkbox" checked={form.callDone} onChange={e => f("callDone", e.target.checked)} style={{ marginRight: 8 }} /> Call Done</label></div>
          <div style={styles.checkRow}><label style={styles.checkLabel}><input type="checkbox" checked={form.mailSent} onChange={e => f("mailSent", e.target.checked)} style={{ marginRight: 8 }} /> Mail Sent</label></div>
          <div style={{ gridColumn: "1/-1" }}><FormField label="Remarks / Customer Said" type="textarea" value={form.remarks} onChange={v => f("remarks", v)} /></div>
          <FormField label="Promise Date" type="date" value={form.promised} onChange={v => f("promised", v)} />
          <FormField label="Next Follow-Up" type="date" value={form.nextFollowUp} onChange={v => f("nextFollowUp", v)} />
          <FormField label="Payment Status" type="select" value={form.paymentStatus} onChange={v => f("paymentStatus", v)} options={["Pending", "Paid", "Partial"]} />
          <div style={{ gridColumn: "1/-1", ...styles.modalBtns }}>
            <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={styles.primaryBtn} onClick={() => onSave(form)}>Save Activity →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddInvoiceModal({ onClose, onSave }) {
  const invNum = "INV-" + (1031 + Math.floor(Math.random() * 10));
  const [form, setForm] = useState({ id: invNum, invoiceDate: today.toISOString().split("T")[0], customerId: 1, amount: "", received: 0 });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const save = () => {
    const dueDate = new Date(new Date(form.invoiceDate).getTime() + 15 * 86400000).toISOString().split("T")[0];
    const status = +form.received >= +form.amount ? "Paid" : +form.received > 0 ? "Partial" : "Pending";
    onSave({ ...form, customerId: +form.customerId, amount: +form.amount, received: +form.received, dueDate, status });
  };
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>📄 Add New Invoice</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Invoice Number" value={form.id} onChange={v => f("id", v)} />
          <FormField label="Invoice Date" type="date" value={form.invoiceDate} onChange={v => f("invoiceDate", v)} />
          <FormField label="Customer" type="select" value={form.customerId} onChange={v => f("customerId", v)} options={CUSTOMERS.map(c => c.name)} optionValues={CUSTOMERS.map(c => c.id)} />
          <FormField label="Invoice Amount (₹)" type="number" value={form.amount} onChange={v => f("amount", v)} placeholder="e.g. 50000" />
          <FormField label="Amount Received (₹)" type="number" value={form.received} onChange={v => f("received", v)} placeholder="e.g. 0" />
          <div style={{ gridColumn: "1/-1", ...styles.modalBtns }}>
            <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={styles.primaryBtn} onClick={save}>Add Invoice →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, type = "text", value, onChange, options, optionValues, placeholder }) {
  return (
    <div style={styles.formGroup}>
      <label style={styles.label}>{label.toUpperCase()}</label>
      {type === "select" ? (
        <select style={styles.input} value={value} onChange={e => onChange(e.target.value)}>
          {(options || []).map((o, i) => <option key={i} value={optionValues ? optionValues[i] : o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea style={{ ...styles.input, height: 72, resize: "vertical" }} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <input style={styles.input} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

function Toast({ msg, type }) {
  return (
    <div style={{ ...styles.toast, background: type === "success" ? "#16a34a" : "#dc2626" }}>
      {type === "success" ? "✓" : "✗"} {msg}
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = {
  app: { display: "flex", height: "100vh", background: "#080e16", color: "#e2e8f0", fontFamily: "'DM Mono', 'Courier New', monospace", overflow: "hidden" },
  sidebar: { width: 220, minWidth: 220, background: "#09111a", borderRight: "1px solid #1e2d3d", display: "flex", flexDirection: "column", padding: "24px 0" },
  sidebarLogo: { display: "flex", alignItems: "center", gap: 12, padding: "0 20px 24px", borderBottom: "1px solid #1e2d3d" },
  logoIcon: { width: 42, height: 42, background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff" },
  logoTitle: { fontSize: 16, fontWeight: 700, color: "#f8fafc", letterSpacing: 1 },
  logoSub: { fontSize: 10, color: "#475569", letterSpacing: 1 },
  userBadge: { display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #1e2d3d" },
  userAvatar: { width: 32, height: 32, background: "linear-gradient(135deg, #7c3aed, #2563eb)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" },
  userName: { fontSize: 12, fontWeight: 600, color: "#e2e8f0" },
  userRole: { fontSize: 10, color: "#64748b", letterSpacing: 1 },
  nav: { flex: 1, padding: "16px 0" },
  navBtn: { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.15s", textAlign: "left" },
  navBtnActive: { color: "#60a5fa", background: "#1d4ed820", borderLeft: "2px solid #3b82f6" },
  navIcon: { fontSize: 14 },
  logoutBtn: { margin: "0 20px", padding: "10px 16px", background: "#1e2d3d", border: "1px solid #2d3d4d", borderRadius: 8, color: "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "20px 28px", background: "#09111a", borderBottom: "1px solid #1e2d3d", display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: 700, color: "#f1f5f9", letterSpacing: 0.5 },
  headerDate: { fontSize: 11, color: "#475569", marginTop: 3 },
  headerActions: { display: "flex", gap: 10 },
  content: { flex: 1, overflow: "auto", padding: 24 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 },
  kpiCard: { background: "#0d1926", border: "1px solid #1e2d3d", borderRadius: 10, padding: "18px 20px" },
  kpiTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  kpiIcon: { fontSize: 20 },
  kpiValue: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  kpiLabel: { fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" },
  kpiSub: { fontSize: 11, color: "#475569", marginTop: 2 },
  dashRow: { display: "flex", gap: 16, marginBottom: 16 },
  dashCard: { flex: 1, background: "#0d1926", border: "1px solid #1e2d3d", borderRadius: 10, padding: "18px 20px", marginBottom: 0 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#94a3b8", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14, borderBottom: "1px solid #1e2d3d", paddingBottom: 10 },
  agingRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  agingDot: { width: 8, height: 8, borderRadius: "50%" },
  agingLabel: { width: 80, fontSize: 12, color: "#94a3b8" },
  agingBar: { flex: 1, height: 6, background: "#1e2d3d", borderRadius: 3, overflow: "hidden" },
  agingBarFill: { height: "100%", borderRadius: 3, transition: "width 0.5s" },
  agingCount: { width: 50, fontSize: 12, fontWeight: 600, textAlign: "right" },
  overdueRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  overdueRank: { width: 22, height: 22, background: "#1e2d3d", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#64748b" },
  overdueCustomer: { fontSize: 13, fontWeight: 600, color: "#e2e8f0" },
  overdueInv: { fontSize: 11, color: "#64748b" },
  overdueAmt: { fontSize: 13, fontWeight: 700 },
  activityRow: { display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #1e2d3d" },
  activityAgent: { width: 28, height: 28, background: "#7c3aed33", color: "#a78bfa", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 },
  activityText: { fontSize: 12, fontWeight: 600, color: "#e2e8f0" },
  activityRemarks: { fontSize: 11, color: "#64748b", marginTop: 2 },
  activityDate: { fontSize: 10, color: "#475569", whiteSpace: "nowrap" },
  statusRow: { display: "flex", gap: 20 },
  statusBlock: { flex: 1, textAlign: "center", padding: "12px 0" },
  statusDot: { width: 12, height: 12, borderRadius: "50%", margin: "0 auto 6px" },
  statusCount: { fontSize: 28, fontWeight: 800 },
  statusLabel: { fontSize: 11, color: "#64748b", letterSpacing: 0.5, textTransform: "uppercase" },
  statusPct: { fontSize: 11, color: "#475569", marginTop: 2 },
  filterBar: { display: "flex", gap: 12, marginBottom: 16, alignItems: "center", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 200, padding: "9px 14px", background: "#0d1926", border: "1px solid #1e2d3d", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none" },
  filterBtns: { display: "flex", gap: 6 },
  filterBtn: { padding: "8px 14px", background: "#0d1926", border: "1px solid #1e2d3d", borderRadius: 6, color: "#64748b", cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  filterBtnActive: { background: "#1d4ed820", borderColor: "#3b82f6", color: "#60a5fa" },
  tableWrap: { background: "#0d1926", border: "1px solid #1e2d3d", borderRadius: 10, overflow: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "11px 14px", textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", borderBottom: "1px solid #1e2d3d", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #1e2d3d11" },
  td: { padding: "11px 14px", color: "#cbd5e1", verticalAlign: "middle", whiteSpace: "nowrap" },
  statusBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: 0.3 },
  agingBadge: { padding: "3px 8px", borderRadius: 4, fontSize: 11, color: "#94a3b8", border: "1px solid #1e2d3d" },
  actionBtns: { display: "flex", gap: 6 },
  actionBtn: { padding: "4px 10px", border: "none", borderRadius: 5, fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600, whiteSpace: "nowrap" },
  primaryBtn: { padding: "9px 18px", background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 },
  cancelBtn: { padding: "9px 18px", background: "#1e2d3d", border: "1px solid #2d3d4d", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  reportRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e2d3d", fontSize: 13 },
  loginBg: { minHeight: "100vh", background: "linear-gradient(135deg, #05080f 0%, #0a1628 50%, #080e18 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', 'Courier New', monospace" },
  loginCard: { background: "#09111a", border: "1px solid #1e2d3d", borderRadius: 16, padding: "40px 36px", width: 380, boxShadow: "0 20px 60px #00000080" },
  loginLogo: { width: 56, height: 56, background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 auto 16px" },
  loginTitle: { textAlign: "center", fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: 1, margin: "0 0 4px" },
  loginSub: { textAlign: "center", fontSize: 12, color: "#475569", marginBottom: 28, letterSpacing: 0.5 },
  loginError: { background: "#7f1d1d33", border: "1px solid #dc262644", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 12, marginBottom: 14 },
  loginBtn: { width: "100%", padding: "13px", background: "linear-gradient(135deg, #1d4ed8, #7c3aed)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 1, cursor: "pointer", fontFamily: "inherit", marginTop: 6 },
  loginHint: { fontSize: 11, color: "#334155", marginTop: 16, textAlign: "center" },
  formGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 10, color: "#64748b", fontWeight: 600, letterSpacing: 0.8 },
  input: { padding: "9px 12px", background: "#0d1926", border: "1px solid #1e2d3d", borderRadius: 7, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13, outline: "none" },
  checkRow: { display: "flex", alignItems: "center", padding: "8px 0" },
  checkLabel: { color: "#94a3b8", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center" },
  modalOverlay: { position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { background: "#09111a", border: "1px solid #1e2d3d", borderRadius: 14, width: 560, maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px #00000099" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #1e2d3d" },
  modalTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  closeBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 },
  modalBtns: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 },
  emailField: { fontSize: 12, color: "#94a3b8", marginBottom: 8 },
  emailLabel: { color: "#60a5fa", fontWeight: 600, marginRight: 8 },
  emailBody: { background: "#0d1926", border: "1px solid #1e2d3d", borderRadius: 8, padding: "14px", fontSize: 13, color: "#cbd5e1", whiteSpace: "pre-wrap", marginTop: 10, lineHeight: 1.7 },
  emailNote: { fontSize: 11, color: "#475569", marginTop: 10, padding: "8px 12px", background: "#1e2d3d44", borderRadius: 6 },
  toast: { position: "fixed", bottom: 28, right: 28, padding: "12px 20px", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: "0 4px 20px #00000066", fontFamily: "inherit" },
};
