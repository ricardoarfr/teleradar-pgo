"use client";

export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Eye, EyeOff, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { resetPasswordAction } from "@/actions/auth-actions";

const schema = z
  .object({
    new_password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "As senhas não coincidem",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setApiError("Link inválido. Solicite um novo link de recuperação.");
      return;
    }
    setApiError(null);
    const result = await resetPasswordAction(token, data.new_password);
    if (result.success) {
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } else {
      setApiError(result.error);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <div className="flex items-center gap-2">
            <Radio className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold tracking-tight">Teleradar</span>
          </div>
        </div>
        <CardTitle className="text-xl">Nova senha</CardTitle>
        <CardDescription>
          {done ? "Senha redefinida com sucesso." : "Defina sua nova senha de acesso."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Você será redirecionado para o login em instantes...
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Ir para o login
              </Button>
            </Link>
          </div>
        ) : !token ? (
          <div className="space-y-4">
            <p className="text-sm text-destructive text-center">
              Link inválido ou expirado. Solicite um novo link de recuperação.
            </p>
            <Link href="/forgot-password">
              <Button variant="outline" className="w-full">
                Solicitar novo link
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  {...register("new_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-xs text-destructive">{errors.new_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar nova senha</Label>
              <Input
                id="confirm_password"
                type={showPassword ? "text" : "password"}
                placeholder="Repita a senha"
                autoComplete="new-password"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="text-xs text-destructive">{errors.confirm_password.message}</p>
              )}
            </div>

            {apiError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
