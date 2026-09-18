"use server";

import { redirect } from "next/navigation";
import { getSession, patchSession } from "@/lib/session";

export async function switchRoleAction(formData: FormData) {
  const session = await getSession();
  const role = String(formData.get("role") || session.role);
  await patchSession({ role });
  redirect("/catalogue");
}
