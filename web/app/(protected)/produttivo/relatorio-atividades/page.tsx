"use client";

import { useState } from "react";
import { Download, Search, Loader2, Settings } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScreenGuard } from "@/components/layout/screen-guard";
import { useRelatorioAtividades, buildExcelUrl } from "@/hooks/use-produttivo";
import { api } from "@/lib/api";

function downloadBlob(url: string, filename: string) {
  api.get(url, { responseType: "blob" }).then((res) => {
    const href = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  });
}

export default function RelatorioAtividadesPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 7) + "-01";

  const [inicio, setInicio] = useState(firstOfMonth);
  const [fim, setFim] = useState(today);
  const [params, setParams] = useState<{ data_inicio: string; data_fim: string } | null>(null);

  const { data, isFetching, error } = useRelatorioAtividades(params);

  const handleSearch = () => {
    if (!inicio || !fim) return;
    setParams({ data_inicio: inicio, data_fim: fim });
  };

  const handleDownload = () => {
    if (!params) return;
    const url = buildExcelUrl("atividades", {
      data_inicio: params.data_inicio,
      data_fim: params.data_fim,
    });
    downloadBlob(url, `produttivo_atividades_${params.data_inicio}_${params.data_fim}.xlsx`);
  };

  return (
    <ScreenGuard screenKey="produttivo">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visão Geral de Atividades</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Relatório consolidado de preenchimentos por formulário e usuário.
            </p>
          </div>
          <Link href="/produttivo/configuracoes">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-1" />
              Configurações
            </Button>
          </Link>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="w-40"
                />
              </div>
              <Button onClick={handleSearch} disabled={isFetching || !inicio || !fim}>
                {isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Consultar
              </Button>
              {data && (
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Erro */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
            Erro ao consultar. Verifique se o cookie está configurado e válido.{" "}
            <Link href="/produttivo/configuracoes" className="underline">Configurações</Link>
          </div>
        )}

        {/* Resultados */}
        {data && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{data.total_fills}</div>
                  <div className="text-sm text-muted-foreground">Total de Preenchimentos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{data.por_formulario.length}</div>
                  <div className="text-sm text-muted-foreground">Formulários Ativos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{data.por_usuario.length}</div>
                  <div className="text-sm text-muted-foreground">Usuários Ativos</div>
                </CardContent>
              </Card>
            </div>

            {/* Por Formulário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Formulário</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Formulário</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_formulario.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{row.form_name}</td>
                        <td className="py-2 text-right font-medium">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Por Usuário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Por Usuário</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Usuário</th>
                      <th className="text-right py-2 font-medium">Total</th>
                      {data.forms_names.map((f) => (
                        <th key={f} className="text-right py-2 font-medium whitespace-nowrap px-2">
                          {f}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_usuario.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{row.user_name}</td>
                        <td className="py-2 text-right font-medium">{row.total}</td>
                        {data.forms_names.map((f) => (
                          <td key={f} className="py-2 text-right px-2">
                            {(row[f] as number) || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Cruzamento */}
            {data.cruzamento.rows.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cruzamento Usuário × Formulário</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Usuário</th>
                        {data.cruzamento.forms.map((f) => (
                          <th key={f} className="text-right py-2 font-medium whitespace-nowrap px-2">
                            {f}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.cruzamento.rows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2">{row.user_name}</td>
                          {row.values.map((v, j) => (
                            <td key={j} className="py-2 text-right px-2">
                              {v || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ScreenGuard>
  );
}
