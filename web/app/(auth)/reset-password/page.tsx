"use client";

import { Suspense } from "react";
import ResetPasswordContent from "./reset-password-content";

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
