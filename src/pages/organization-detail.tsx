import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import type { Organization, OrganizationMember, OrgType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, UserPlus, Users } from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Invite form schema
// ---------------------------------------------------------------------------
const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [inviteFeedback, setInviteFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // ---- Org query ----
  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery<Organization>({
    queryKey: ["organization", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw new Error(error.message);
      return data as Organization;
    },
    enabled: !!id,
  });

  // ---- Members query ----
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
  } = useQuery<OrganizationMember[]>({
    queryKey: ["members", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", id)
        .order("invited_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data as OrganizationMember[];
    },
    enabled: !!id,
  });

  // ---- Invite form ----
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email }: InviteFormValues) => {
      const { data, error } = await supabase.functions.invoke("invite-member", {
        body: { organization_id: id, email },
      });
      if (error) throw new Error(error.message);
      // Edge function may also return an error payload in `data`
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      reset();
      setInviteFeedback({
        type: "success",
        message: "Invitation sent successfully.",
      });
    },
    onError: (err: Error) => {
      setInviteFeedback({ type: "error", message: err.message });
    },
  });

  const onInviteSubmit = (values: InviteFormValues) => {
    setInviteFeedback(null);
    inviteMutation.mutate(values);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Full-page loading / error for the org
  if (orgLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (orgError || !org) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {orgError ? (orgError as Error).message : "Organization not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <BackLink />

      {/* ---- Org details ---- */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle className="text-xl">{org.name}</CardTitle>
            <Badge
              variant="outline"
              className={orgTypeBadgeClass[org.type]}
            >
              {orgTypeLabel[org.type]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {org.type === "school" && org.school_district && (
            <DetailRow label="School District" value={org.school_district} />
          )}
          {org.type === "nonprofit" && org.ein && (
            <DetailRow label="EIN" value={org.ein} />
          )}
          {org.type === "business" && org.industry && (
            <DetailRow label="Industry" value={org.industry} />
          )}
          <DetailRow label="Created" value={formatDate(org.created_at)} />
        </CardContent>
      </Card>

      {/* ---- Members section ---- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Members</h2>
        </div>

        {membersLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {membersError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {(membersError as Error).message}
          </div>
        )}

        {!membersLoading && !membersError && members?.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No members yet.</p>
        )}

        {!membersLoading && !membersError && members && members.length > 0 && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Invited
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{member.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            member.status === "active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
                        >
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {member.role || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(member.invited_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* ---- Invite form ---- */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Invite Member</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onInviteSubmit)}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email" className="sr-only">
                Email address
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <Button
              type="submit"
              disabled={inviteMutation.isPending}
              className="shrink-0"
            >
              {inviteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {inviteMutation.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </form>

          {/* Feedback message */}
          {inviteFeedback && (
            <div
              className={`mt-3 rounded-md border px-4 py-3 text-sm ${
                inviteFeedback.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {inviteFeedback.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function BackLink() {
  return (
    <Link
      to="/organizations"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to organizations
    </Link>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
