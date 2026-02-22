"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { ArrowLeft, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { forgotPasswordAction } from "@/actions/auth-actions";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    const result = await forgotPasswordAction(data.email);
    if (result.success) {
      setSent(true);
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
        <CardTitle className="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          {sent
            ? "Verifique seu e-mail."
            : "Informe seu e-mail para receber as instruções de recuperação."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha em breve.
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Voltar para o login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {apiError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {apiError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar instruções"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="flex items-center justify-center gap-1 text-primary hover:underline font-medium">
                <ArrowLeft className="h-3 w-3" />
                Voltar para o login
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
