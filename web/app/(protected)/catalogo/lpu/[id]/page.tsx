"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLPU } from "@/hooks/use-lpu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LPUItemsTable } from "@/components/lpu/lpu-items-table";
import { usePartners } from "@/hooks/use-partners"; // Assuming usePartners exists and works
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function LPUSinglePage() {
  const params = useParams();
  const lpuId = params.id as string;

  const { data: lpu, isLoading: isLoadingLPU } = useLPU(lpuId);
  const { data: partnersData, isLoading: isLoadingPartners } = usePartners({ per_page: 100 });

  const getPartnerName = (id: string) => {
    return partnersData?.results.find((p) => p.id === id)?.name ?? "Carregando...";
  };

  if (isLoadingLPU || isLoadingPartners) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Carregando LPU...
        </h2>
      </div>
    );
  }

  if (!lpu) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          LPU não encontrada.
        </h2>
        <Link href="/catalogo/lpu">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para LPUs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center gap-4">
          <Link href="/catalogo/lpu">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            LPU: {lpu.nome}
          </h2>
        </div>
        <Link href={`/catalogo/lpu/${lpu.id}/edit`}>
            <Button>Editar LPU</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Informações da LPU</h3>
          <div className="grid gap-2">
            <Label htmlFor="lpu-nome">Nome</Label>
            <Input id="lpu-nome" value={lpu.nome} readOnly />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lpu-parceiro">Parceiro</Label>
            <Input id="lpu-parceiro" value={getPartnerName(lpu.parceiro_id)} readOnly />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lpu-vigencia-inicio">Vigência Início</Label>
              <Input
                id="lpu-vigencia-inicio"
                value={lpu.data_inicio ? formatDate(lpu.data_inicio) : "Não definida"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lpu-vigencia-fim">Vigência Fim</Label>
              <Input
                id="lpu-vigencia-fim"
                value={lpu.data_fim ? formatDate(lpu.data_fim) : "Indeterminada"}
                readOnly
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lpu-status">Status</Label>
            <Badge variant={lpu.ativa ? "outline" : "secondary"} className={lpu.ativa ? "text-green-600 bg-green-50 border-green-200 w-fit" : "w-fit"}>
              {lpu.ativa ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lpu-created">Criada em</Label>
            <Input id="lpu-created" value={formatDate(lpu.created_at)} readOnly />
          </div>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4">Itens da LPU</h3>
      <LPUItemsTable lpuId={lpu.id} />
    </div>
  );
}
