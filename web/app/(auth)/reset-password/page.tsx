import { Suspense } from "react";
import ResetPasswordContent from "./reset-password-content";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
