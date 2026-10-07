"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
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

const navItems = [["⌂", "Discover"], ["▣", "My activities"], ["✦", "Create activity"], ["✓", "Verify volunteering"], ["▤", "My certificates"]];

export default function Home() {
  const { data: session, status } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [activeNav, setActiveNav] = useState("Discover");
  const [modal, setModal] = useState<"create" | "verify" | "certificates" | "documentVerify" | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationState, setLocationState] = useState("Requesting your location…");
  const [error, setError] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [hash, setHash] = useState("");
  const [verificationResult, setVerificationResult] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        setLocation(next);
        setLocationState("Showing activities near you");
        void loadActivities(next);
      },
      () => { setLocationState("Location unavailable — showing all activities"); void loadActivities(null); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [status]);

  async function loadActivities(coords: { latitude: number; longitude: number } | null) {
    const query = coords ? `?lat=${coords.latitude}&lng=${coords.longitude}` : "";
    const response = await fetch(`/api/activities${query}`);
    const data = await response.json();
    if (!response.ok) { setError(data.error ?? "Unable to load activities."); return; }
    setActivities(data);
    setSelected(data[0] ?? null);
  }

  function navigate(label: string) {
    setActiveNav(label);
    if (label === "Create activity") setModal("create");
    if (label === "Verify volunteering") setModal("verify");
    if (label === "My certificates") setModal("certificates");
  }

  if (status === "loading") return <div className={styles.loginPage}><div className={styles.loginCard}>Loading Kindred…</div></div>;
  if (!session) return <div className={styles.loginPage}><div className={styles.loginCard}><div className={styles.loginBrand}><span className={styles.brandMark}>+</span> kindred</div><p className={styles.modalEyebrow}>VOLUNTEER TOGETHER</p><h1>Make a difference, close to home.</h1><p>Discover local causes, show up for your community, and keep a verified record of every contribution.</p><button className={styles.googleButton} onClick={() => signIn("google")}><span>G</span> Continue with Google</button><small>Sign in securely with your Google account. New accounts are created automatically.</small></div></div>;

  const initials = (session.user?.name ?? session.user?.email ?? "U").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const progress = selected ? Math.round((selected.attendees / Math.max(selected.spots, 1)) * 100) : 0;

  return <main className={styles.appShell}>
    <aside className={styles.sidebar}><div className={styles.brand}><span className={styles.brandMark}>+</span><span>kindred</span></div><div className={styles.profile}><div className={styles.avatar}>{initials}</div><div><strong>{session.user?.name ?? "Volunteer"}</strong><small>{session.user?.email}</small></div></div><nav className={styles.nav}><p className={styles.navLabel}>WORKSPACE</p>{navItems.map(([icon, label]) => <button key={label} className={`${styles.navItem} ${activeNav === label ? styles.active : ""}`} onClick={() => navigate(label)}><span>{icon}</span>{label}</button>)}</nav><div className={styles.sidebarBottom}><div className={styles.impactCard}><span className={styles.impactIcon}>♥</span><div><strong>Verified contributions</strong><small>Build your impact record.</small></div></div><button className={styles.navItem}><span>⚙</span>Settings</button><button className={styles.navItem} onClick={() => signOut()}><span>↪</span>Sign out</button></div></aside>
    <section className={styles.content}><header className={styles.topbar}><div><p className={styles.eyebrow}>{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</p><h1>Good morning, {session.user?.name?.split(" ")[0] ?? "volunteer"} <span>✦</span></h1></div><div className={styles.topActions}><button className={styles.helpButton} onClick={() => setModal("documentVerify")}>?</button><div className={styles.miniAvatar}>{initials}</div></div></header><div className={styles.body}><div className={styles.headingRow}><div><h2>Find your next way to help</h2><p>{locationState}</p></div><button className={styles.locationButton} onClick={() => navigator.geolocation?.getCurrentPosition((p) => { const next = { latitude: p.coords.latitude, longitude: p.coords.longitude }; setLocation(next); void loadActivities(next); })}>⌖ Use my location</button></div><div className={styles.filters}><div className={styles.search}><span>⌕</span><input placeholder="Search activities, causes, or locations" /></div><button className={styles.filterButton}>☷ Filters</button></div>{error && <p className={styles.error}>{error}</p>}<div className={styles.workspace}><div className={styles.map}><div className={styles.mapTools}><button>＋</button><button>−</button><button>⌾</button></div><div className={styles.mapLabel}>{location ? "NEAR YOU" : "ACTIVITIES"}</div><div className={`${styles.road} ${styles.roadOne}`} /><div className={`${styles.road} ${styles.roadTwo}`} />{activities.map((activity, index) => <button key={activity._id ?? activity.title} className={`${styles.pin} ${selected?.title === activity.title ? styles.pinSelected : ""}`} style={{ left: `${22 + ((index * 19) % 65)}%`, top: `${25 + ((index * 17) % 52)}%`, background: activity.color ?? "#31b887" }} onClick={() => setSelected(activity)} aria-label={activity.title}>♥</button>)}<div className={styles.mapAttribution}>Map location is based on your browser permission</div></div><div className={styles.details}>{selected ? <><div className={styles.detailHeader}><span className={styles.category}>{selected.category}</span><button className={styles.close} onClick={() => setSelected(null)}>×</button></div><h3>{selected.title}</h3><p className={styles.detailDescription}>{selected.description}</p><div className={styles.detailMeta}><span>◷</span><div><strong>{new Date(selected.date).toLocaleDateString()}</strong><small>{selected.time ?? "Time set by organizer"}</small></div></div><div className={styles.detailMeta}><span>⌖</span><div><strong>{selected.location}</strong><small>{selected.distance == null ? "Location available" : `${selected.distance.toFixed(1)} mi away`}</small></div></div><div className={styles.detailMeta}><span>♙</span><div><strong>{selected.attendees ?? 0} people joined</strong><small>{Math.max((selected.spots ?? 0) - (selected.attendees ?? 0), 0)} spots remaining</small></div></div><div className={styles.progress}><div style={{ width: `${progress}%` }} /></div><button className={styles.primaryButton} onClick={() => setModal("verify")}>Verify attendance <span>→</span></button><div className={styles.creator}><div className={styles.creatorAvatar}>✓</div><div><small>ORGANIZED BY</small><strong>{selected.creatorName ?? "Kindred organizer"}</strong></div><span className={styles.verified}>✓ Verified</span></div></> : <div className={styles.emptyDetails}><h3>No activities nearby yet</h3><p>Create the first opportunity in your area.</p><button className={styles.primaryButton} onClick={() => setModal("create")}>Create activity <span>→</span></button></div>}</div></div></div></section>
    {modal === "create" && <CreateModal onClose={() => setModal(null)} onCreated={(activity) => { setActivities((current) => [activity, ...current]); setSelected(activity); setModal(null); }} location={location} />}
    {modal === "verify" && <VerifyModal onClose={() => setModal(null)} code={verifyCode} setCode={setVerifyCode} onVerified={() => { setModal("certificates"); setVerifyCode(""); }} />}
    {modal === "certificates" && <CertificatesModal onClose={() => setModal(null)} />}
    {modal === "documentVerify" && <DocumentVerifyModal onClose={() => setModal(null)} hash={hash} setHash={setHash} result={verificationResult} setResult={setVerificationResult} />}
  </main>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className={styles.modalBackdrop}><div className={styles.modal}><button className={styles.modalClose} onClick={onClose}>×</button><p className={styles.modalEyebrow}>KINDRED</p><h2>{title}</h2>{children}</div></div>;
}

