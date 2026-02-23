import { LPUTable } from "@/components/lpu/lpu-table";

export default function LPUPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Lista de Preços Unitários (LPU)
        </h2>
      </div>
      <LPUTable />
    </div>
  );
}
