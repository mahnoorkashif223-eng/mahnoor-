import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Organization, OrganizationMember } from "@/lib/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/common/PageHeader";
import { TypeBadge } from "@/components/common/TypeBadge";
import { StatusPill } from "@/components/common/StatusPill";
import { InfoRow } from "@/components/common/InfoRow";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingTable } from "@/components/common/LoadingTable";
import { ErrorState } from "@/components/common/ErrorState";
import {
  ChevronLeft,
  Loader2,
  Users,
  Mail,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
    refetch: refetchOrg,
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

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers,
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

  useEffect(() => {
    if (org) {
      document.title = `${org.name} - OrgHub`;
    }
  }, [org]);

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
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
      reset();
      setInviteError(null);
      setInviteOpen(false);
      toast.success("Invitation sent", { description: variables.email });
    },
    onError: (err: Error) => {
      if (err.message.toLowerCase().includes("already")) {
        setInviteError("This email has already been invited to this organization.");
      } else {
        setInviteError(err.message);
      }
    },
  });

  const onInviteSubmit = (values: InviteFormValues) => {
    setInviteError(null);
    inviteMutation.mutate(values);
  };

  // Loading state
  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (orgError || !org) {
    return (
      <div className="space-y-4">
        <Link
          to="/organizations"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Organizations
        </Link>
        <Card>
          <ErrorState
            message={
              orgError
                ? (orgError as Error).message
                : "Organization not found."
            }
            onRetry={() => refetchOrg()}
          />
        </Card>
      </div>
    );
  }

  const memberCount = members?.length ?? 0;

  return (
    <div>
      {/* Back link */}
      <div className="mb-2">
        <Link
          to="/organizations"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" /> Organizations
        </Link>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {org.name}
            <TypeBadge type={org.type} />
          </span>
        }
        description={`Created ${formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}`}
        action={
          <Dialog open={inviteOpen} onOpenChange={(open) => {
            setInviteOpen(open);
            if (!open) {
              setInviteError(null);
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="h-4 w-4 mr-2" />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite member</DialogTitle>
                <DialogDescription>
                  They'll receive an invitation to join {org.name}.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onInviteSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                  {inviteError && (
                    <p className="text-sm text-destructive">{inviteError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send invitation"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Members</CardTitle>
                <Badge variant="secondary">{memberCount}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {membersLoading && (
                <div className="p-6">
                  <LoadingTable rows={3} cols={4} />
                </div>
              )}

              {membersError && (
                <ErrorState
                  message={(membersError as Error).message}
                  onRetry={() => refetchMembers()}
                />
              )}

              {!membersLoading &&
                !membersError &&
                members?.length === 0 && (
                  <EmptyState
                    icon={Users}
                    title="No members yet"
                    description="Invite teammates to collaborate in this organization."
                    action={
                      <Button onClick={() => setInviteOpen(true)}>
                        Invite member
                      </Button>
                    }
                  />
                )}

              {!membersLoading &&
                !membersError &&
                members &&
                members.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Invited</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                  {member.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {member.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {member.role || "member"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <StatusPill status={member.status} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDistanceToNow(new Date(member.invited_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Org info card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Type" value={<TypeBadge type={org.type} />} />
              {org.type === "school" && org.school_district && (
                <InfoRow label="School district" value={org.school_district} />
              )}
              {org.type === "nonprofit" && org.ein && (
                <InfoRow label="EIN" value={org.ein} />
              )}
              {org.type === "business" && org.industry && (
                <InfoRow label="Industry" value={org.industry} />
              )}
              <Separator />
              <InfoRow
                label="Created"
                value={format(new Date(org.created_at), "PP")}
              />
              <InfoRow label="Members" value={`${memberCount} total`} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
