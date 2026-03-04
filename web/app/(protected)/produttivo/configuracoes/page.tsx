"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
} from "@/hooks/use-produttivo";

export default function ProduttivoConfigPage() {
  const { data: config, isLoading } = useProduttivoConfig();
  const saveCookie = useSaveCookie();
  const saveAccountId = useSaveAccountId();
  const validateCookie = useValidateCookie();

  const [cookie, setCookie] = useState("");
  const [accountId, setAccountId] = useState("");
  const [validationResult, setValidationResult] = useState<boolean | null>(null);

  const handleSaveCookie = async () => {
    if (!cookie.trim()) return;
    try {
      await saveCookie.mutateAsync(cookie.trim());
      setCookie("");
      setValidationResult(null);
      toast({ title: "Cookie salvo!", description: "Sessão do Produttivo atualizada." });
    } catch {
      toast({ title: "Erro ao salvar cookie", variant: "destructive" });
    }
  };

  const handleSaveAccountId = async () => {
    if (!accountId.trim()) return;
    try {
      await saveAccountId.mutateAsync(accountId.trim());
      setAccountId("");
      toast({ title: "Account ID salvo!" });
    } catch {
      toast({ title: "Erro ao salvar Account ID", variant: "destructive" });
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

        {/* Cookie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cookie de Sessão</CardTitle>
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
