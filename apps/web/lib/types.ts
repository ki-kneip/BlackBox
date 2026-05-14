export interface Project {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  project_id: string;
  tags: string[];
  archived: boolean;
  created_at: string;
}

export type Environment = "dev" | "production" | "app";
export type Level = "debug" | "info" | "warn" | "error" | "fatal";

export interface Log {
  id: string;
  project_id: string;
  folder_id: string;
  environment: Environment;
  level: Level;
  message: string;
  tags: string[];
  issuer_id: string;
  signature?: string;
  metadata?: Record<string, unknown>;
  prev_hash: string;
  hash: string;
  seq: number;
  created_at: string;
  _readonly: boolean;
}

export interface Issuer {
  id: string;
  name: string;
  require_signature: boolean;
  public_key?: string;
  allowed_folders: string[];
  allowed_envs: Environment[];
  project_id: string;
  active: boolean;
  created_at: string;
}

export interface Membership {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  env_access?: string[];
  created_at: string;
}
