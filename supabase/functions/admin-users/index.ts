// Edge function to manage users (admin only)
// Actions: create, delete, set_roles
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY")!;

type Role = "admin" | "solicitante" | "aprovador" | "conferente" | "financeiro";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json(401, { error: "Missing Authorization header" });
  }

  // Verify caller is admin
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json(401, { error: "Unauthorized" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) return json(403, { error: "Admin role required" });

  let body: any;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }

  const action: string = body.action;

  try {
    if (action === "create") {
      const { name, email, roles, avatar } = body as {
        name: string; email: string; roles: Role[]; avatar?: string;
      };
      if (!name || !email || !roles?.length) {
        return json(400, { error: "name, email and roles are required" });
      }
      // Create auth user (trigger will create profile + default solicitante role)
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { name },
      });
      if (createErr) return json(400, { error: createErr.message });
      const newId = created.user!.id;

      // Update profile (name/avatar) - trigger already inserted with defaults
      await admin.from("profiles").update({ name, avatar: avatar ?? null }).eq("id", newId);

      // Replace roles
      await admin.from("user_roles").delete().eq("user_id", newId);
      const rows = roles.map((r) => ({ user_id: newId, role: r }));
      const { error: roleErr } = await admin.from("user_roles").insert(rows);
      if (roleErr) return json(400, { error: roleErr.message });

      // Send password reset so user sets their own password
      await admin.auth.admin.generateLink({ type: "recovery", email });

      return json(200, { id: newId });
    }

    if (action === "delete") {
      const { id } = body as { id: string };
      if (!id) return json(400, { error: "id required" });
      if (id === user.id) return json(400, { error: "Cannot delete yourself" });
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) return json(400, { error: error.message });
      return json(200, { ok: true });
    }

    if (action === "set_roles") {
      const { id, name, avatar, roles } = body as {
        id: string; name?: string; avatar?: string; roles: Role[];
      };
      if (!id || !roles) return json(400, { error: "id and roles required" });
      if (name !== undefined || avatar !== undefined) {
        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (avatar !== undefined) updates.avatar = avatar;
        await admin.from("profiles").update(updates).eq("id", id);
      }
      await admin.from("user_roles").delete().eq("user_id", id);
      if (roles.length) {
        const rows = roles.map((r) => ({ user_id: id, role: r }));
        const { error } = await admin.from("user_roles").insert(rows);
        if (error) return json(400, { error: error.message });
      }
      return json(200, { ok: true });
    }

    return json(400, { error: "Unknown action" });
  } catch (e: any) {
    return json(500, { error: e?.message ?? "Internal error" });
  }
});
