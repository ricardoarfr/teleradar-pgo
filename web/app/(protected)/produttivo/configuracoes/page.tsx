"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScreenGuard } from "@/components/layout/screen-guard";
import { toast } from "@/components/ui/use-toast";
import {
  useProduttivoConfig,
  useSaveCookie,
  useSaveAccountId,
  useValidateCookie,
  streamGerarCookie,
} from "@/hooks/use-produttivo";

export default function ProduttivoConfigPage() {
  const { data: config, isLoading, refetch: refetchConfig } = useProduttivoConfig();
  const saveCookie = useSaveCookie();
  const saveAccountId = useSaveAccountId();
  const validateCookie = useValidateCookie();

  const [cookie, setCookie] = useState("");
  const [accountId, setAccountId] = useState("");
  const [validationResult, setValidationResult] = useState<boolean | null>(null);

  // Auto-generate state
  const [autoEmail, setAutoEmail] = useState("");
  const [autoSenha, setAutoSenha] = useState("");
  const [autoProgress, setAutoProgress] = useState(0);
  const [autoMsg, setAutoMsg] = useState("");
  const [autoRunning, setAutoRunning] = useState(false);

  const handleSaveCookie = async () => {
    if (!cookie.trim()) return;
    try {
      await saveCookie.mutateAsync(cookie.trim());
      setCookie("");
      setValidationResult(null);
      toast({ title: "Cookie salvo!", description: "Sessão do Produttivo atualizada." });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ??
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.message ??
        String(err);
      toast({ title: "Erro ao salvar cookie", description: detail, variant: "destructive" });
    }
  };

  const handleSaveAccountId = async () => {
    if (!accountId.trim()) return;
    try {
      await saveAccountId.mutateAsync(accountId.trim());
      setAccountId("");
      toast({ title: "Account ID salvo!" });
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.detail ??
        (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data
          ?.message ??
        String(err);
      toast({ title: "Erro ao salvar Account ID", description: detail, variant: "destructive" });
    }
  };

  const handleGerarCookie = async () => {
    if (!autoEmail.trim() || !autoSenha.trim()) return;
    setAutoRunning(true);
    setAutoProgress(0);
    setAutoMsg("Iniciando...");
    try {
      for await (const evento of streamGerarCookie(autoEmail.trim(), autoSenha.trim())) {
        setAutoProgress(evento.pct);
        setAutoMsg(evento.msg);
        if (evento.status === "done") {
          toast({ title: "Cookie gerado!", description: "Sessão capturada e salva automaticamente." });
          setAutoSenha("");
          refetchConfig();
          break;
        }
        if (evento.status === "error") {
          toast({ title: "Erro ao gerar cookie", description: evento.msg, variant: "destructive" });
          break;
        }
      }
    } catch (err) {
      toast({ title: "Erro de comunicação", description: String(err), variant: "destructive" });
    } finally {
      setAutoRunning(false);
    }
  };

  const handleValidate = async () => {
    try {
      const result = await validateCookie.mutateAsync();
      setValidationResult(result.valid);
      if (result.valid) {
        toast({ title: "Cookie válido!", description: "Conexão com Produttivo OK." });
      } else {
        toast({ title: "Cookie inválido", description: "Renove o cookie de sessão.", variant: "destructive" });
      }
    } catch {
      setValidationResult(false);
      toast({ title: "Erro ao validar", description: "Não foi possível conectar ao Produttivo.", variant: "destructive" });
    }
  };

  return (
    <ScreenGuard screenKey="produttivo">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações — Produttivo</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure a integração com o Produttivo para acessar os relatórios de campo.
          </p>
        </div>

        {/* Status atual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status da Conexão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm">
                  {config?.has_cookie ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span>
                    {config?.has_cookie
                      ? `Cookie configurado${config.cookie_updated_at ? ` — atualizado em ${new Date(config.cookie_updated_at).toLocaleString("pt-BR")}` : ""}`
                      : "Nenhum cookie configurado"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Account ID: <span className="font-mono font-medium">{config?.account_id ?? "—"}</span>
                </div>
                {validationResult !== null && (
                  <div className={`flex items-center gap-2 text-sm font-medium ${validationResult ? "text-green-600" : "text-red-600"}`}>
                    {validationResult ? (
                      <><CheckCircle className="h-4 w-4" /> Cookie válido — conexão OK</>
                    ) : (
                      <><AlertCircle className="h-4 w-4" /> Cookie inválido — renove a sessão</>
                    )}
                  </div>
                )}
                {config?.has_cookie && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleValidate}
                    disabled={validateCookie.isPending}
                  >
                    {validateCookie.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    Validar Cookie
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Account ID */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account ID</CardTitle>
            <CardDescription>
              ID da conta no Produttivo. Padrão: 20834.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="account-id">Account ID</Label>
              <Input
                id="account-id"
                placeholder={config?.account_id ?? "20834"}
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveAccountId}
              disabled={!accountId.trim() || saveAccountId.isPending}
            >
              {saveAccountId.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              Salvar Account ID
            </Button>
          </CardContent>
        </Card>

        {/* Auto-generate cookie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Gerar Cookie Automaticamente
            </CardTitle>
            <CardDescription>
              Informe as credenciais do Produttivo. O sistema fará o login automaticamente e capturará o cookie de sessão.
              A senha não é armazenada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="auto-email">E-mail</Label>
              <Input
                id="auto-email"
                type="email"
                placeholder={config?.produttivo_email ?? "usuario@empresa.com"}
                value={autoEmail}
                onChange={(e) => setAutoEmail(e.target.value)}
                disabled={autoRunning}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="auto-senha">Senha</Label>
              <Input
                id="auto-senha"
                type="password"
                placeholder="••••••••"
                value={autoSenha}
                onChange={(e) => setAutoSenha(e.target.value)}
                disabled={autoRunning}
              />
            </div>
            {autoRunning && (
              <div className="space-y-1">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${autoProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{autoMsg}</p>
              </div>
            )}
            <Button
              size="sm"
              onClick={handleGerarCookie}
              disabled={!autoEmail.trim() || !autoSenha.trim() || autoRunning}
            >
              {autoRunning ? (
                <><Loader2 className="h-3 w-3 mr-2 animate-spin" />Gerando...</>
              ) : (
                <><Wand2 className="h-3 w-3 mr-2" />Gerar Cookie</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Cookie manual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cookie de Sessão (Manual)</CardTitle>
            <CardDescription>
              Cole aqui o valor do cookie <code className="text-xs bg-muted px-1 py-0.5 rounded">_produttivo_session</code> obtido
              ao fazer login em <strong>app.produttivo.com.br</strong>. Abra o DevTools → Application → Cookies para copiar o valor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cookie">Valor do Cookie</Label>
              <Textarea
                id="cookie"
                placeholder="Cole o valor do _produttivo_session aqui..."
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSaveCookie}
              disabled={!cookie.trim() || saveCookie.isPending}
            >
              {saveCookie.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
              Salvar Cookie
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScreenGuard>
  );
}
