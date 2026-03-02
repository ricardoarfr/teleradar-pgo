"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePartners } from "@/hooks/use-partners";
import { useServicos } from "@/hooks/use-catalogo";
import type { Contrato, ContratoCreate, ContratoUpdate } from "@/types/contrato";
import type { ServicoInfo } from "@/types/contrato";
import { X, Plus, FileText, Paperclip, History } from "lucide-react";

// ---------------------------------------------------------------------------
// Brazilian states
// ---------------------------------------------------------------------------
const ESTADOS = [
  { uf: "AC", nome: "Acre" }, { uf: "AL", nome: "Alagoas" }, { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" }, { uf: "BA", nome: "Bahia" }, { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" }, { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" }, { uf: "MA", nome: "Maranhão" }, { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" }, { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" }, { uf: "PB", nome: "Paraíba" }, { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" }, { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" }, { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" }, { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" }, { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" }, { uf: "SE", nome: "Sergipe" }, { uf: "TO", nome: "Tocantins" },
];

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------
const contratoSchema = z.object({
  client_id: z.string().optional(),
  estado: z.string().max(2).optional(),
  cidade: z.string().max(100).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

type ContratoFormData = z.infer<typeof contratoSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ContratoFormCreateProps {
  mode: "create";
  onSubmit: (data: ContratoCreate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

interface ContratoFormEditProps {
  mode: "edit";
  contrato: Contrato;
  onSubmit: (data: ContratoUpdate) => Promise<void>;
  isSubmitting: boolean;
  apiError: string | null;
  onCancel: () => void;
}

type ContratoFormProps = ContratoFormCreateProps | ContratoFormEditProps;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function ContratoForm(props: ContratoFormProps) {
  const isCreate = props.mode === "create";
  const editContrato = !isCreate ? (props as ContratoFormEditProps).contrato : null;

  const [activeTab, setActiveTab] = useState<"dados" | "anexos" | "log">("dados");

  // Services selection
  const [selectedServicos, setSelectedServicos] = useState<ServicoInfo[]>(
    editContrato?.servicos ?? []
  );
  const [servicoSearch, setServicoSearch] = useState("");
  const [servicosError, setServicosError] = useState<string | null>(null);

  // Cities from IBGE
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // Partners
  const { data: partnersData } = usePartners({ per_page: 100 });
  const partners = partnersData?.results ?? [];

  // Catalog services
  const { data: servicosData } = useServicos({ per_page: 100, ativo: true, search: servicoSearch || undefined });
  const catalogServicos = servicosData?.results ?? [];

  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<ContratoFormData>({
      resolver: zodResolver(contratoSchema),
      defaultValues: isCreate
        ? {}
        : {
            client_id: editContrato!.client_id ?? undefined,
            estado: editContrato!.estado ?? undefined,
            cidade: editContrato!.cidade ?? undefined,
            start_date: editContrato!.start_date ?? undefined,
            end_date: editContrato!.end_date ?? undefined,
            notes: editContrato!.notes ?? undefined,
          },
    });

  const estadoValue = watch("estado");
  const clienteValue = watch("client_id");
  const cidadeValue = watch("cidade");

  // Load cities when state changes
  useEffect(() => {
    if (!estadoValue) {
      setCidades([]);
      return;
    }
    setLoadingCidades(true);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoValue}/municipios?orderBy=nome`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => {
        setCidades(data.map((d) => d.nome));
      })
      .catch(() => setCidades([]))
      .finally(() => setLoadingCidades(false));
  }, [estadoValue]);

  const handleAddServico = (servico: ServicoInfo) => {
    if (!selectedServicos.find((s) => s.id === servico.id)) {
      setSelectedServicos((prev) => [...prev, servico]);
      setServicosError(null);
    }
  };

  const handleRemoveServico = (id: string) => {
    setSelectedServicos((prev) => prev.filter((s) => s.id !== id));
  };

  const handleFormSubmit = async (data: ContratoFormData) => {
    if (selectedServicos.length === 0) {
      setServicosError("Selecione pelo menos 1 serviço.");
      setActiveTab("dados");
      return;
    }
    setServicosError(null);

    const payload = {
      client_id: data.client_id || undefined,
      estado: data.estado || undefined,
      cidade: data.cidade || undefined,
      servico_ids: selectedServicos.map((s) => s.id),
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
      notes: data.notes || undefined,
    };

    await props.onSubmit(payload as ContratoCreate & ContratoUpdate);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-0">
      {/* Tab header */}
      <div className="flex border-b mb-6">
        {[
          { key: "dados", label: "Dados do Contrato", icon: FileText },
          { key: "anexos", label: "Anexos", icon: Paperclip },
          { key: "log", label: "Log", icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TAB 1 — Dados do Contrato                                           */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "dados" && (
        <div className="space-y-6">
          {/* Número (read-only in edit mode) */}
          {editContrato?.numero && (
            <div className="space-y-2">
              <Label>Número</Label>
              <Input value={`# ${editContrato.numero}`} disabled className="w-32 font-mono" />
            </div>
          )}

          {/* ---- DADOS DO CONTRATO ---- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Dados do Contrato
            </h3>
            <div className="space-y-4">
              {/* Cliente */}
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select
                  value={clienteValue ?? ""}
                  onValueChange={(v) => setValue("client_id", v || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um parceiro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}{p.cpf_cnpj ? ` — ${p.cpf_cnpj}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado + Cidade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={estadoValue ?? ""}
                    onValueChange={(v) => {
                      setValue("estado", v || undefined);
                      setValue("cidade", undefined);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((e) => (
                        <SelectItem key={e.uf} value={e.uf}>
                          {e.uf} — {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Select
                    value={cidadeValue ?? ""}
                    onValueChange={(v) => setValue("cidade", v || undefined)}
                    disabled={!estadoValue || loadingCidades}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingCidades
                            ? "Carregando..."
                            : !estadoValue
                            ? "Selecione o estado primeiro"
                            : "Selecione a cidade..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {cidades.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* ---- SERVIÇOS CONTRATADOS ---- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Serviços Contratados *
            </h3>

            {/* Selected services chips */}
            <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
              {selectedServicos.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum serviço adicionado ainda.</p>
              ) : (
                selectedServicos.map((s) => (
                  <Badge key={s.id} variant="outline" className="flex items-center gap-1 pr-1">
                    <span className="font-mono text-xs">{s.codigo}</span>
                    <span className="text-xs">— {s.atividade}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveServico(s.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            {servicosError && (
              <p className="text-xs text-destructive mb-2">{servicosError}</p>
            )}

            {/* Search and add */}
            <div className="border rounded-md overflow-hidden">
              <div className="p-2 border-b bg-muted/30">
                <Input
                  placeholder="Buscar serviço por código ou atividade..."
                  value={servicoSearch}
                  onChange={(e) => setServicoSearch(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {catalogServicos.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                    Nenhum serviço encontrado.
                  </p>
                ) : (
                  catalogServicos.map((s) => {
                    const already = !!selectedServicos.find((sel) => sel.id === s.id);
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30 border-b last:border-0 ${
                          already ? "opacity-50" : ""
                        }`}
                      >
                        <span>
                          <span className="font-mono text-muted-foreground">{s.codigo}</span>
                          {" — "}
                          {s.atividade}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={already}
                          onClick={() => handleAddServico({ id: s.id, codigo: s.codigo, atividade: s.atividade })}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ---- VIGÊNCIA ---- */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Vigência
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data Início</Label>
                <Input id="start_date" type="date" {...register("start_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data Fim</Label>
                <Input id="end_date" type="date" {...register("end_date")} />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Observações adicionais sobre o contrato..."
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 2 — Anexos                                                      */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "anexos" && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
          <Paperclip className="h-10 w-10 opacity-30" />
          <p className="text-sm font-medium">Upload de anexos em breve</p>
          <p className="text-xs">Esta funcionalidade será disponibilizada com o disco permanente do Render.</p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* TAB 3 — Log                                                         */}
      {/* ------------------------------------------------------------------ */}
      {activeTab === "log" && (
        <div className="space-y-2">
          {!editContrato || editContrato.logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhum registro de log ainda.
            </p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Data/Hora</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Ação</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {editContrato.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">{log.acao}</Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {log.descricao ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Error + Actions (only on dados tab) */}
      {activeTab === "dados" && (
        <>
          {props.apiError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mt-4">
              {props.apiError}
            </div>
          )}

          <div className="flex gap-2 pt-4 mt-4 border-t">
            <Button type="button" variant="outline" onClick={props.onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={props.isSubmitting}>
              {props.isSubmitting
                ? isCreate ? "Cadastrando..." : "Salvando..."
                : isCreate ? "Cadastrar contrato" : "Salvar alterações"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
