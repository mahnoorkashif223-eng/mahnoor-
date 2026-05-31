import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const schema = z
  .object({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["school", "nonprofit", "business"], {
      message: "Please select an organization type",
    }),
    school_district: z.string().optional(),
    ein: z.string().optional(),
    industry: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "school" && !val.school_district?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "School district is required for schools",
        path: ["school_district"],
      });
    }
    if (val.type === "nonprofit" && !val.ein?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EIN is required for nonprofits",
        path: ["ein"],
      });
    }
    if (val.type === "business" && !val.industry?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Industry is required for businesses",
        path: ["industry"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function CreateOrganization() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: undefined,
      school_district: "",
      ein: "",
      industry: "",
    },
  });

  const selectedType = watch("type");

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from("organizations").insert({
        name: values.name,
        type: values.type,
        created_by: user!.id,
        school_district: values.type === "school" ? (values.school_district ?? null) : null,
        ein: values.type === "nonprofit" ? (values.ein ?? null) : null,
        industry: values.type === "business" ? (values.industry ?? null) : null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      navigate("/organizations");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6 max-w-xl">
      {/* Back link */}
      <Link
        to="/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to organizations
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
          <CardDescription>
            Fill in the details below to add a new organization.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Acme Corp"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <Select id="type" {...register("type")}>
                <option value="">Select a type…</option>
                <option value="school">School</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="business">Business</option>
              </Select>
              {errors.type && (
                <p className="text-xs text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Conditional: School District */}
            {selectedType === "school" && (
              <div className="space-y-1.5">
                <Label htmlFor="school_district">School District</Label>
                <Input
                  id="school_district"
                  placeholder="e.g. Springfield USD"
                  {...register("school_district")}
                />
                {errors.school_district && (
                  <p className="text-xs text-red-600">
                    {errors.school_district.message}
                  </p>
                )}
              </div>
            )}

            {/* Conditional: EIN */}
            {selectedType === "nonprofit" && (
              <div className="space-y-1.5">
                <Label htmlFor="ein">EIN</Label>
                <Input
                  id="ein"
                  placeholder="e.g. 12-3456789"
                  {...register("ein")}
                />
                {errors.ein && (
                  <p className="text-xs text-red-600">{errors.ein.message}</p>
                )}
              </div>
            )}

            {/* Conditional: Industry */}
            {selectedType === "business" && (
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g. Software & Technology"
                  {...register("industry")}
                />
                {errors.industry && (
                  <p className="text-xs text-red-600">
                    {errors.industry.message}
                  </p>
                )}
              </div>
            )}

            {/* Mutation error */}
            {mutation.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {(mutation.error as Error).message}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {mutation.isPending ? "Creating…" : "Create Organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
