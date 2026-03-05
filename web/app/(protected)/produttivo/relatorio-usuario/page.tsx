"use client";

import { useState } from "react";
import { Download, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScreenGuard } from "@/components/layout/screen-guard";
import {
  useRelatorioUsuario,
  useProduttivoUsuarios,
  useProduttivoFormularios,
  useProduttivoWorks,
  useProduttivoLocais,
  buildExcelUrl,
} from "@/hooks/use-produttivo";
import { api } from "@/lib/api";
import type { ProduttivoUser, ProduttivoForm, ProduttivoWork, ProduttivoLocal } from "@/types/produttivo";

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

interface RelUsuarioParams {
  data_inicio: string;
  data_fim: string;
  user_ids?: string;
  form_ids?: string;
  work_ids?: string;
  resource_place_ids?: string;
}

function ChipGroup<T extends { id: number }>({
  label,
  items,
  selected,
  getName,
  onToggle,
  onClear,
}: {
  label: string;
  items: T[];
  selected: T[];
  getName: (item: T) => string;
  onToggle: (item: T) => void;
  onClear: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const sel = !!selected.find((x) => x.id === item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                sel
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              {getName(item)}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <button className="text-xs text-muted-foreground underline" onClick={onClear}>
          Limpar seleção
        </button>
      )}
    </div>
  );
}

