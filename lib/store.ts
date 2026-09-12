import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import type { AuditEvent, SessionUser, StoredUser, Workspace } from "./types";
import { emptyWorkspace, applyTruckDemo } from "./seed";
import { nowIso } from "./format";

const ROOT = join(process.cwd(), "data");
const USERS = join(ROOT, "users.json");
const WORKSPACES = join(ROOT, "workspaces");

function ensureDirs() {
  mkdirSync(WORKSPACES, { recursive: true });
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(path: string, value: unknown) {
  ensureDirs();
  writeFileSync(path, JSON.stringify(value, null, 2), "utf8");
}

export function listUsers(): StoredUser[] {
  ensureDirs();
  return readJson<{ users: StoredUser[] }>(USERS, { users: [] }).users;
}

export function saveUsers(users: StoredUser[]) {
  writeJson(USERS, { users });
}

export function findUserByEmail(email: string) {
  return listUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function workspacePath(userId: string) {
  return join(WORKSPACES, `${userId}.json`);
}

export function loadWorkspace(user: SessionUser): Workspace {
  ensureDirs();
  const path = workspacePath(user.userId);
  let workspace: Workspace;
  if (!existsSync(path)) {
    workspace = emptyWorkspace(user.name);
  } else {
    workspace = readJson<Workspace>(path, emptyWorkspace(user.name));
  }
  applyTruckDemo(workspace);
  writeJson(path, workspace);
  return workspace;
}

export function saveWorkspace(user: SessionUser, workspace: Workspace) {
  writeJson(workspacePath(user.userId), workspace);
}

export function mutateWorkspace(
  user: SessionUser,
  mutator: (workspace: Workspace) => void,
  audit?: Omit<AuditEvent, "id" | "at" | "user" | "role">
) {
  const workspace = loadWorkspace(user);
  mutator(workspace);
  if (audit) {
    workspace.audit.unshift({
      id: `EVT-${Date.now()}`,
      at: nowIso(),
      user: user.name,
      role: user.role,
      ...audit,
    });
  }
  saveWorkspace(user, workspace);
  return workspace;
}

export function collectionKey(productId: string, version: string, name: string) {
  return `${productId}::${version}::${name}`;
}

export function getCollection<T>(workspace: Workspace, productId: string, version: string, name: string): T[] {
  const exact = workspace.collections[collectionKey(productId, version, name)];
  if (Array.isArray(exact)) return exact as T[];
  const fallback = Object.keys(workspace.collections).find(
    (k) => k.startsWith(`${productId}::`) && k.endsWith(`::${name}`)
  );
  if (fallback && Array.isArray(workspace.collections[fallback])) return workspace.collections[fallback] as T[];
  return [];
}

export function setCollection(
  workspace: Workspace,
  productId: string,
  version: string,
  name: string,
  items: unknown[]
) {
  workspace.collections[collectionKey(productId, version, name)] = items;
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
