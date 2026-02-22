"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/types/user";
import { formatRole } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  role: z.enum(["MASTER", "ADMIN", "MANAGER", "STAFF", "CLIENT"] as const),
});

type FormData = z.infer<typeof schema>;

const ROLES: UserRole[] = ["ADMIN", "MANAGER", "STAFF", "CLIENT"];

export default function NewUserPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "STAFF" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      // Se não for STAFF, altera o role depois (requer aprovação antes, portanto aviso)
      toast({
        title: "Usuário criado!",
        description: "O usuário foi cadastrado e aguarda aprovação.",
      });
      router.push("/admin/users");
    } catch (err: any) {
      setApiError(
        err?.response?.data?.detail ?? "Erro ao criar usuário. Verifique os dados."
      );
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/admin/users" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para usuários
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
          <CardDescription>Crie um novo usuário no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register("name")} placeholder="Nome completo" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register("email")} placeholder="email@exemplo.com" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha provisória</Label>
              <Input id="password" type="password" {...register("password")} placeholder="Mínimo 8 caracteres" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Role inicial</Label>
              <Select value={selectedRole} onValueChange={(v) => setValue("role", v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {formatRole(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O role pode ser alterado após aprovação do usuário.
              </p>
            </div>

            {apiError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
