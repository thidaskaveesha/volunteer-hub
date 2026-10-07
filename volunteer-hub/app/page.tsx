"use client";

import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import styles from "./page.module.css";

type Activity = {
  _id?: string;
  title: string;
  category: string;
  date: string;
  time?: string;
  location: string;
  distance?: number | null;
  attendees: number;
  spots: number;
  description: string;
  latitude?: number;
  longitude?: number;
  creatorName?: string;
  verificationCode?: string;
  color?: string;
};

type DemoUser = { name: string; username: string; password: string };
type Coordinates = { latitude: number; longitude: number };

const USER_KEY = "kindred-demo-users";
const SESSION_KEY = "kindred-demo-session";
const ACTIVITY_KEY = "kindred-demo-activities";
const starterUsers: DemoUser[] = [
  { name: "Demo Volunteer", username: "volunteer", password: "welcome1" },
  { name: "Ava Organizer", username: "ava", password: "kindred1" },
];
const starterActivities: Activity[] = [
  { _id: "demo-1", title: "Riverside cleanup", category: "Environment", date: "2026-10-14", time: "09:00", location: "Riverside Park", attendees: 12, spots: 30, description: "Help collect litter and restore the walking trails along the river.", latitude: 6.9271, longitude: 79.8612, creatorName: "Ava Organizer", color: "#31b887" },
  { _id: "demo-2", title: "Community food drive", category: "Community", date: "2026-10-18", time: "10:30", location: "Central Community Hall", attendees: 8, spots: 20, description: "Sort, pack, and distribute essential food supplies to local families.", latitude: 6.9147, longitude: 79.8731, creatorName: "Ava Organizer", color: "#e5a548" },
  { _id: "demo-3", title: "Teach a tech skill", category: "Education", date: "2026-10-21", time: "14:00", location: "Open Learning Hub", attendees: 5, spots: 12, description: "Share practical digital skills with students building their first projects.", latitude: 6.9344, longitude: 79.8478, creatorName: "Demo Volunteer", color: "#c47ed4" },
];

const navItems = [["⌂", "Discover"], ["▣", "My activities"], ["✦", "Create activity"], ["✓", "Verify volunteering"], ["▤", "My certificates"]];

