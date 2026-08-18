"use client"

import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDataStore } from "./data-store"
import { UploadDropzone } from "./upload-dropzone"

export function EmptyState({ title, description }: { title: string; description: string }) {
  const { loadSample } = useDataStore()
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 py-10">
      <div className="text-center">
        <h2 className="text-balance text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-pretty text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="w-full">
        <UploadDropzone />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Só quer explorar?</span>
        <Button variant="outline" size="sm" onClick={loadSample} className="gap-1.5">
          <Sparkles className="size-4" />
          Carregar dados de exemplo
        </Button>
      </div>
    </div>
  )
}
