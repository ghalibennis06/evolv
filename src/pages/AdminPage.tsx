import { useState, useCallback } from "react";
import { AdminLayout, AdminTab } from "@/components/admin/AdminLayout";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminPlanning } from "@/components/admin/AdminPlanning";
import { AdminBoutique } from "@/components/admin/AdminBoutique";
import { AdminBoissons } from "@/components/admin/AdminBoissons";
import { AdminCoachs } from "@/components/admin/AdminCoachs";
import { AdminTarifs } from "@/components/admin/AdminTarifs";
import { AdminContenu } from "@/components/admin/AdminContenu";
import { AdminDisciplines } from "@/components/admin/AdminDisciplines";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminPacks } from "@/components/admin/AdminPacks";
import { AdminWaitlist } from "@/components/admin/AdminWaitlist";
import { AdminContacts } from "@/components/admin/AdminContacts";
import { AdminReminders } from "@/components/admin/AdminReminders";
import { AdminWhatsApp } from "@/components/admin/AdminWhatsApp";
import { ClientProfileProvider } from "@/components/admin/ClientProfileModal";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [key, setKey] = useState(0);
  const refresh = useCallback(() => setKey((k) => k + 1), []);
  return (
    <ClientProfileProvider>
    <AdminLayout activeTab={tab} onTabChange={setTab} onRefresh={refresh}>
      <div key={key}>
        {tab === "dashboard" && <AdminDashboard onTabChange={(t) => setTab(t as AdminTab)} />}
        {tab === "planning" && <AdminPlanning />}
        {tab === "waitlist" && <AdminWaitlist />}
        {tab === "contacts" && <AdminContacts />}
        {tab === "packs" && <AdminPacks />}
        {tab === "boutique" && <AdminBoutique />}
        {tab === "drinks" && <AdminBoissons />}
        {tab === "coaches" && <AdminCoachs />}
        {tab === "tarifs" && <AdminTarifs />}
        {tab === "contenu" && <AdminContenu />}
        {tab === "disciplines" && <AdminDisciplines />}
        {tab === "settings" && <AdminSettings />}
        {tab === "reminders" && <AdminReminders />}
        {tab === "whatsapp" && <AdminWhatsApp />}
      </div>
    </AdminLayout>
    </ClientProfileProvider>
  );
}