export default function Home() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [activeNav, setActiveNav] = useState("Discover");
  const [modal, setModal] = useState<"create" | "verify" | "certificates" | "documentVerify" | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState("Requesting your location…");
  const [verifyCode, setVerifyCode] = useState("");
  const [hash, setHash] = useState("");
  const [verificationResult, setVerificationResult] = useState("");

  useEffect(() => {
    const initializeDemo = window.setTimeout(() => {
      const storedUsers = localStorage.getItem(USER_KEY);
      if (!storedUsers) localStorage.setItem(USER_KEY, JSON.stringify(starterUsers));
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession) setUser(JSON.parse(storedSession) as DemoUser);
      const storedActivities = localStorage.getItem(ACTIVITY_KEY);
      const nextActivities = storedActivities ? JSON.parse(storedActivities) as Activity[] : starterActivities;
      if (!storedActivities) localStorage.setItem(ACTIVITY_KEY, JSON.stringify(starterActivities));
      setActivities(nextActivities);
      setSelected(nextActivities[0] ?? null);
      setHydrated(true);
    }, 0);
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const next: Coordinates = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setLocation(next);
        setLocationState("Showing activities near you");
      },
      () => setLocationState("Location unavailable — showing demo activities"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
    return () => window.clearTimeout(initializeDemo);
  }, []);

  function navigate(label: string) {
    setActiveNav(label);
    if (label === "Create activity") setModal("create");
    if (label === "Verify volunteering") setModal("verify");
    if (label === "My certificates") setModal("certificates");
  }

  if (!hydrated) return <div className={styles.loginPage}><div className={styles.loginCard}>Loading Kindred…</div></div>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;

  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const progress = selected ? Math.round((selected.attendees / Math.max(selected.spots, 1)) * 100) : 0;

  return <main className={styles.appShell}>
    <aside className={styles.sidebar}><div className={styles.brand}><span className={styles.brandMark}>+</span><span>kindred</span></div><div className={styles.profile}><div className={styles.avatar}>{initials}</div><div><strong>{user.name}</strong><small>@{user.username}</small></div></div><nav className={styles.nav}><p className={styles.navLabel}>WORKSPACE</p>{navItems.map(([icon, label]) => <button key={label} className={`${styles.navItem} ${activeNav === label ? styles.active : ""}`} onClick={() => navigate(label)}><span>{icon}</span>{label}</button>)}</nav><div className={styles.sidebarBottom}><div className={styles.impactCard}><span className={styles.impactIcon}>♥</span><div><strong>Verified contributions</strong><small>Build your impact record.</small></div></div><button className={styles.navItem}><span>⚙</span>Settings</button><button className={styles.navItem} onClick={() => { localStorage.removeItem(SESSION_KEY); setUser(null); }}><span>↪</span>Sign out</button></div></aside>
    <section className={styles.content}><header className={styles.topbar}><div><p className={styles.eyebrow}>DEMO DASHBOARD · {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</p><h1>Good morning, {user.name.split(" ")[0]} <span>✦</span></h1></div><div className={styles.topActions}><button className={styles.helpButton} onClick={() => setModal("documentVerify")}>?</button><div className={styles.miniAvatar}>{initials}</div></div></header><div className={styles.body}><div className={styles.headingRow}><div><h2>Find your next way to help</h2><p>{locationState}</p></div><button className={styles.locationButton} onClick={() => navigator.geolocation?.getCurrentPosition((p) => { const next = { latitude: p.coords.latitude, longitude: p.coords.longitude }; setLocation(next); setLocationState("Showing activities near you"); })}>⌖ Use my location</button></div><div className={styles.filters}><div className={styles.search}><span>⌕</span><input placeholder="Search activities, causes, or locations" /></div><button className={styles.filterButton}>☷ Filters</button></div><div className={styles.workspace}><div className={styles.map}><div className={styles.mapTools}><button>＋</button><button>−</button><button>⌾</button></div><div className={styles.mapLabel}>{location ? "NEAR YOU" : "ACTIVITIES"}</div><div className={`${styles.road} ${styles.roadOne}`} /><div className={`${styles.road} ${styles.roadTwo}`} />{activities.map((activity, index) => <button key={activity._id ?? activity.title} className={`${styles.pin} ${selected?.title === activity.title ? styles.pinSelected : ""}`} style={{ left: `${22 + ((index * 19) % 65)}%`, top: `${25 + ((index * 17) % 52)}%`, background: activity.color ?? "#31b887" }} onClick={() => setSelected(activity)} aria-label={activity.title}>♥</button>)}<div className={styles.mapAttribution}>Map location is based on your browser permission</div></div><div className={styles.details}>{selected ? <><div className={styles.detailHeader}><span className={styles.category}>{selected.category}</span><button className={styles.close} onClick={() => setSelected(null)}>×</button></div><h3>{selected.title}</h3><p className={styles.detailDescription}>{selected.description}</p><div className={styles.detailMeta}><span>◷</span><div><strong>{new Date(selected.date).toLocaleDateString()}</strong><small>{selected.time ?? "Time set by organizer"}</small></div></div><div className={styles.detailMeta}><span>⌖</span><div><strong>{selected.location}</strong><small>{selected.distance == null ? "Location available" : `${selected.distance.toFixed(1)} mi away`}</small></div></div><div className={styles.detailMeta}><span>♙</span><div><strong>{selected.attendees ?? 0} people joined</strong><small>{Math.max((selected.spots ?? 0) - (selected.attendees ?? 0), 0)} spots remaining</small></div></div><div className={styles.progress}><div style={{ width: `${progress}%` }} /></div><button className={styles.primaryButton} onClick={() => setModal("verify")}>Verify attendance <span>→</span></button><div className={styles.creator}><div className={styles.creatorAvatar}>✓</div><div><small>ORGANIZED BY</small><strong>{selected.creatorName ?? "Kindred organizer"}</strong></div><span className={styles.verified}>✓ Verified</span></div></> : <div className={styles.emptyDetails}><h3>No activities nearby yet</h3><p>Create the first opportunity in your area.</p><button className={styles.primaryButton} onClick={() => setModal("create")}>Create activity <span>→</span></button></div>}</div></div></div></section>
    {modal === "create" && <CreateModal onClose={() => setModal(null)} onCreated={(activity) => { const next = [activity, ...activities]; setActivities(next); localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next)); setSelected(activity); setModal(null); }} location={location} />}
    {modal === "verify" && <VerifyModal onClose={() => setModal(null)} code={verifyCode} setCode={setVerifyCode} onVerified={() => { setModal("certificates"); setVerifyCode(""); }} />}
    {modal === "certificates" && <CertificatesModal onClose={() => setModal(null)} />}
    {modal === "documentVerify" && <DocumentVerifyModal onClose={() => setModal(null)} hash={hash} setHash={setHash} result={verificationResult} setResult={setVerificationResult} />}
  </main>;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: DemoUser) => void }) {
  const [mode, setMode] = useState<"signIn" | "register">("signIn");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    const users = JSON.parse(localStorage.getItem(USER_KEY) ?? JSON.stringify(starterUsers)) as DemoUser[];
    const normalizedUsername = username.trim().toLowerCase();
    if (mode === "register") {
      if (users.some((candidate) => candidate.username === normalizedUsername)) {
        setMessage("That username is already taken.");
        setBusy(false);
        return;
      }
      const newUser = { name: name.trim(), username: normalizedUsername, password };
      users.push(newUser);
      localStorage.setItem(USER_KEY, JSON.stringify(users));
      localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
      onAuthenticated(newUser);
      return;
    }

    const found = users.find((candidate) => candidate.username === normalizedUsername && candidate.password === password);
    setBusy(false);
    if (!found) { setMessage("Incorrect username or password."); return; }
    localStorage.setItem(SESSION_KEY, JSON.stringify(found));
    onAuthenticated(found);
  }

  return <div className={styles.loginPage}><div className={styles.loginCard}>
    <div className={styles.loginBrand}><span className={styles.brandMark}>+</span> kindred</div>
    <p className={styles.modalEyebrow}>VOLUNTEER TOGETHER</p>
    <h1>Make a difference, close to home.</h1>
    <p>Discover local causes, show up for your community, and keep a verified record of every contribution.</p>
    <div className={styles.authTabs}><button className={mode === "signIn" ? styles.authTabActive : ""} onClick={() => { setMode("signIn"); setMessage(""); }}>Sign in</button><button className={mode === "register" ? styles.authTabActive : ""} onClick={() => { setMode("register"); setMessage(""); }}>Create account</button></div>
    <form className={styles.authForm} onSubmit={submit}>
      {mode === "register" && <label>Your name<input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} /></label>}
      <label>Username<input required minLength={3} autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
      <label>Password<input required minLength={8} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {message && <p className={styles.error}>{message}</p>}
      <button className={styles.primaryButton} disabled={busy}>{busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in"} <span>→</span></button>
    </form>
    <small>Demo mode is running locally. Try <strong>volunteer</strong> / <strong>welcome1</strong>, or create a new account.</small>
  </div></div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className={styles.modalBackdrop}><div className={styles.modal}><button className={styles.modalClose} onClick={onClose}>×</button><p className={styles.modalEyebrow}>KINDRED</p><h2>{title}</h2>{children}</div></div>;
}

