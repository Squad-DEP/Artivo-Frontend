"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { CertificatesSection } from "@/components/profile/CertificatesSection";
import { BusinessCardEditor } from "@/components/profile/BusinessCardEditor";
import { BRAND } from "@/lib/constants";
import { motion } from "framer-motion";
import {
  CreditCard,
  ExternalLink,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Pencil,
  Check,
  X,
  Loader2,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  Image as ImageIcon,
  FileText,
  Globe,
  MapPin,
  DollarSign,
  Tag,
  Clock,
  Languages,
  Download,
} from "lucide-react";
import Link from "next/link";
import { apiService } from "@/api/api-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/uploads/FileUpload";
import { useDocumentStore } from "@/store/documentStore";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  start_year: number;
  end_year: number | null;
  description: string | null;
}

interface EducationItem {
  id: string;
  title: string;
  institution: string;
  year: number | null;
  file_url?: string | null;
}

interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: number | null;
  file_url?: string | null;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  images: string[];
  category: string | null;
  created_at: string;
}

interface WorkerProfileMe {
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  tagline: string | null;
  skills: string[];
  location: string | null;
  share_slug: string;
  phone: string | null;
  email: string | null;
  average_rating: number;
  hourly_rate: number | null;
  minimum_budget: number | null;
  languages: string[];
  availability: string;
  categories: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
  portfolio: PortfolioItem[];
}

