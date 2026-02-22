"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  useApproveUser,
  useConfirmApproval,
  useBlockUser,
  useUnblockUser,
  useChangeRole,
} from "@/hooks/use-users";
import type { User, UserRole } from "@/types/user";
import { formatRole } from "@/lib/utils";

const ROLES: UserRole[] = ["MASTER", "ADMIN", "MANAGER", "STAFF", "CLIENT"];

interface UserActionsProps {
  user: User;
  currentUserRole: UserRole;
}

export function UserActions({ user, currentUserRole }: UserActionsProps) {
  const router = useRouter();
  const [approveOpen, setApproveOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [code, setCode] = useState("");
  const [reason, setReason] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const approveMutation = useApproveUser();
  const confirmMutation = useConfirmApproval();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const changeRoleMutation = useChangeRole();

  const handleSendCode = async () => {
    try {
      await approveMutation.mutateAsync(user.id);
      setCodeSent(true);
      toast({ title: "Código enviado!", description: "Verifique o e-mail do administrador." });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err?.response?.data?.detail ?? "Não foi possível enviar o código.",
      });
    }
  };

  const handleConfirmApproval = async () => {
    try {
      await confirmMutation.mutateAsync({ user_id: user.id, code });
      setApproveOpen(false);
      setCode("");
      setCodeSent(false);
      toast({ title: "Usuário aprovado!", description: `${user.name} foi aprovado com sucesso.` });
      router.refresh();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: err?.response?.data?.detail ?? "Verifique o código e tente novamente.",
      });
    }
  };

  const handleBlock = async () => {
    try {
      await blockMutation.mutateAsync({ userId: user.id, data: { reason: reason || undefined } });
      setBlockOpen(false);
      setReason("");
      toast({ title: "Usuário bloqueado.", description: `${user.name} foi bloqueado.` });
      router.refresh();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err?.response?.data?.detail ?? "Não foi possível bloquear o usuário.",
      });
    }
  };

  const handleUnblock = async () => {
    try {
      await unblockMutation.mutateAsync(user.id);
      toast({ title: "Usuário desbloqueado.", description: `${user.name} foi desbloqueado.` });
      router.refresh();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err?.response?.data?.detail ?? "Não foi possível desbloquear.",
      });
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      await changeRoleMutation.mutateAsync({ userId: user.id, data: { role: newRole as UserRole } });
      toast({ title: "Role atualizado.", description: `Role de ${user.name} atualizado para ${formatRole(newRole as UserRole)}.` });
      router.refresh();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err?.response?.data?.detail ?? "Não foi possível alterar o role.",
      });
    }
  };

  const isMasterUser = user.role === "MASTER";
  const canChangeRole = currentUserRole === "MASTER" && !isMasterUser;

  return (
    <div className="flex flex-col gap-3">
      {/* Alterar Role */}
      {canChangeRole && (
        <div className="flex items-center gap-2">
          <Label className="w-24 text-sm">Role:</Label>
          <Select
            value={user.role}
            onValueChange={handleRoleChange}
            disabled={changeRoleMutation.isPending}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.filter((r) => r !== "MASTER").map((r) => (
                <SelectItem key={r} value={r}>
                  {formatRole(r)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Ações de status */}
      <div className="flex gap-2">
        {user.status === "PENDING" && (
          <Button size="sm" onClick={() => setApproveOpen(true)}>
            Aprovar
          </Button>
        )}
        {user.status === "APPROVED" && (
          <Button size="sm" variant="destructive" onClick={() => setBlockOpen(true)}>
            Bloquear
          </Button>
        )}
        {user.status === "BLOCKED" && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleUnblock}
            disabled={unblockMutation.isPending}
          >
            {unblockMutation.isPending ? "Desbloqueando..." : "Desbloquear"}
          </Button>
        )}
      </div>

      {/* Modal de aprovação */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar usuário</DialogTitle>
            <DialogDescription>
              {codeSent
                ? "Digite o código de aprovação enviado ao e-mail do administrador."
                : `Um código de aprovação será enviado ao e-mail do administrador para confirmar a aprovação de ${user.name}.`}
            </DialogDescription>
          </DialogHeader>

          {!codeSent ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendCode} disabled={approveMutation.isPending}>
                {approveMutation.isPending ? "Enviando..." : "Enviar código"}
              </Button>
            </DialogFooter>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="approval-code">Código de aprovação</Label>
                <Input
                  id="approval-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Digite o código"
                  maxLength={10}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setApproveOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmApproval}
                  disabled={!code || confirmMutation.isPending}
                >
                  {confirmMutation.isPending ? "Confirmando..." : "Confirmar aprovação"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de bloqueio */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja bloquear <strong>{user.name}</strong>? O usuário não poderá
              mais acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="block-reason">Motivo (opcional)</Label>
            <Input
              id="block-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Informe o motivo do bloqueio"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blockMutation.isPending}
            >
              {blockMutation.isPending ? "Bloqueando..." : "Bloquear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
