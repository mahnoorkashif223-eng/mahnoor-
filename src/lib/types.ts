export type OrgType = "school" | "nonprofit" | "business";
export type MemberStatus = "invited" | "active";

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  created_by: string;
  created_at: string;
  school_district: string | null;
  ein: string | null;
  industry: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  status: MemberStatus;
  role: string;
  invited_at: string;
  joined_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  is_admin: boolean;
}
