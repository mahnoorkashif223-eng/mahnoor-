import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { OrgType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, Loader2, GraduationCap, HeartHandshake, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const typeOptions: {
  value: OrgType;
  label: string;
  icon: typeof GraduationCap;
  description: string;
}[] = [
  {
    value: "school",
    label: "School",
    icon: GraduationCap,
    description: "Educational institution",
  },
  {
    value: "nonprofit",
    label: "Nonprofit",
    icon: HeartHandshake,
    description: "Tax-exempt organization",
  },
  {
    value: "business",
    label: "Business",
    icon: Briefcase,
    description: "For-profit company",
  },
];

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = "New organization - OrgHub";
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    control,
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
        school_district:
          values.type === "school" ? (values.school_district ?? null) : null,
        ein: values.type === "nonprofit" ? (values.ein ?? null) : null,
        industry:
          values.type === "business" ? (values.industry ?? null) : null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization created");
      navigate("/organizations");
    },
    onError: (err: Error) => {
      toast.error("Failed to create organization", {
        description: err.message,
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <Link
          to="/organizations"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground gap-1 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Organizations
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New organization</CardTitle>
          <CardDescription>
            Set up an organization and invite members later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Organization name
              </Label>
              <Input
                id="name"
                placeholder="e.g. Acme Corp"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Type picker — 3 selectable cards */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Organization type</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-3 gap-2">
                    {typeOptions.map((opt) => {
                      const isSelected = field.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all",
                            isSelected
                              ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                              : "border-border hover:border-muted-foreground/30"
                          )}
                        >
                          <opt.icon
                            className={cn(
                              "h-5 w-5",
                              isSelected
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isSelected
                                ? "text-primary"
                                : "text-foreground"
                            )}
                          >
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Conditional fields */}
            {selectedType === "school" && (
              <div className="space-y-2 transition-all duration-200">
                <Label htmlFor="school_district" className="text-sm font-medium">
                  School district
                </Label>
                <Input
                  id="school_district"
                  placeholder="e.g. Springfield USD"
                  {...register("school_district")}
                />
                {errors.school_district && (
                  <p className="text-sm text-destructive">
                    {errors.school_district.message}
                  </p>
                )}
              </div>
            )}

            {selectedType === "nonprofit" && (
              <div className="space-y-2 transition-all duration-200">
                <Label htmlFor="ein" className="text-sm font-medium">
                  EIN (Employer Identification Number)
                </Label>
                <Input
                  id="ein"
                  placeholder="e.g. 12-3456789"
                  {...register("ein")}
                />
                {errors.ein && (
                  <p className="text-sm text-destructive">
                    {errors.ein.message}
                  </p>
                )}
              </div>
            )}

            {selectedType === "business" && (
              <div className="space-y-2 transition-all duration-200">
                <Label htmlFor="industry" className="text-sm font-medium">
                  Industry
                </Label>
                <Input
                  id="industry"
                  placeholder="e.g. Software & Technology"
                  {...register("industry")}
                />
                {errors.industry && (
                  <p className="text-sm text-destructive">
                    {errors.industry.message}
                  </p>
                )}
              </div>
            )}

            {mutation.isError && (
              <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-3 py-2 text-sm">
                {(mutation.error as Error).message}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Link to="/organizations">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full sm:w-auto"
              >
                {mutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {mutation.isPending ? "Creating..." : "Create organization"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
