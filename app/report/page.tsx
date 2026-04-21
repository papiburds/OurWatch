"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createIncident, uploadIncidentPhoto } from "@/lib/incidents";
import { useToast } from "@/app/toast-provider";
import AppShell from "@/app/components/AppShell";

const S = {
  page: { backgroundColor: "var(--ow-bg)", minHeight: "100vh" },
  card: { backgroundColor: "var(--ow-card)", borderColor: "var(--ow-border)" },
  input: { backgroundColor: "var(--ow-card-2)", borderColor: "var(--ow-border)", color: "var(--ow-text)" },
  text: { color: "var(--ow-text)" },
  text2: { color: "var(--ow-text-2)" },
  label: { color: "var(--ow-text-2)" },
};

export default function ReportPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  // System is limited to Barangay Cabulijan only, so community is fixed.
  const [formData, setFormData] = useState({
    type: "",
    community: "Barangay Cabulijan",
    location: "",
    description: "",
  });

  useEffect(() => {
    (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) { setTimeout(() => router.push("/login"), 0); return; }
      // Officials use only the Monitoring dashboard.
      if (profile.role === "Captain") { setTimeout(() => router.push("/monitoring"), 0); return; }
    })().catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) { setPhotoFile(null); setPhotoPreview(null); return; }
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are allowed.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("Image must be 10 MB or smaller.", "error");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const profile = await getCurrentUserProfile();
      if (!profile) { showToast("Please sign in first.", "error"); router.push("/login"); return; }

      let photoUrl: string | undefined;
      if (photoFile) {
        showToast("Uploading photo…", "info");
        photoUrl = await uploadIncidentPhoto(photoFile);
      }

      await createIncident({
        user: profile,
        type: formData.type || "General",
        community: formData.community,
        location: formData.location,
        description: formData.description,
        photoUrl,
      });
      showToast("Incident report submitted successfully.", "success");
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit report.";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={S.page}>
      <AppShell activePage="report" />

      <main className="px-8 py-8 max-w-4xl mx-auto">
        <div className="mb-7">
          <h2 style={S.text} className="text-3xl font-black tracking-tight">Report Incident</h2>
          <p style={S.text2} className="text-sm mt-1">Help your community by reporting incidents in real-time</p>
        </div>

        {/* Info banner */}
        <div className="rounded-xl p-4 mb-7 flex gap-3 items-start"
          style={{ backgroundColor: "var(--ow-badge-bg)", borderLeft: "3px solid var(--ow-accent)" }}>
          <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--ow-accent)" }} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--ow-badge-text)" }}>Important Information</p>
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--ow-badge-text)" }}>
              Your report will be shared with nearby users and relevant authorities. Please provide accurate information to help ensure community safety.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={S.card} className="rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-7 space-y-6">
            <h3 style={S.text} className="text-base font-bold">Incident Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label style={S.label} className="text-xs font-semibold uppercase tracking-wide block">Incident Type *</label>
                <select name="type" required value={formData.type} onChange={handleChange}
                  style={S.input} className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition">
                  <option value="">Select incident type</option>
                  <option value="Crime">Crime</option>
                  <option value="Suspicious Activity">Suspicious Activity</option>
                  <option value="Accident">Accident</option>
                  <option value="Other Report">Other Report</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label style={S.label} className="text-xs font-semibold uppercase tracking-wide block">Community / Barangay</label>
                <input
                  name="community"
                  type="text"
                  value="Barangay Cabulijan"
                  readOnly
                  disabled
                  style={{ ...S.input, opacity: 0.85, cursor: "not-allowed" }}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  title="This system serves Barangay Cabulijan only."
                />
                <p className="text-[11px] mt-0.5" style={S.text2}>
                  OurWatch currently serves Barangay Cabulijan only.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label style={S.label} className="text-xs font-semibold uppercase tracking-wide block">Location *</label>
              <div className="flex gap-2">
                <input name="location" type="text" required value={formData.location}
                  placeholder="Enter location or street address" onChange={handleChange}
                  style={S.input}
                  className="flex-1 px-4 py-3 rounded-xl border text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
                <button type="button"
                  style={{ ...S.card, color: "var(--ow-text-2)" }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl border text-sm font-medium hover:opacity-80 transition whitespace-nowrap">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Use GPS
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label style={S.label} className="text-xs font-semibold uppercase tracking-wide block">Description *</label>
              <textarea name="description" required rows={4} value={formData.description}
                placeholder="Provide a detailed description of the incident..."
                onChange={handleChange}
                style={S.input}
                className="w-full px-4 py-3 rounded-xl border text-sm placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition" />
            </div>

            {/* Photo upload */}
            <div className="space-y-1.5">
              <label style={S.label} className="text-xs font-semibold uppercase tracking-wide block">Photo Evidence (Optional)</label>

              {photoPreview ? (
                <div style={{ borderColor: "var(--ow-border)" }}
                  className="border-2 rounded-2xl p-3 flex flex-col sm:flex-row gap-4 items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview"
                    className="w-40 h-40 object-cover rounded-xl"
                    style={{ borderColor: "var(--ow-border)" }} />
                  <div className="flex-1 text-center sm:text-left">
                    <p style={S.text} className="text-sm font-semibold truncate">{photoFile?.name}</p>
                    <p style={S.text2} className="text-xs mt-0.5">
                      {photoFile ? `${(photoFile.size / 1024 / 1024).toFixed(2)} MB` : ""}
                    </p>
                    <button type="button" onClick={clearPhoto}
                      className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold transition hover:opacity-80"
                      style={{ backgroundColor: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <label style={{ borderColor: "var(--ow-border)" }}
                  className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:opacity-80 transition">
                  <svg className="w-10 h-10 opacity-30" style={S.text2} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p style={S.text2} className="text-sm font-medium">Attach a photo as evidence</p>
                  <p style={{ color: "var(--ow-text-3)" }} className="text-xs">JPG / PNG / WebP, up to 10 MB</p>
                  <div style={{ ...S.card, color: "var(--ow-text-2)" }}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl border text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Choose Photo
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ borderColor: "var(--ow-border)" }} className="px-7 py-5 border-t flex gap-3">
            <button type="submit" disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50"
              style={{ backgroundColor: "var(--ow-accent)" }}>
              {isSubmitting ? "Submitting…" : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Report
                </>
              )}
            </button>
            <button type="reset"
              onClick={() => { setFormData({ type: "", community: "Barangay Cabulijan", location: "", description: "" }); clearPhoto(); }}
              style={{ ...S.card, color: "var(--ow-text-2)" }}
              className="px-8 py-3 rounded-xl border font-medium text-sm hover:opacity-80 transition">
              Clear
            </button>
          </div>
        </form>

        <footer style={{ color: "var(--ow-text-3)" }} className="mt-10 text-center text-xs">
          © 2026 OurWatch. Empowering communities through real-time incident reporting.
        </footer>
      </main>
    </div>
  );
}
