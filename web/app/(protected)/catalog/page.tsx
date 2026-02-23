"use client";

import { useState } from "react";
import { ClassesTable } from "@/components/catalog/classes-table";
import { UnidadesTable } from "@/components/catalog/unidades-table";
import { ServicosTable } from "@/components/catalog/servicos-table";
import { cn } from "@/lib/utils";

type Tab = "servicos" | "classes" | "unidades";

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<Tab>("servicos");

  const tabs: { id: Tab; label: string }[] = [
    { id: "servicos", label: "Serviços" },
    { id: "classes", label: "Classes" },
    { id: "unidades", label: "Unidades" },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Catálogo Global
        </h2>
      </div>

      <div className="space-y-4">
        {/* Tabs Headers */}
        <div className="border-b">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-2">
          {activeTab === "servicos" && <ServicosTable />}
          {activeTab === "classes" && <ClassesTable />}
          {activeTab === "unidades" && <UnidadesTable />}
        </div>
      </div>
    </div>
  );
}
