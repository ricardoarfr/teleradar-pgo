import Link from "next/link";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Acesso Negado — Teleradar" };

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <ShieldX className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-3xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground max-w-sm">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
