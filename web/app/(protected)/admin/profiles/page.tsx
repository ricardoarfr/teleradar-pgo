import { ProfilesMatrix } from "@/components/profiles/profiles-matrix";
import { ScreenGuard } from "@/components/layout/screen-guard";

export const metadata = { title: "Perfis de Acesso — Teleradar" };

export default function ProfilesPage() {
  return (
    <ScreenGuard screenKey="admin.profiles">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Perfis de Acesso</h1>
          <p className="text-muted-foreground">
            Configure quais telas e ações cada perfil de usuário pode acessar.
          </p>
        </div>
        <ProfilesMatrix />
      </div>
    </ScreenGuard>
  );
}
