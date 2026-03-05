"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Search, Loader2, ChevronDown } from "lucide-react";
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
  useProduttivoLocais,
  buildExcelUrl,
} from "@/hooks/use-produttivo";
import { api } from "@/lib/api";
import type { ProduttivoUser, ProduttivoForm, ProduttivoLocal } from "@/types/produttivo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Period presets
// ---------------------------------------------------------------------------

type Preset = "hoje" | "7d" | "30d" | "60d" | "90d" | "custom";

const PRESETS: { id: Preset; label: string; days: number | null }[] = [
  { id: "hoje",   label: "Hoje",          days: 0    },
  { id: "7d",     label: "7 dias",        days: 6    },
  { id: "30d",    label: "30 dias",       days: 29   },
  { id: "60d",    label: "60 dias",       days: 59   },
  { id: "90d",    label: "90 dias",       days: 89   },
  { id: "custom", label: "Personalizado", days: null },
];

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// MultiSelect component
// ---------------------------------------------------------------------------

function MultiSelect<T extends { id: number }>({
  label,
  items,
  selected,
  getName,
  onToggle,
  onClear,
  placeholder = "Todos",
}: {
  label: string;
  items: T[];
  selected: T[];
  getName: (item: T) => string;
  onToggle: (item: T) => void;
  onClear: () => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? items.filter((i) => getName(i).toLowerCase().includes(search.toLowerCase()))
    : items;

  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <div ref={ref} className="relative">
        {/* Trigger */}
        <div
          onClick={() => setOpen((v) => !v)}
          className="min-h-9 px-3 py-1.5 border rounded-md bg-background cursor-pointer flex items-center gap-1 flex-wrap pr-8"
        >
          {selected.length === 0 ? (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full"
              >
                {getName(item)}
                <button
                  onClick={(e) => { e.stopPropagation(); onToggle(item); }}
                  className="hover:text-destructive leading-none"
                >
                  ×
                </button>
              </span>
            ))
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground absolute right-2 top-2.5" />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
            <div className="p-2 border-b sticky top-0 bg-popover">
              <input
                autoFocus
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm px-2 py-1 border rounded outline-none focus:ring-1 focus:ring-primary bg-background"
              />
            </div>
            {selected.length > 0 && (
              <button
                onClick={() => { onClear(); setOpen(false); setSearch(""); }}
                className="w-full text-left text-xs text-muted-foreground px-3 py-1.5 hover:bg-muted border-b"
              >
                Limpar seleção
              </button>
            )}
            {filtered.map((item) => {
              const sel = !!selected.find((x) => x.id === item.id);
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={sel}
                    onChange={() => onToggle(item)}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  {getName(item)}
                </label>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface RelUsuarioParams {
  data_inicio: string;
  data_fim: string;
  user_ids?: string;
  form_ids?: string;
  resource_place_ids?: string;
}

const FIXED_COLS = [
  "Cliente",
  "Nome da Atividade",
  "Usuário",
  "Qtd",
  "Data Inicial",
  "Data Final",
  "CABO (m)",
  "CORDOALHA (m)",
  "CEO",
  "CTO",
  "DIO",
] as const;

export default function RelatorioUsuarioPage() {
  const todayStr = new Date().toISOString().split("T")[0];

  const [preset, setPreset]             = useState<Preset>("30d");
  const [inicio, setInicio]             = useState(daysAgo(29));
  const [fim, setFim]                   = useState(todayStr);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedUsers,  setSelectedUsers]  = useState<ProduttivoUser[]>([]);
  const [selectedForms,  setSelectedForms]  = useState<ProduttivoForm[]>([]);
  const [selectedLocais, setSelectedLocais] = useState<ProduttivoLocal[]>([]);
  const [params, setParams]             = useState<RelUsuarioParams | null>(null);

  const { data: allUsuarios }  = useProduttivoUsuarios(showInactive);
  const { data: formularios }  = useProduttivoFormularios();
  const { data: locais }       = useProduttivoLocais();

  const { data, isFetching, error } = useRelatorioUsuario(params);

  // Filter users by status unless showInactive is checked
  const usuarios = showInactive
    ? allUsuarios
    : allUsuarios?.filter((u) => u.status !== "inactive");

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
    if (params.resource_place_ids) dlParams.resource_place_ids = params.resource_place_ids;
    downloadBlob(
      buildExcelUrl("usuario", dlParams),
      `produttivo_usuario_${params.data_inicio.replace(/\//g, "-")}_${params.data_fim.replace(/\//g, "-")}.xlsx`
    );
  };

  const toggleUser  = (u: ProduttivoUser) =>
    setSelectedUsers((prev) => prev.find((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]);
  const toggleForm  = (f: ProduttivoForm) =>
    setSelectedForms((prev) => prev.find((x) => x.id === f.id) ? prev.filter((x) => x.id !== f.id) : [...prev, f]);
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
            Relatório agrupado por OS × técnico com totais de produção.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Período */}
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

            {/* Checkbox inativos */}
            <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => {
                  setShowInactive(e.target.checked);
                  setSelectedUsers([]);
                }}
                className="h-4 w-4"
              />
              Mostrar usuários inativos
            </label>

            {/* Usuários */}
            <MultiSelect
              label="Usuários (vazio = todos)"
              items={usuarios ?? []}
              selected={selectedUsers}
              getName={(u) => u.nome}
              onToggle={toggleUser}
              onClear={() => setSelectedUsers([])}
            />

            {/* Formulários */}
            <MultiSelect
              label="Formulários (vazio = todos)"
              items={formularios ?? []}
              selected={selectedForms}
              getName={(f) => f.nome}
              onToggle={toggleForm}
              onClear={() => setSelectedForms([])}
            />

            {/* Local / Cliente */}
            <MultiSelect
              label="Local / Cliente (vazio = todos)"
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

        {/* Resumo dos filtros */}
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
                  {data.total_atividades} atividade(s) · {data.total} preenchimento(s)
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
                    <tr className="border-b bg-muted/30">
                      {FIXED_COLS.map((col) => (
                        <th key={col} className="text-left py-2 px-3 font-medium whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.linhas.map((row, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                        {FIXED_COLS.map((col) => (
                          <td key={col} className="py-2 px-3 whitespace-nowrap">
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
