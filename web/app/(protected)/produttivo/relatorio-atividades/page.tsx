"use client";

import { useState, useMemo } from "react";
import { Download, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScreenGuard } from "@/components/layout/screen-guard";
import { useRelatorioAtividades, buildExcelUrl } from "@/hooks/use-produttivo";
import { api } from "@/lib/api";

function toApiDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

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

type Preset = "hoje" | "7d" | "30d" | "60d" | "90d" | "custom";

const PRESETS: { id: Preset; label: string; days: number | null }[] = [
  { id: "hoje",   label: "Hoje",          days: 0    },
  { id: "7d",     label: "7 dias",        days: 6    },
  { id: "30d",    label: "30 dias",       days: 29   },
  { id: "60d",    label: "60 dias",       days: 59   },
  { id: "90d",    label: "90 dias",       days: 89   },
  { id: "custom", label: "Personalizado", days: null },
];

function ProduttivoNav({ active }: { active: string }) {
  const tabs = [
    { href: "/produttivo/relatorio-atividades", label: "Visão Geral" },
    { href: "/produttivo/relatorio-usuario",    label: "Por Usuário" },
    { href: "/produttivo/configuracoes",        label: "Configurações" },
  ];
  return (
    <div className="flex gap-1 border-b">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t.href
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export default function RelatorioAtividadesPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  const [preset, setPreset] = useState<Preset>("30d");
  const [inicio, setInicio] = useState(daysAgo(29));
  const [fim, setFim] = useState(todayStr);
  const [params, setParams] = useState<{ data_inicio: string; data_fim: string } | null>(null);
  const [busca, setBusca] = useState("");
  const [topN, setTopN] = useState(20);

  const { data, isFetching, error } = useRelatorioAtividades(params);

  const handlePreset = (p: Preset, days: number | null) => {
    setPreset(p);
    if (days !== null) {
      setInicio(daysAgo(days));
      setFim(new Date().toISOString().split("T")[0]);
    }
  };

  const handleSearch = () => {
    if (!inicio || !fim) return;
    setParams({ data_inicio: toApiDate(inicio), data_fim: toApiDate(fim) });
    setBusca("");
  };

  const filtered = useMemo(() => {
    if (!data) return null;
    const q = busca.trim().toLowerCase();
    return {
      ...data,
      por_formulario: data.por_formulario
        .filter((r) => !q || r.form_name.toLowerCase().includes(q))
        .slice(0, topN),
      por_usuario: data.por_usuario
        .filter((r) => !q || r.user_name.toLowerCase().includes(q))
        .slice(0, topN),
    };
  }, [data, busca, topN]);

  const dlParams = params
    ? { data_inicio: params.data_inicio, data_fim: params.data_fim }
    : {};
  const sufixo = params
    ? `${params.data_inicio.replace(/\//g, "-")}_${params.data_fim.replace(/\//g, "-")}`
    : "";

  return (
    <ScreenGuard screenKey="produttivo">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Produttivo</h1>

        <ProduttivoNav active="/produttivo/relatorio-atividades" />

        <div>
          <h2 className="text-lg font-semibold">Visão Geral de Atividades</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Relatório consolidado de preenchimentos por formulário e usuário.
          </p>
        </div>

        <Card>
          <CardContent className="pt-4 space-y-4">
            <div>
              <Label className="mb-2 block text-xs text-muted-foreground uppercase tracking-wide">
                Período
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePreset(p.id, p.days)}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                      preset === p.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-muted"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <Label>Início</Label>
                <Input
                  type="date"
                  value={inicio}
                  onChange={(e) => { setInicio(e.target.value); setPreset("custom"); }}
                  className="w-40"
                />
              </div>
              <div className="space-y-1">
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={fim}
                  onChange={(e) => { setFim(e.target.value); setPreset("custom"); }}
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
            </div>

            {data && (
              <div className="flex flex-wrap gap-4 items-end border-t pt-4">
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <Label>Busca</Label>
                  <Input
                    placeholder="Filtrar por formulário ou usuário..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Top N — {topN}</Label>
                  <input
                    type="range"
                    min={5}
                    max={100}
                    step={5}
                    value={topN}
                    onChange={(e) => setTopN(Number(e.target.value))}
                    className="h-9 w-36 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
            Erro ao consultar. Verifique se o cookie está configurado e válido.{" "}
            <Link href="/produttivo/configuracoes" className="underline">Configurações</Link>
          </div>
        )}

        {filtered && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{data!.total_fills}</div>
                  <div className="text-sm text-muted-foreground">Total de Preenchimentos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{data!.por_formulario.length}</div>
                  <div className="text-sm text-muted-foreground">Formulários</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{data!.por_usuario.length}</div>
                  <div className="text-sm text-muted-foreground">Usuários</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Por Formulário</CardTitle>
                <Button variant="outline" size="sm"
                  onClick={() => downloadBlob(buildExcelUrl("atividades", dlParams), `produttivo_formularios_${sufixo}.xlsx`)}
                >
                  <Download className="h-3 w-3 mr-1" /> Excel
                </Button>
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
                    {filtered.por_formulario.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2">{row.form_name}</td>
                        <td className="py-2 text-right font-medium">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Por Usuário</CardTitle>
                <Button variant="outline" size="sm"
                  onClick={() => downloadBlob(buildExcelUrl("atividades", dlParams), `produttivo_usuarios_${sufixo}.xlsx`)}
                >
                  <Download className="h-3 w-3 mr-1" /> Excel
                </Button>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Usuário</th>
                      <th className="text-right py-2 font-medium">Total</th>
                      {data!.forms_names.map((f) => (
                        <th key={f} className="text-right py-2 font-medium whitespace-nowrap px-2">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.por_usuario.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 whitespace-nowrap">{row.user_name}</td>
                        <td className="py-2 text-right font-medium">{row.total}</td>
                        {data!.forms_names.map((f) => (
                          <td key={f} className="py-2 text-right px-2">{(row[f] as number) || 0}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {data!.cruzamento.rows.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Cruzamento Usuário × Formulário</CardTitle>
                  <Button variant="outline" size="sm"
                    onClick={() => downloadBlob(buildExcelUrl("atividades", dlParams), `produttivo_cruzamento_${sufixo}.xlsx`)}
                  >
                    <Download className="h-3 w-3 mr-1" /> Excel
                  </Button>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Usuário</th>
                        {data!.cruzamento.forms.map((f) => (
                          <th key={f} className="text-right py-2 font-medium whitespace-nowrap px-2">{f}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data!.cruzamento.rows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 whitespace-nowrap">{row.user_name}</td>
                          {row.values.map((v, j) => (
                            <td key={j} className="py-2 text-right px-2">{v || "—"}</td>
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