export default function ProfilePage() {
  const { user, getUserType, fetchUser } = useAuthStore();
  const [workerProfile, setWorkerProfile] = useState<WorkerProfileMe | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const userType = getUserType();
  const isWorker = userType === "worker";

  const usernameSlug =
    workerProfile?.share_slug ||
    user?.user_metadata?.worker_profile_id ||
    user?.email?.split("@")[0]?.replace(/[^a-zA-Z0-9-]/g, "-") ||
    "profile";

  const profileUrl = `${BRAND.website}/artisan/${usernameSlug}`;

  const loadProfile = useCallback(async () => {
    if (!isWorker) { setIsLoading(false); return; }
    try {
      const p = await apiService.get<WorkerProfileMe>("/worker/profile/me");
      setWorkerProfile(p);
      setPhotoUrl(p.photo_url);
    } catch {}
    setIsLoading(false);
  }, [isWorker]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  if (isWorker) {
    return <WorkerProfileView
      user={user}
      userName={userName}
      userType={userType}
      workerProfile={workerProfile}
      photoUrl={photoUrl}
      setPhotoUrl={setPhotoUrl}
      usernameSlug={usernameSlug}
      profileUrl={profileUrl}
      isLoading={isLoading}
      onRefresh={loadProfile}
    />;
  }

  return <CustomerProfileView user={user} userName={userName} fetchUser={fetchUser} />;
}

// ─── Customer Profile ────────────────────────────────────────────────────────

function CustomerProfileView({ user, userName, fetchUser }: { user: any; userName: string; fetchUser: () => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(userName);
  const [phone, setPhone] = useState(user?.phone || "");

  useEffect(() => {
    setFullName(user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "");
    setPhone(user?.phone || "");
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await apiService.post("/user", { body: { fullName: fullName.trim(), phone: phone.trim() || null } });
      await fetchUser();
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
    setPhone(user?.phone || "");
    setIsEditing(false);
    setError(null);
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-6 pt-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="z-10 px-6 py-4 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-[var(--orange)] border-4 border-white shrink-0">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 pt-2 sm:pt-0 sm:pb-1">
              <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--orange)] text-white hover:bg-[var(--orange)]/80 transition-colors">
                <Pencil className="w-3 h-3" /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {saveSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Check className="w-3.5 h-3.5 text-green-600" /></div>
          Profile updated successfully
        </motion.div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0"><X className="w-3.5 h-3.5 text-red-600" /></div>
          {error}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center"><UserIcon className="w-4.5 h-4.5 text-[var(--orange)]" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <ProfileField icon={<UserIcon className="w-4 h-4" />} label="Full Name" value={fullName} isEditing={isEditing} onChange={setFullName} placeholder="Enter your full name" />
          <ProfileField icon={<Mail className="w-4 h-4" />} label="Email Address" value={user?.email || ""} isEditing={false} disabled hint="Email cannot be changed" />
          <ProfileField icon={<Phone className="w-4 h-4" />} label="Phone Number" value={phone} isEditing={isEditing} onChange={setPhone} placeholder="e.g. +234 801 234 5678" />
          <ProfileField icon={<Calendar className="w-4 h-4" />} label="Member Since" value={memberSince || "—"} isEditing={false} disabled />
        </div>
        {isEditing && (
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gray-100">
            <button onClick={handleSave} disabled={isSaving || !fullName.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[var(--orange)] hover:bg-[var(--orange-hover)] shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={handleCancel} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-gray-100 p-6 bg-gray-50">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><ShieldCheck className="w-4.5 h-4.5 text-green-600" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Account & Security</h3>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><Mail className="w-3.5 h-3.5 text-green-600" /></div><span className="text-sm text-gray-700">Email Verification</span></div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-xs font-semibold text-green-700"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Verified</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><UserIcon className="w-3.5 h-3.5 text-gray-500" /></div><span className="text-sm text-gray-700">Account Type</span></div>
            <span className="text-sm font-medium text-gray-900 capitalize">Customer</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Profile Field Component ─────────────────────────────────────────────────

function ProfileField({
  icon, label, value, isEditing, onChange, placeholder, disabled, hint,
}: {
  icon: React.ReactNode; label: string; value: string; isEditing: boolean;
  onChange?: (val: string) => void; placeholder?: string; disabled?: boolean; hint?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-all hover:border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">{icon}</div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      {isEditing && !disabled ? (
        <input type="text" value={value} onChange={(e) => onChange?.(e.target.value)} placeholder={placeholder}
          className="w-full text-sm text-gray-900 font-medium bg-white border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/10 transition-all" />
      ) : (
        <p className="text-sm font-medium text-gray-900 pl-0.5">{value || <span className="text-gray-300 italic font-normal">Not set</span>}</p>
      )}
      {hint && <p className="text-[11px] text-gray-400 mt-1.5 pl-0.5">{hint}</p>}
    </div>
  );
}

// ─── Worker Profile View ─────────────────────────────────────────────────────

function WorkerProfileView({
  user, userName, userType, workerProfile, photoUrl, setPhotoUrl, usernameSlug, profileUrl, isLoading, onRefresh,
}: {
  user: any; userName: string; userType: string | undefined; workerProfile: WorkerProfileMe | null;
  photoUrl: string | null; setPhotoUrl: (url: string | null) => void; usernameSlug: string; profileUrl: string;
  isLoading: boolean; onRefresh: () => Promise<void>;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--orange)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">Manage your profile, skills, and portfolio</p>
        </div>
        <Link href={`/artisan/${usernameSlug}`} className="inline-flex items-center gap-2 text-sm text-[var(--orange)] hover:underline">
          <ExternalLink className="w-4 h-4" /> View Public Profile
        </Link>
      </div>

      {/* Profile card with photo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <ProfilePhotoUpload photoUrl={photoUrl} name={userName} onUploaded={setPhotoUrl} />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{workerProfile?.display_name || userName}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {workerProfile?.tagline && <p className="text-sm text-gray-600 mt-1">{workerProfile.tagline}</p>}
            <span className="inline-block mt-1 px-2.5 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">{userType || "User"}</span>
          </div>
        </div>
      </motion.div>

      {/* Basic Info Section */}
      <BasicInfoSection profile={workerProfile} onRefresh={onRefresh} />

      <div className="grid md:grid-cols-2 gap-6">

        {/* Skills & Categories */}
        <SkillsSection profile={workerProfile} onRefresh={onRefresh} />

        {/* Experience */}
        <ExperienceSection items={workerProfile?.experience ?? []} onRefresh={onRefresh} />

        {/* Education */}
        <EducationSection items={workerProfile?.education ?? []} onRefresh={onRefresh} />

        {/* Certifications */}
        <CertificationsProfileSection items={workerProfile?.certifications ?? []} onRefresh={onRefresh} />

        {/* Portfolio */}
        <PortfolioSection items={workerProfile?.portfolio ?? []} onRefresh={onRefresh} />

        {/* Document Uploads (existing) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-[var(--orange)]" />
            <h2 className="text-lg font-semibold text-gray-900">Document Uploads</h2>
          </div>
          <CertificatesSection />
        </motion.div>
      </div>

      {/* Business Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-[var(--orange)]" />
          <h2 className="text-lg font-semibold text-gray-900">Digital Business Card</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Customize and share your digital business card.</p>
        <BusinessCardEditor
          name={workerProfile?.display_name || userName}
          primarySkill={workerProfile?.skills?.[0] || "Skilled Artisan"}
          rating={workerProfile?.average_rating || 0}
          tagline={workerProfile?.tagline}
          phone={workerProfile?.phone || null}
          location={workerProfile?.location}
          profileUrl={profileUrl}
          username={usernameSlug}
        />
      </motion.div>
    </div>
  );
}

// ─── Basic Info Section ──────────────────────────────────────────────────────

function BasicInfoSection({ profile, onRefresh }: { profile: WorkerProfileMe | null; onRefresh: () => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [tagline, setTagline] = useState(profile?.tagline || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate?.toString() || "");
  const [minimumBudget, setMinimumBudget] = useState(profile?.minimum_budget?.toString() || "");
  const [availability, setAvailability] = useState(profile?.availability || "available");
  const [languages, setLanguages] = useState(profile?.languages?.join(", ") || "");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setTagline(profile.tagline || "");
      setLocation(profile.location || "");
      setHourlyRate(profile.hourly_rate?.toString() || "");
      setMinimumBudget(profile.minimum_budget?.toString() || "");
      setAvailability(profile.availability || "available");
      setLanguages(profile.languages?.join(", ") || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.patch("/worker/profile", {
        body: {
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          tagline: tagline.trim() || null,
          location: location.trim() || null,
          hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
          minimum_budget: minimumBudget ? parseFloat(minimumBudget) : null,
          availability,
          languages: languages.split(",").map(l => l.trim()).filter(Boolean),
        },
      });
      await onRefresh();
      setIsEditing(false);
    } catch {}
    setIsSaving(false);
  };

  const handleCancel = () => {
    setDisplayName(profile?.display_name || "");
    setBio(profile?.bio || "");
    setTagline(profile?.tagline || "");
    setLocation(profile?.location || "");
    setHourlyRate(profile?.hourly_rate?.toString() || "");
    setMinimumBudget(profile?.minimum_budget?.toString() || "");
    setAvailability(profile?.availability || "available");
    setLanguages(profile?.languages?.join(", ") || "");
    setIsEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center"><UserIcon className="w-4.5 h-4.5 text-[var(--orange)]" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--orange)] hover:bg-[var(--orange)]/5 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Tagline</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Expert Plumber with 10+ years" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lagos, Nigeria" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Availability</Label>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/10 outline-none">
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Hourly Rate (₦)</Label>
              <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 5000" min="0" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Minimum Budget (₦)</Label>
              <Input type="number" value={minimumBudget} onChange={(e) => setMinimumBudget(e.target.value)} placeholder="e.g. 10000" min="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Languages (comma-separated)</Label>
            <Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="e.g. English, Yoruba, Pidgin" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Bio</Label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell potential clients about yourself, your experience, and what makes you stand out..."
              rows={4} maxLength={2000}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/10 outline-none transition-colors" />
            <p className="text-xs text-gray-400 text-right">{bio.length}/2000</p>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <Button onClick={handleSave} disabled={isSaving || !displayName.trim()} className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}><X className="w-4 h-4 mr-2" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoDisplay icon={<UserIcon className="w-4 h-4" />} label="Display Name" value={profile?.display_name} />
          <InfoDisplay icon={<Tag className="w-4 h-4" />} label="Tagline" value={profile?.tagline} />
          <InfoDisplay icon={<MapPin className="w-4 h-4" />} label="Location" value={profile?.location} />
          <InfoDisplay icon={<Clock className="w-4 h-4" />} label="Availability" value={profile?.availability ? profile.availability.charAt(0).toUpperCase() + profile.availability.slice(1) : null} />
          <InfoDisplay icon={<DollarSign className="w-4 h-4" />} label="Hourly Rate" value={profile?.hourly_rate ? `₦${Number(profile.hourly_rate).toLocaleString()}` : null} />
          <InfoDisplay icon={<DollarSign className="w-4 h-4" />} label="Minimum Budget" value={profile?.minimum_budget ? `₦${Number(profile.minimum_budget).toLocaleString()}` : null} />
          <InfoDisplay icon={<Languages className="w-4 h-4" />} label="Languages" value={profile?.languages?.length ? profile.languages.join(", ") : null} />
          <div className="sm:col-span-2">
            <InfoDisplay icon={<Globe className="w-4 h-4" />} label="Bio" value={profile?.bio} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function InfoDisplay({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">{icon}</div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm font-medium text-gray-900 pl-0.5">{value || <span className="text-gray-300 italic font-normal">Not set</span>}</p>
    </div>
  );
}

// ─── Skills & Categories Section ─────────────────────────────────────────────

function SkillsSection({ profile, onRefresh }: { profile: WorkerProfileMe | null; onRefresh: () => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [skills, setSkills] = useState(profile?.skills?.join(", ") || "");
  const [categories, setCategories] = useState(profile?.categories?.join(", ") || "");

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills?.join(", ") || "");
      setCategories(profile.categories?.join(", ") || "");
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiService.patch("/worker/profile", {
        body: {
          skills: skills.split(",").map(s => s.trim()).filter(Boolean),
          categories: categories.split(",").map(c => c.trim()).filter(Boolean),
        },
      });
      await onRefresh();
      setIsEditing(false);
    } catch {}
    setIsSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center"><Tag className="w-4.5 h-4.5 text-blue-600" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Skills & Categories</h3>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--orange)] hover:bg-[var(--orange)]/5 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Skills (comma-separated)</Label>
            <textarea value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Plumbing, Pipe Fitting, Water Heater Installation"
              rows={2} className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/10 outline-none transition-colors" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Service Categories (comma-separated)</Label>
            <Input value={categories} onChange={(e) => setCategories(e.target.value)} placeholder="e.g. Plumbing, Home Repair" />
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <Button onClick={handleSave} disabled={isSaving} className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Save
            </Button>
            <Button variant="outline" onClick={() => { setSkills(profile?.skills?.join(", ") || ""); setCategories(profile?.categories?.join(", ") || ""); setIsEditing(false); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills</p>
            {profile?.skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[var(--orange)]/5 text-[var(--orange)] rounded-lg text-sm font-medium border border-[var(--orange)]/20">{skill}</span>
                ))}
              </div>
            ) : <p className="text-sm text-gray-300 italic">No skills added</p>}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Categories</p>
            {profile?.categories?.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.categories.map((cat, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">{cat}</span>
                ))}
              </div>
            ) : <p className="text-sm text-gray-300 italic">No categories added</p>}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Experience Section ──────────────────────────────────────────────────────

function ExperienceSection({ items, onRefresh }: { items: ExperienceItem[]; onRefresh: () => Promise<void> }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExperienceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [description, setDescription] = useState("");

  const openAdd = () => { setEditingItem(null); setTitle(""); setCompany(""); setStartYear(""); setEndYear(""); setDescription(""); setDialogOpen(true); };
  const openEdit = (item: ExperienceItem) => { setEditingItem(item); setTitle(item.title); setCompany(item.company); setStartYear(item.start_year.toString()); setEndYear(item.end_year?.toString() || ""); setDescription(item.description || ""); setDialogOpen(true); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body = { title: title.trim(), company: company.trim(), start_year: parseInt(startYear), end_year: endYear ? parseInt(endYear) : null, description: description.trim() || null };
      if (editingItem) {
        await apiService.put(`/worker/profile/experience/${editingItem.id}`, { body });
      } else {
        await apiService.post("/worker/profile/experience", { body });
      }
      await onRefresh();
      setDialogOpen(false);
    } catch {}
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await apiService.delete(`/worker/profile/experience/${id}`); await onRefresh(); } catch {}
    setDeletingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center"><Briefcase className="w-4.5 h-4.5 text-purple-600" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--orange)] hover:bg-[var(--orange)]/5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <Briefcase className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No experience added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 group">
              <div className="w-3 h-3 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">{item.company}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.start_year} — {item.end_year ?? "Present"}</p>
                {item.description && <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{item.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-50">
                  {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[70vw]">
          <DialogHeader><DialogTitle>{editingItem ? "Edit" : "Add"} Experience</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5"><Label>Job Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Senior Plumber" /></div>
            <div className="space-y-1.5"><Label>Company / Employer</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. ABC Plumbing Services" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start Year</Label><Input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} placeholder="2018" min="1950" max="2100" /></div>
              <div className="space-y-1.5"><Label>End Year <span className="text-gray-400 font-normal">(blank = present)</span></Label><Input type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)} placeholder="2023" min="1950" max="2100" /></div>
            </div>
            <div className="space-y-1.5"><Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your responsibilities and achievements..." rows={3}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/10 outline-none transition-colors" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving || !title.trim() || !company.trim() || !startYear} className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editingItem ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── File attachment helpers ─────────────────────────────────────────────────

function isImageUrl(url: string) {
  return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);
}

function FileAttachmentPreview({ url, label = "Attachment" }: { url: string; label?: string }) {
  if (isImageUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2 w-fit">
        <img src={url} alt={label} className="h-14 w-20 rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity" />
      </a>
    );
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-[var(--orange)] hover:underline">
      <FileText className="w-3.5 h-3.5" /> View document
    </a>
  );
}

function FileAttachmentDialogPreview({ url }: { url: string }) {
  if (isImageUrl(url)) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-200">
        <img src={url} alt="Current attachment" className="w-full h-36 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
          <a href={url} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1.5 text-white text-xs font-semibold">
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2.5">
      <FileText className="w-6 h-6 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">Document attached</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--orange)] hover:underline">View / Download</a>
      </div>
    </div>
  );
}

// ─── Education Section ───────────────────────────────────────────────────────

function EducationSection({ items, onRefresh }: { items: EducationItem[]; onRefresh: () => Promise<void> }) {
  const { uploadDocument, isUploading } = useDocumentStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EducationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [institution, setInstitution] = useState("");
  const [year, setYear] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const openAdd = () => { setEditingItem(null); setTitle(""); setInstitution(""); setYear(""); setPendingFile(null); setSaveError(null); setDialogOpen(true); };
  const openEdit = (item: EducationItem) => { setEditingItem(item); setTitle(item.title); setInstitution(item.institution); setYear(item.year?.toString() || ""); setPendingFile(null); setSaveError(null); setDialogOpen(true); };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      let fileUrl: string | null | undefined = editingItem?.file_url;
      if (pendingFile) {
        const result = await uploadDocument({ file: pendingFile, documentType: "education", fileName: pendingFile.name });
        if (result) fileUrl = result.fileUrl;
        else throw new Error("File upload failed — please try again");
      }
      const body: Record<string, unknown> = { title: title.trim(), institution: institution.trim(), year: year ? parseInt(year) : null };
      if (fileUrl !== undefined) body.file_url = fileUrl;
      if (editingItem) {
        await apiService.put(`/worker/profile/education/${editingItem.id}`, { body });
      } else {
        await apiService.post("/worker/profile/education", { body });
      }
      await onRefresh();
      setDialogOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await apiService.delete(`/worker/profile/education/${id}`); await onRefresh(); } catch {}
    setDeletingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><GraduationCap className="w-4.5 h-4.5 text-green-600" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Education</h3>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--orange)] hover:bg-[var(--orange)]/5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <GraduationCap className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No education added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 group">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0"><GraduationCap className="w-4 h-4 text-green-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">{item.institution}</p>
                {item.year && <p className="text-xs text-gray-400 mt-0.5">{item.year}</p>}
                {item.file_url && <FileAttachmentPreview url={item.file_url} label={item.title} />}
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-50">
                  {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[70vw]">
          <DialogHeader><DialogTitle>{editingItem ? "Edit" : "Add"} Education</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5"><Label>Degree / Qualification</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. B.Sc Mechanical Engineering" /></div>
            <div className="space-y-1.5"><Label>Institution</Label><Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. University of Lagos" /></div>
            <div className="space-y-1.5"><Label>Year <span className="text-gray-400 font-normal">(optional)</span></Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2020" min="1950" max="2100" /></div>
            <div className="space-y-1.5">
              <Label>Document <span className="text-gray-400 font-normal">(optional — certificate, transcript, etc.)</span></Label>
              {editingItem?.file_url && !pendingFile && <FileAttachmentDialogPreview url={editingItem.file_url} />}
              <FileUpload
                accept="image/*,application/pdf"
                maxSizeMb={10}
                onFile={(f) => setPendingFile(f)}
                disabled={isUploading || isSaving}
                preview
              />
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isUploading || isSaving}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving || isUploading || !title.trim() || !institution.trim()} className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
                {(isSaving || isUploading) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editingItem ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Certifications Section ──────────────────────────────────────────────────

function CertificationsProfileSection({ items, onRefresh }: { items: CertificationItem[]; onRefresh: () => Promise<void> }) {
  const { uploadDocument, isUploading } = useDocumentStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CertificationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [year, setYear] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const openAdd = () => { setEditingItem(null); setTitle(""); setIssuer(""); setYear(""); setPendingFile(null); setSaveError(null); setDialogOpen(true); };
  const openEdit = (item: CertificationItem) => { setEditingItem(item); setTitle(item.title); setIssuer(item.issuer); setYear(item.year?.toString() || ""); setPendingFile(null); setSaveError(null); setDialogOpen(true); };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      let fileUrl: string | null | undefined = editingItem?.file_url;
      if (pendingFile) {
        const result = await uploadDocument({ file: pendingFile, documentType: "certification", fileName: pendingFile.name });
        if (result) fileUrl = result.fileUrl;
        else throw new Error("File upload failed — please try again");
      }
      const body: Record<string, unknown> = { title: title.trim(), issuer: issuer.trim(), year: year ? parseInt(year) : null };
      if (fileUrl !== undefined) body.file_url = fileUrl;
      if (editingItem) {
        await apiService.put(`/worker/profile/certifications/${editingItem.id}`, { body });
      } else {
        await apiService.post("/worker/profile/certifications", { body });
      }
      await onRefresh();
      setDialogOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await apiService.delete(`/worker/profile/certifications/${id}`); await onRefresh(); } catch {}
    setDeletingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><Award className="w-4.5 h-4.5 text-amber-600" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--orange)] hover:bg-[var(--orange)]/5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <Award className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No certifications added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 group">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><Award className="w-4 h-4 text-amber-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500">{item.issuer}</p>
                {item.year && <p className="text-xs text-gray-400 mt-0.5">{item.year}</p>}
                {item.file_url && <FileAttachmentPreview url={item.file_url} label={item.title} />}
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-50">
                  {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[70vw]">
          <DialogHeader><DialogTitle>{editingItem ? "Edit" : "Add"} Certification</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5"><Label>Certification Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Certified Electrician Level 3" /></div>
            <div className="space-y-1.5"><Label>Issuing Organization</Label><Input value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="e.g. National Board of Technical Education" /></div>
            <div className="space-y-1.5"><Label>Year <span className="text-gray-400 font-normal">(optional)</span></Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2022" min="1950" max="2100" /></div>
            <div className="space-y-1.5">
              <Label>Certificate File <span className="text-gray-400 font-normal">(optional)</span></Label>
              {editingItem?.file_url && !pendingFile && <FileAttachmentDialogPreview url={editingItem.file_url} />}
              <FileUpload
                accept="image/*,application/pdf"
                maxSizeMb={10}
                onFile={(f) => setPendingFile(f)}
                disabled={isUploading || isSaving}
                preview
              />
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isUploading || isSaving}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving || isUploading || !title.trim() || !issuer.trim()} className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
                {(isSaving || isUploading) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editingItem ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ─── Portfolio Section ───────────────────────────────────────────────────────

function PortfolioSection({ items, onRefresh }: { items: PortfolioItem[]; onRefresh: () => Promise<void> }) {
  const { uploadDocument, isUploading } = useDocumentStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [saveError, setSaveError] = useState<string | null>(null);

  const openAdd = () => { setEditingItem(null); setTitle(""); setDescription(""); setCategory(""); setPendingFile(null); setSaveError(null); setDialogOpen(true); };
  const openEdit = (item: PortfolioItem) => { setEditingItem(item); setTitle(item.title); setDescription(item.description || ""); setCategory(item.category || ""); setPendingFile(null); setSaveError(null); setDialogOpen(true); };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      let imageUrl: string | null = editingItem?.image_url ?? null;
      if (pendingFile) {
        const result = await uploadDocument({ file: pendingFile, documentType: "portfolio", fileName: pendingFile.name });
        if (result) imageUrl = result.fileUrl;
        else throw new Error("File upload failed — please try again");
      }
      const body = { title: title.trim(), description: description.trim() || null, image_url: imageUrl, images: [], category: category.trim() || null };
      if (editingItem) {
        await apiService.put(`/worker/profile/portfolio/${editingItem.id}`, { body });
      } else {
        await apiService.post("/worker/profile/portfolio", { body });
      }
      await onRefresh();
      setDialogOpen(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try { await apiService.delete(`/worker/profile/portfolio/${id}`); await onRefresh(); } catch {}
    setDeletingId(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center"><ImageIcon className="w-4.5 h-4.5 text-pink-600" /></div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio</h3>
          <span className="text-xs text-gray-400">{items.length} projects</span>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--orange)] hover:bg-[var(--orange)]/5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center">
          <ImageIcon className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-400">No portfolio items yet. Showcase your best work!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-gray-300" /></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-xs font-medium line-clamp-1">{item.title}</p>
                {item.category && <p className="text-white/70 text-[10px] mt-0.5">{item.category}</p>}
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.image_url && (
                  <a href={item.image_url} target="_blank" rel="noopener noreferrer" download className="p-1.5 rounded-md bg-white/90 text-gray-700 hover:bg-white shadow-sm" title="Download">
                    <Download className="w-3 h-3" />
                  </a>
                )}
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-md bg-white/90 text-gray-700 hover:bg-white shadow-sm"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-1.5 rounded-md bg-white/90 text-red-600 hover:bg-white shadow-sm disabled:opacity-50">
                  {deletingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[70vw]">
          <DialogHeader><DialogTitle>{editingItem ? "Edit" : "Add"} Portfolio Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5"><Label>Project Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Kitchen Renovation – Lekki" /></div>
            <div className="space-y-1.5"><Label>Category <span className="text-gray-400 font-normal">(optional)</span></Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Plumbing, Electrical" /></div>
            <div className="space-y-1.5">
              <Label>Project Photo <span className="text-gray-400 font-normal">(optional)</span></Label>
              {editingItem?.image_url && !pendingFile && <FileAttachmentDialogPreview url={editingItem.image_url} />}
              <FileUpload
                accept="image/jpeg,image/png,image/webp"
                maxSizeMb={15}
                onFile={(f) => setPendingFile(f)}
                disabled={isUploading || isSaving}
                preview
              />
            </div>
            <div className="space-y-1.5"><Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the project, what you did, and the outcome..." rows={3}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-[var(--orange)] focus:ring-2 focus:ring-[var(--orange)]/10 outline-none transition-colors" />
            </div>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isUploading || isSaving}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving || isUploading || !title.trim()} className="bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white">
                {(isSaving || isUploading) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} {editingItem ? "Update" : "Add"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
