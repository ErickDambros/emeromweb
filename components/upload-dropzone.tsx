"use client"

import { useCallback, useRef, useState } from "react"
import { FileSpreadsheet, Loader2, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDataStore } from "./data-store"

export function UploadDropzone({ compact = false }: { compact?: boolean }) {
  const { addFiles, isLoading } = useDataStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return
      void addFiles(Array.from(fileList))
    },
    [addFiles],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      id="tutorial-upload-zone"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
      }}
      className={cn(
        "group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card text-center transition-colors hover:border-primary/60 hover:bg-accent/40",
        dragging && "border-primary bg-accent/60",
        compact ? "gap-2 p-6" : "gap-3 p-10",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.xlsm,.csv,.tsv,.ods,.pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 text-primary",
          compact ? "size-10" : "size-14",
        )}
      >
        {isLoading ? (
          <Loader2 className={cn("animate-spin", compact ? "size-5" : "size-6")} />
        ) : (
          <UploadCloud className={cn(compact ? "size-5" : "size-6")} />
        )}
      </div>
      <div className="space-y-1">
        <p className={cn("font-medium text-foreground", compact ? "text-sm" : "text-base")}>
          {isLoading ? "Processando arquivos..." : "Arraste seus arquivos ou clique para enviar"}
        </p>
        {!compact && (
          <p className="mx-auto max-w-md text-pretty text-sm text-muted-foreground">
            Unifique planilhas e documentos institucionais. Formatos aceitos: Excel (.xlsx, .xls), CSV, ODS e PDF. O
            processamento acontece no seu navegador — nada é enviado a servidores.
          </p>
        )}
      </div>
      {!compact && (
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <FileSpreadsheet className="size-3.5" />
          <span>xlsx · xls · csv · ods · pdf</span>
        </div>
      )}
    </div>
  )
}