function CreateModal({ onClose, onCreated, location }: { onClose: () => void; onCreated: (activity: Activity) => void; location: Coordinates | null }) {
  const [form, setForm] = useState({ title: "", category: "Environment", date: "", time: "", location: "", description: "", spots: "20" });
  const [pin, setPin] = useState<Coordinates | null>(location);
  const [message, setMessage] = useState("");
  function submit(event: React.FormEvent) { event.preventDefault(); if (!pin) { setMessage("Use your current location or enter a map pin before publishing."); return; } onCreated({ ...form, spots: Number(form.spots), attendees: 0, latitude: pin.latitude, longitude: pin.longitude, creatorName: "You", color: "#31b887", _id: `local-${Date.now()}` }); }
  function useCurrentLocation() { navigator.geolocation?.getCurrentPosition((position) => setPin({ latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setMessage("Location permission was unavailable.")); }
  return <Modal title="Create a volunteer activity" onClose={onClose}><form onSubmit={submit}><div className={styles.formGrid}>{(["title", "location", "date", "time", "spots"] as const).map((field) => <label key={field}>{field === "title" ? "Activity name" : field[0].toUpperCase() + field.slice(1)}<input required={field !== "time"} type={field === "date" ? "date" : field === "time" ? "time" : field === "spots" ? "number" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field === "title" ? "e.g. Park cleanup day" : ""} /></label>)}<label>Cause<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Environment</option><option>Community</option><option>Education</option><option>Health</option></select></label><label className={styles.fullField}>Description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div><div className={styles.pinPanel}><strong>Activity location</strong><p>Choose your current position or pin coordinates for the meeting point.</p><button type="button" className={styles.secondaryButton} onClick={useCurrentLocation}>⌖ Use current location</button><div className={styles.coordinateGrid}><label>Latitude<input type="number" step="any" value={pin?.latitude ?? ""} onChange={(event) => setPin({ latitude: Number(event.target.value), longitude: pin?.longitude ?? 0 })} /></label><label>Longitude<input type="number" step="any" value={pin?.longitude ?? ""} onChange={(event) => setPin({ latitude: pin?.latitude ?? 0, longitude: Number(event.target.value) })} /></label></div>{pin && <small>📍 Location pinned at {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}</small>}</div>{message && <p className={styles.error}>{message}</p>}<button className={styles.primaryButton}>Publish activity <span>→</span></button></form></Modal>;
}

function VerifyModal({ onClose, code, setCode, onVerified }: { onClose: () => void; code: string; setCode: (value: string) => void; onVerified: () => void }) {
  const [message, setMessage] = useState("");
  async function verify() { const response = await fetch("/api/activities/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) }); const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Verification failed."); return; } onVerified(); }
  return <Modal title="Verify volunteering" onClose={onClose}><p className={styles.modalCopy}>Ask the organizer for the code shown at the activity. Your verified attendance becomes part of your document.</p><label>Organizer verification code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="e.g. KND-4829" /></label>{message && <p className={styles.error}>{message}</p>}<button className={styles.primaryButton} onClick={verify}>Verify attendance <span>→</span></button></Modal>;
}

function CertificatesModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  async function download() { const response = await fetch("/api/documents"); const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Unable to load contributions."); return; } const pdf = await PDFDocument.create(); const page = pdf.addPage(); const font = await pdf.embedFont(StandardFonts.Helvetica); page.drawText("KINDRED · VERIFIED CONTRIBUTION RECORD", { x: 45, y: 755, size: 16, font, color: rgb(0.12, 0.5, 0.35) }); page.drawText("Volunteer activity history", { x: 45, y: 725, size: 22, font }); let y = 680; const lines = data.attendance.length ? data.attendance : [{ activityTitle: "No verified activities yet", verifiedAt: new Date().toISOString() }]; lines.forEach((item: { activityTitle: string; verifiedAt: string; location?: string; organizerEmail?: string }, index: number) => { page.drawText(`${index + 1}. ${item.activityTitle}`, { x: 55, y, size: 13, font }); page.drawText(`   Verified: ${new Date(item.verifiedAt).toLocaleString()}${item.location ? ` · ${item.location}` : ""}`, { x: 70, y: y - 18, size: 10, font }); page.drawText(`   Organizer: ${item.organizerEmail ?? "Kindred organizer"}`, { x: 70, y: y - 34, size: 10, font }); y -= 70; }); const bytes = await pdf.save(); const stableBytes = new Uint8Array(bytes); const digest = await crypto.subtle.digest("SHA-256", stableBytes.buffer as ArrayBuffer); const hash = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join(""); await fetch("/api/documents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash, activityCount: lines.length }) }); const blob = new Blob([stableBytes.buffer as ArrayBuffer], { type: "application/pdf" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `kindred-contributions-${hash.slice(0, 10)}.pdf`; anchor.click(); URL.revokeObjectURL(url); setMessage(`Document hash: ${hash}`); }
  return <Modal title="My verified document" onClose={onClose}><p className={styles.modalCopy}>Download a point-by-point PDF of every attendance record you have verified. Anyone can validate its hash.</p>{message && <p className={styles.hash}>{message}</p>}<button className={styles.primaryButton} onClick={download}>Generate PDF document <span>↓</span></button><button className={styles.secondaryButton} onClick={() => { onClose(); }}>Verify someone&apos;s hash</button></Modal>;
}

function DocumentVerifyModal({ onClose, hash, setHash, result, setResult }: { onClose: () => void; hash: string; setHash: (value: string) => void; result: string; setResult: (value: string) => void }) {
  async function verify() { const response = await fetch("/api/documents/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hash }) }); setResult(response.ok ? "✓ This document was generated by Kindred." : "✕ No matching verified document was found."); }
  return <Modal title="Verify a document" onClose={onClose}><p className={styles.modalCopy}>Paste the SHA-256 hash printed at the bottom of a Kindred PDF.</p><label>Document hash<input value={hash} onChange={(event) => setHash(event.target.value)} placeholder="Paste the complete hash" /></label>{result && <p className={result.startsWith("✓") ? styles.success : styles.error}>{result}</p>}<button className={styles.primaryButton} onClick={verify}>Check document <span>→</span></button></Modal>;
}
