export interface SessionItemData {
  id: string;
  repoUrl: string;
  owner: string;
  repo: string;
  title: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileData {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

export type SessionTab = "chat" | "overview" | "documents" | "blueprint";
