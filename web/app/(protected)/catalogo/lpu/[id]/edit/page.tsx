"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function LPUEditPage() {
  const params = useParams();
  const lpuId = params.id as string;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href={`/catalogo/lpu/${lpuId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Editar LPU: {lpuId}
        </h2>
      </div>

      {/* Formulário de edição de LPU aqui */}
      <div className="rounded-md border p-8">
        <p className="text-muted-foreground">Formulário de edição de LPU será implementado aqui.</p>
      </div>
    </div>
  );
}