export default function RelatorioUsuarioPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  const [preset, setPreset] = useState<Preset>("30d");
  const [inicio, setInicio] = useState(daysAgo(29));
  const [fim, setFim] = useState(todayStr);
  const [selectedUsers,  setSelectedUsers]  = useState<ProduttivoUser[]>([]);
  const [selectedForms,  setSelectedForms]  = useState<ProduttivoForm[]>([]);
  const [selectedWorks,  setSelectedWorks]  = useState<ProduttivoWork[]>([]);
  const [selectedLocais, setSelectedLocais] = useState<ProduttivoLocal[]>([]);
  const [params, setParams] = useState<RelUsuarioParams | null>(null);

  const { data: usuarios }    = useProduttivoUsuarios();
  const { data: formularios } = useProduttivoFormularios();
  const { data: locais }      = useProduttivoLocais();
  const formIds = selectedForms.map((f) => f.id);
  const { data: works } = useProduttivoWorks(formIds);

  const { data, isFetching, error } = useRelatorioUsuario(params);

  const handlePreset = (p: Preset, days: number | null) => {
    setPreset(p);
    if (days !== null) {
      setInicio(daysAgo(days));
      setFim(new Date().toISOString().split("T")[0]);
    }
  };

  const handleSearch = () => {
    if (!inicio || !fim) return;
    const p: RelUsuarioParams = {
      data_inicio: toApiDate(inicio),
      data_fim:    toApiDate(fim),
    };
    if (selectedUsers.length  > 0) p.user_ids           = selectedUsers.map((u) => u.id).join(",");
    if (selectedForms.length  > 0) p.form_ids           = selectedForms.map((f) => f.id).join(",");
    if (selectedWorks.length  > 0) p.work_ids           = selectedWorks.map((w) => w.id).join(",");
    if (selectedLocais.length > 0) p.resource_place_ids = selectedLocais.map((l) => l.id).join(",");
    setParams(p);
  };

  const handleDownload = () => {
    if (!params) return;
    const dlParams: Record<string, string> = {
      data_inicio: params.data_inicio,
      data_fim:    params.data_fim,
    };
    if (params.user_ids)           dlParams.user_ids           = params.user_ids;
    if (params.form_ids)           dlParams.form_ids           = params.form_ids;
    if (params.work_ids)           dlParams.work_ids           = params.work_ids;
    if (params.resource_place_ids) dlParams.resource_place_ids = params.resource_place_ids;
    downloadBlob(
      buildExcelUrl("usuario", dlParams),
      `produttivo_usuario_${params.data_inicio.replace(/\//g, "-")}_${params.data_fim.replace(/\//g, "-")}.xlsx`
    );
  };

  const toggleUser  = (u: ProduttivoUser)  =>
    setSelectedUsers((prev)  => prev.find((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]);
  const toggleForm  = (f: ProduttivoForm)  =>
    setSelectedForms((prev)  => {
      const exists = prev.find((x) => x.id === f.id);
      if (exists) { setSelectedWorks([]); return prev.filter((x) => x.id !== f.id); }
      return [...prev, f];
    });
  const toggleWork  = (w: ProduttivoWork)  =>
    setSelectedWorks((prev)  => prev.find((x) => x.id === w.id) ? prev.filter((x) => x.id !== w.id) : [...prev, w]);
  const toggleLocal = (l: ProduttivoLocal) =>
    setSelectedLocais((prev) => prev.find((x) => x.id === l.id) ? prev.filter((x) => x.id !== l.id) : [...prev, l]);

  return (
    <ScreenGuard screenKey="produttivo">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Produttivo</h1>

        <ProduttivoNav active="/produttivo/relatorio-usuario" />

        <div>
          <h2 className="text-lg font-semibold">Atividades por Usuário</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Relatório detalhado com campos específicos por formulário.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Atalhos de período */}
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

            {/* Date pickers */}
            <div className="flex flex-wrap gap-4">
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
            </div>

            {/* Usuários */}
            <ChipGroup
              label="Usuários (opcional — vazio = todos)"
              items={usuarios ?? []}
              selected={selectedUsers}
              getName={(u) => u.nome}
              onToggle={toggleUser}
              onClear={() => setSelectedUsers([])}
            />

            {/* Formulários */}
            <ChipGroup
              label="Formulários (opcional — vazio = todos)"
              items={formularios ?? []}
              selected={selectedForms}
              getName={(f) => f.nome}
              onToggle={toggleForm}
              onClear={() => { setSelectedForms([]); setSelectedWorks([]); }}
            />

            {/* Works (só quando exatamente 1 formulário selecionado) */}
            {formIds.length === 1 && works && works.length > 0 && (
              <div className="space-y-2">
                <Label>OS / Work (opcional)</Label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {works.map((w) => {
                    const sel = !!selectedWorks.find((x) => x.id === w.id);
                    return (
                      <button
                        key={w.id}
                        onClick={() => toggleWork(w)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          sel
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        {w.numero ? `#${w.numero} — ` : ""}{w.titulo}
                      </button>
                    );
                  })}
                </div>
                {selectedWorks.length > 0 && (
                  <button className="text-xs text-muted-foreground underline" onClick={() => setSelectedWorks([])}>
                    Limpar seleção
                  </button>
                )}
              </div>
            )}

            {/* Locais / Clientes */}
            <ChipGroup
              label="Clientes / Locais (opcional — vazio = todos)"
              items={locais ?? []}
              selected={selectedLocais}
              getName={(l) => l.nome}
              onToggle={toggleLocal}
              onClear={() => setSelectedLocais([])}
            />

            <div className="flex gap-2 pt-2">
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

        {/* Painel de resumo dos filtros aplicados */}
        {params && (
          <div className="rounded-md border bg-muted/40 p-4 text-sm space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">
              Consulta em andamento
            </p>
            <p><span className="font-medium">Período:</span> {params.data_inicio} a {params.data_fim}</p>
            {params.user_ids && (
              <p><span className="font-medium">Usuários:</span> {selectedUsers.map((u) => u.nome).join(", ")}</p>
            )}
            {params.form_ids && (
              <p><span className="font-medium">Formulários:</span> {selectedForms.map((f) => f.nome).join(", ")}</p>
            )}
            {params.work_ids && (
              <p><span className="font-medium">Works:</span> {selectedWorks.map((w) => w.titulo).join(", ")}</p>
            )}
            {params.resource_place_ids && (
              <p><span className="font-medium">Clientes:</span> {selectedLocais.map((l) => l.nome).join(", ")}</p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
            Erro ao consultar. Verifique se o cookie está configurado e válido.{" "}
            <Link href="/produttivo/configuracoes" className="underline">Configurações</Link>
          </div>
        )}

        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Resultados</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {data.total} registro(s)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {data.linhas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum registro encontrado para o período.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {data.colunas.map((col) => (
                        <th key={col} className="text-left py-2 font-medium whitespace-nowrap pr-4">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.linhas.map((row, i) => (
                      <tr key={i} className="border-b last:border-0">
                        {data.colunas.map((col) => (
                          <td key={col} className="py-2 pr-4 whitespace-nowrap">
                            {row[col] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </ScreenGuard>
  );
}
