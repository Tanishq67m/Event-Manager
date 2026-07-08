"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCircle,
  ShieldCheck,
  Bell,
  Building2,
  Paintbrush,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  Globe,
  UploadCloud,
  LogOut,
  Trash2,
  ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { organizations } from "@/lib/api";

const TABS = [
  { id: "profile", label: "Global Profile", icon: UserCircle },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "admin", label: "Admin Panel", icon: ShieldAlert, adminOnly: true }
];

export default function SettingsPage() {
  const { user, isOrganizer, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Organization state
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);

  const handleOrgSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOrg(true);
    try {
      if (orgName) {
        await organizations.update({ name: orgName, description: orgDesc });
        toast.success("Organization updated successfully");
      }
    } catch (err: unknown) {
      toast.error("Failed to update organization");
    } finally {
      setSavingOrg(false);
    }
  };

  const handleMockUpload = (type: string) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: `Uploading ${type}...`,
      success: `${type} uploaded successfully to CDN!`,
      error: `Failed to upload ${type}`
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#08070d] bg-radial-pulse pb-20">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Manage your preferences, organization, and security.</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col md:flex-row gap-10 items-start">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          {TABS.map((tab) => {
            if (tab.adminOnly && user.role !== "ADMIN") return null;
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                    ? "bg-white/10 text-white shadow-md border border-white/10" 
                    : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-violet-400" : "text-gray-500"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            
            {/* ── Profile Tab ───────────────────────────────────────────────────────── */}
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">Personal Information</h3>
                  
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 p-0.5">
                      <div className="h-full w-full bg-slate-950 rounded-full flex items-center justify-center relative group cursor-pointer" onClick={() => handleMockUpload("Profile Picture")}>
                        <UserCircle className="h-10 w-10 text-gray-500 group-hover:opacity-0 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <UploadCloud className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{user.name}</h4>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6 pt-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                      <input type="text" className="ep-input bg-white/5" defaultValue={user.name} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                      <input type="email" className="ep-input bg-white/5 opacity-50 cursor-not-allowed" defaultValue={user.email} disabled />
                    </div>
                  </div>
                  <div className="pt-2">
                    <button onClick={() => toast.success("Profile saved")} className="ep-btn-primary px-6 py-2.5">Save Changes</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Organization Tab ──────────────────────────────────────────────────── */}
            {activeTab === "organization" && (
              <motion.div
                key="org"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-16 w-16 bg-violet-600/20 rounded-2xl flex items-center justify-center border border-violet-500/30">
                    <Building2 className="h-8 w-8 text-violet-400" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-white">Organizer Settings</h3>
                    <p className="text-sm text-gray-400">Update your vanity URL, brand colors, and public logo.</p>
                  </div>
                  <button onClick={() => window.open(`/@org_slug`, '_blank')} className="ep-btn-secondary px-5 py-2.5 flex items-center gap-2">
                    <Globe className="h-4 w-4" /> View Public Page
                  </button>
                </div>

                <form onSubmit={handleOrgSave} className="glass-card p-8 rounded-3xl border border-white/5 space-y-8">
                  
                  {/* Brand Uploads (Mock) */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Public Logo</label>
                      <div onClick={() => handleMockUpload("Organizer Logo")} className="h-32 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center hover:bg-white/5 hover:border-violet-500/50 transition-colors cursor-pointer group">
                        <ImageIcon className="h-8 w-8 text-gray-600 group-hover:text-violet-400 transition-colors mb-2" />
                        <span className="text-xs text-gray-400 font-bold">Click to upload logo</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Brand Color</label>
                      <div className="flex items-center gap-4 h-32 border border-white/5 rounded-xl p-4 bg-slate-950/40">
                        <div className="h-12 w-12 rounded-full bg-violet-600 border-2 border-white shadow-[0_0_15px_#7c3aed]" />
                        <div>
                          <p className="text-sm font-bold text-white mb-1">Primary Hex</p>
                          <input type="text" className="ep-input text-sm py-1.5 font-mono max-w-[120px]" defaultValue="#7C3AED" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Organization Name</label>
                      <input type="text" className="ep-input" placeholder="e.g. Acme Events" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Vanity URL Slug</label>
                      <div className="flex items-center">
                        <span className="ep-input border-r-0 rounded-r-none bg-white/5 text-gray-500 py-[9px] px-3 font-mono">@</span>
                        <input type="text" className="ep-input rounded-l-none pl-2" placeholder="acme-events" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Public Biography</label>
                    <textarea className="ep-input min-h-[100px]" placeholder="Tell attendees about your organization..." value={orgDesc} onChange={(e) => setOrgDesc(e.target.value)} />
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <button type="submit" disabled={savingOrg} className="ep-btn-primary px-8 py-2.5">
                      {savingOrg ? "Saving..." : "Save Organization Profile"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Security Tab ──────────────────────────────────────────────────────── */}
            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
                    <Lock className="h-5 w-5 text-gray-400" /> Password & Authentication
                  </h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Current Password</label>
                      <input type="password" className="ep-input" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">New Password</label>
                      <input type="password" className="ep-input" placeholder="••••••••" />
                    </div>
                    <button onClick={() => toast.success("Password updated")} className="ep-btn-primary px-6 py-2">Update Password</button>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 space-y-4">
                  <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2">
                    <Trash2 className="h-5 w-5" /> Danger Zone
                  </h3>
                  <p className="text-sm text-gray-400 max-w-lg">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button onClick={() => toast.error("Action restricted")} className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Notifications Tab ─────────────────────────────────────────────────── */}
            {activeTab === "notifications" && (
              <motion.div
                key="notif"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="glass-card p-8 rounded-3xl border border-white/5 space-y-6">
                  <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">Communication Preferences</h3>
                  
                  <div className="space-y-4">
                    {[
                      { title: "Booking Confirmations", desc: "Receive email receipts for purchases.", checked: true },
                      { title: "Event Updates", desc: "Notify me when an organizer updates a live event.", checked: true },
                      { title: "Promotions & Marketing", desc: "Get special offers and promo codes.", checked: false },
                      { title: "SMS Alerts (Upcoming)", desc: "Receive text messages for day-of-event reminders.", checked: false, disabled: true },
                      { title: "WhatsApp Ticket Delivery", desc: "Receive your QR codes directly on WhatsApp.", checked: false, disabled: true }
                    ].map((item, idx) => (
                      <label key={idx} className={`flex items-start gap-4 p-4 border rounded-xl transition-colors ${item.disabled ? 'border-white/5 opacity-50' : 'border-white/10 hover:bg-white/5 cursor-pointer'}`}>
                        <div className="relative flex items-center mt-0.5">
                          <input type="checkbox" className="peer sr-only" defaultChecked={item.checked} disabled={item.disabled} />
                          <div className="w-10 h-6 bg-slate-900 border border-white/10 rounded-full peer-checked:bg-violet-600 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4"></div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{item.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Admin Tab ─────────────────────────────────────────────────────────── */}
            {activeTab === "admin" && user.role === "ADMIN" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 text-center shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                    <p className="text-4xl font-black text-indigo-400">12,400</p>
                    <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mt-2">Total Users</p>
                  </div>
                  <div className="glass-card p-6 rounded-2xl border border-violet-500/30 bg-violet-500/5 text-center shadow-[0_0_30px_rgba(124,58,237,0.1)]">
                    <p className="text-4xl font-black text-violet-400">842</p>
                    <p className="text-xs text-violet-300 font-bold uppercase tracking-widest mt-2">Live Events</p>
                  </div>
                  <div className="glass-card p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <p className="text-4xl font-black text-emerald-400">₹4.2M</p>
                    <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest mt-2">Platform Volume</p>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-3xl border border-white/5">
                  <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-4">Super Admin Actions</h3>
                  <div className="flex gap-4">
                    <button className="ep-btn-secondary px-6 py-3">Manage Users</button>
                    <button className="ep-btn-secondary px-6 py-3">Audit Logs</button>
                    <button className="ep-btn-secondary px-6 py-3">Global Refunds</button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
