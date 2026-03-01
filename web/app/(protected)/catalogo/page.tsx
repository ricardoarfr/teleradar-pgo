"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Box, Wrench } from "lucide-react";
import { ScreenGuard } from "@/components/layout/screen-guard";

export default function CatalogoHomePage() {
  return (
    <ScreenGuard screenKey="catalogo">
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Módulo Catálogo
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/catalogo/lpu">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Lista de Preços Unitários (LPU)
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Gerenciar LPUs</div>
              <p className="text-xs text-muted-foreground">
                Cadastro e gestão de listas de preço por parceiro.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/catalogo/servicos">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Atividades
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Gerenciar Atividades</div>
              <p className="text-xs text-muted-foreground">
                Cadastro e gestão do catálogo de atividades e serviços.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/catalogo/materiais">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Catálogo de Materiais
              </CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Gerenciar Materiais</div>
              <p className="text-xs text-muted-foreground">
                Cadastro e gestão de materiais e seus detalhes.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
    </ScreenGuard>
  );
}