function CreateModal({ onClose, onCreated, location }: { onClose: () => void; onCreated: (activity: Activity) => void; location: { latitude: number; longitude: number } | null }) {
  const [form, setForm] = useState({ title: "", category: "Environment", date: "", time: "", location: "", description: "", spots: "20" });
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); if (!location) { setMessage("Allow browser location access before creating an activity."); return; } const response = await fetch("/api/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, spots: Number(form.spots), latitude: location.latitude, longitude: location.longitude }) }); const data = await response.json(); if (!response.ok) { setMessage(data.error ?? "Unable to create activity."); return; } onCreated({ ...form, spots: Number(form.spots), attendees: 0, latitude: location.latitude, longitude: location.longitude, ...data }); }
  return <Modal title="Create a volunteer activity" onClose={onClose}><form onSubmit={submit}><div className={styles.formGrid}>{(["title", "location", "date", "time", "spots"] as const).map((field) => <label key={field}>{field === "title" ? "Activity name" : field[0].toUpperCase() + field.slice(1)}<input required={field !== "time"} type={field === "date" ? "date" : field === "time" ? "time" : field === "spots" ? "number" : "text"} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} placeholder={field === "title" ? "e.g. Park cleanup day" : ""} /></label>)}<label>Cause<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Environment</option><option>Community</option><option>Education</option><option>Health</option></select></label><label className={styles.fullField}>Description<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div>{message && <p className={styles.error}>{message}</p>}<button className={styles.primaryButton}>Publish activity <span>→</span></button></form></Modal>;
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
