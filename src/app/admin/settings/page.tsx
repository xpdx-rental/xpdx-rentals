import { createAdminClient } from "@/lib/supabase/admin";
import { SettingsForms } from "./settings-forms";

import { requireAdminRole } from "@/lib/security/auth";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

type V = Record<string, unknown>;

export default async function AdminSettingsPage() {
  await requireAdminRole(["owner", "admin"]);
  const supabase = createAdminClient();
  const { data } = await supabase.from("settings").select("key, value");
  const byKey = Object.fromEntries(
    (data ?? []).map((r: { key: string; value: V }) => [r.key, r.value]),
  ) as Record<string, V>;

  const recipients = ((byKey.notification_recipients?.emails as string[]) ?? []).filter(Boolean);
  const openingHours = (byKey.opening_hours ?? {}) as Record<string, string>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">
          These values drive the public site — contact details, opening hours, the call and
          WhatsApp buttons, and where lead alerts are sent. Changing them takes effect without a
          deploy.
        </p>
      </header>
      <SettingsForms
        company={byKey.company_profile ?? {}}
        phones={byKey.phone_numbers ?? {}}
        recipients={recipients}
        openingHours={openingHours}
      />
    </div>
  );
}
