import { openDB } from "idb";
import { projectSchema } from "@/lib/validation";
import type { StudioProject } from "@/types/studio";
import { migrateProject } from "./migrations";

const DB = "streamforge-studio", STORE = "projects", ACTIVE = "active";
export class ProjectRepository {
  private db() { return openDB(DB, 1, { upgrade(db) { if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE); } }); }
  async load() { const raw = await (await this.db()).get(STORE, ACTIVE); if (!raw) return null; return projectSchema.parse(migrateProject(raw)) as StudioProject; }
  async save(project: StudioProject) { await (await this.db()).put(STORE, project, ACTIVE); }
  async clear() { await (await this.db()).delete(STORE, ACTIVE); }
}
export const projectRepository = new ProjectRepository();
