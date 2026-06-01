import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OrgType } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { TypeBadge } from "@/components/common/TypeBadge";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingTable } from "@/components/common/LoadingTable";
import { ErrorState } from "@/components/common/ErrorState";
import { Plus, Building2, Users, Mail, ChevronRight } from "lucide-react";

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

function getSubline(org: OrgWithCount): string | null {
  if (org.type === "school" && org.school_district) return org.school_district;
  if (org.type === "nonprofit" && org.ein) return `EIN: ${org.ein}`;
  if (org.type === "business" && org.industry) return org.industry;
  return null;
}

export default function Organizations() {
  useEffect(() => {
    document.title = "Organizations - OrgHub";
  }, []);

  const navigate = useNavigate();

  const {
    data: orgs,
    isLoading,
    error,
    refetch,
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

  const totalMembers =
    orgs?.reduce(
      (sum, org) => sum + (org.organization_members?.[0]?.count ?? 0),
      0
    ) ?? 0;

  const pendingInvites = 0; // Placeholder — would need a separate query

  return (
    <div>
      <PageHeader
        title="Organizations"
        description="Manage the organizations you've created and their members."
        action={
          <Link to="/organizations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New organization
            </Button>
          </Link>
        }
      />

      {/* Stat cards */}
      {!isLoading && !error && orgs && orgs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Building2} label="Organizations" value={orgs.length} />
          <StatCard icon={Users} label="Total members" value={totalMembers} />
          <StatCard icon={Mail} label="Pending invites" value={pendingInvites} />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-6">
            <LoadingTable rows={5} cols={4} />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card>
          <ErrorState
            message={(error as Error).message}
            onRetry={() => refetch()}
          />
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !error && orgs?.length === 0 && (
        <Card>
          <EmptyState
            icon={Building2}
            title="No organizations yet"
            description="Create your first organization to start inviting members."
            action={
              <Link to="/organizations/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New organization
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      {/* Orgs table */}
      {!isLoading && !error && orgs && orgs.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => {
                  const memberCount =
                    org.organization_members?.[0]?.count ?? 0;
                  const subline = getSubline(org);
                  return (
                    <TableRow
                      key={org.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => navigate(`/organizations/${org.id}`)}
                    >
                      <TableCell>
                        <div>
                          <span
                            className="font-medium text-foreground truncate block max-w-[240px]"
                            title={org.name}
                          >
                            {org.name}
                          </span>
                          {subline && (
                            <span className="text-xs text-muted-foreground">
                              {subline}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={org.type} />
                      </TableCell>
                      <TableCell>
                        <span className="tabular-nums">
                          {memberCount} {memberCount === 1 ? "member" : "members"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(org.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
