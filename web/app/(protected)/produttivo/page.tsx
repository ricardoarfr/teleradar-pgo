"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProduttivoConfig } from "@/hooks/use-produttivo";

export default function ProduttivoIndexPage() {
  const router = useRouter();
  const { data: config, isLoading } = useProduttivoConfig();

  useEffect(() => {
    if (isLoading) return;
    if (!config?.has_cookie) {
      router.replace("/produttivo/configuracoes");
    } else {
      router.replace("/produttivo/relatorio-atividades");
    }
  }, [config, isLoading, router]);

  return null;
}
