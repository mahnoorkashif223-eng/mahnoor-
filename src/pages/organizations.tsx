import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OrgType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Building2, Users } from "lucide-react";

const orgTypeBadgeClass: Record<OrgType, string> = {
  school: "bg-blue-100 text-blue-800 border-blue-200",
  nonprofit: "bg-green-100 text-green-800 border-green-200",
  business: "bg-purple-100 text-purple-800 border-purple-200",
};

const orgTypeLabel: Record<OrgType, string> = {
  school: "School",
  nonprofit: "Nonprofit",
  business: "Business",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface OrgWithCount {
  id: string;
  name: string;
  type: OrgType;
  created_by: string;
  created_at: string;
  school_district: string | null;
  ein: string | null;
  industry: string | null;
  organization_members: { count: number }[];
}

export default function Organizations() {
  const {
    data: orgs,
    isLoading,
    error,
  } = useQuery<OrgWithCount[]>({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*, organization_members(count)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as OrgWithCount[];
    },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <Link to="/organizations/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Organization
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(error as Error).message}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && orgs?.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No organizations yet.</p>
          <Link to="/organizations/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              Create your first organization
            </Button>
          </Link>
        </div>
      )}

      {/* List */}
      {!isLoading && !error && orgs && orgs.length > 0 && (
        <div className="grid gap-3">
          {orgs.map((org) => {
            const memberCount = org.organization_members?.[0]?.count ?? 0;
            return (
              <Link key={org.id} to={`/organizations/${org.id}`}>
                <Card className="hover:bg-accent/40 transition-colors cursor-pointer">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 px-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium truncate">{org.name}</span>
                      <Badge
                        variant="outline"
                        className={orgTypeBadgeClass[org.type]}
                      >
                        {orgTypeLabel[org.type]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {memberCount}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(org.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
