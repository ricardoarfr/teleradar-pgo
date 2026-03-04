"use client";

import { useState } from "react";
import { Download, Search, Loader2, Settings, X } from "lucide-react";
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
  buildExcelUrl,
} from "@/hooks/use-produttivo";
import { api } from "@/lib/api";
import type { ProduttivoUser, ProduttivoForm, ProduttivoWork } from "@/types/produttivo";

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

interface RelUsuarioParams {
  data_inicio: string;
  data_fim: string;
  user_ids?: string;
  form_ids?: string;
  work_ids?: string;
}

export default function RelatorioUsuarioPage() {
  const today = new Date().toISOString().split("T")[0];
  const firstOfMonth = today.slice(0, 7) + "-01";

  const [inicio, setInicio] = useState(firstOfMonth);
  const [fim, setFim] = useState(today);
  const [selectedUsers, setSelectedUsers] = useState<ProduttivoUser[]>([]);
  const [selectedForms, setSelectedForms] = useState<ProduttivoForm[]>([]);
  const [selectedWorks, setSelectedWorks] = useState<ProduttivoWork[]>([]);
  const [params, setParams] = useState<RelUsuarioParams | null>(null);

  const { data: usuarios } = useProduttivoUsuarios();
  const { data: formularios } = useProduttivoFormularios();
  const formIds = selectedForms.map((f) => f.id);
  const { data: works } = useProduttivoWorks(formIds);

  const { data, isFetching, error } = useRelatorioUsuario(params);

  const handleSearch = () => {
    if (!inicio || !fim) return;
    const p: RelUsuarioParams = { data_inicio: inicio, data_fim: fim };
    if (selectedUsers.length > 0) p.user_ids = selectedUsers.map((u) => u.id).join(",");
    if (selectedForms.length > 0) p.form_ids = selectedForms.map((f) => f.id).join(",");
    if (selectedWorks.length > 0) p.work_ids = selectedWorks.map((w) => w.id).join(",");
    setParams(p);
  };

  const handleDownload = () => {
    if (!params) return;
    const dlParams: Record<string, string> = {
      data_inicio: params.data_inicio,
      data_fim: params.data_fim,
    };
    if (params.user_ids) dlParams.user_ids = params.user_ids;
    if (params.form_ids) dlParams.form_ids = params.form_ids;
    if (params.work_ids) dlParams.work_ids = params.work_ids;
    downloadBlob(
      buildExcelUrl("usuario", dlParams),
      `produttivo_usuario_${params.data_inicio}_${params.data_fim}.xlsx`
    );
  };

  const toggleUser = (u: ProduttivoUser) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]
    );
  };

  const toggleForm = (f: ProduttivoForm) => {
    setSelectedForms((prev) => {
      const exists = prev.find((x) => x.id === f.id);
      if (exists) {
        setSelectedWorks([]);
        return prev.filter((x) => x.id !== f.id);
      }
      return [...prev, f];
    });
  };

  const toggleWork = (w: ProduttivoWork) => {
    setSelectedWorks((prev) =>
      prev.find((x) => x.id === w.id) ? prev.filter((x) => x.id !== w.id) : [...prev, w]
    );
  };

  return (
    <ScreenGuard screenKey="produttivo">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Atividades por Usuário</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Relatório detalhado com campos específicos por formulário.
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
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Datas */}
            <div className="flex flex-wrap gap-4">
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
            </div>

            {/* Usuários */}
            {usuarios && usuarios.length > 0 && (
              <div className="space-y-2">
                <Label>Usuários (opcional)</Label>
                <div className="flex flex-wrap gap-2">
                  {usuarios.map((u) => {
                    const sel = !!selectedUsers.find((x) => x.id === u.id);
                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          sel
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        {u.nome}
                      </button>
                    );
                  })}
                </div>
                {selectedUsers.length > 0 && (
                  <button
                    className="text-xs text-muted-foreground underline"
                    onClick={() => setSelectedUsers([])}
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
            )}

            {/* Formulários */}
            {formularios && formularios.length > 0 && (
              <div className="space-y-2">
                <Label>Formulários (opcional)</Label>
                <div className="flex flex-wrap gap-2">
                  {formularios.map((f) => {
                    const sel = !!selectedForms.find((x) => x.id === f.id);
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleForm(f)}
                        className={`text-xs px-2 py-1 rounded border transition-colors ${
                          sel
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        {f.nome}
                      </button>
                    );
                  })}
                </div>
                {selectedForms.length > 0 && (
                  <button
                    className="text-xs text-muted-foreground underline"
                    onClick={() => { setSelectedForms([]); setSelectedWorks([]); }}
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
            )}

            {/* Works (só aparece quando exatamente 1 form selecionado) */}
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
                  <button
                    className="text-xs text-muted-foreground underline"
                    onClick={() => setSelectedWorks([])}
                  >
                    Limpar seleção
                  </button>
                )}
              </div>
            )}

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

        {/* Erro */}
        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
            Erro ao consultar. Verifique se o cookie está configurado e válido.{" "}
            <Link href="/produttivo/configuracoes" className="underline">Configurações</Link>
          </div>
        )}

        {/* Resultados */}
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
