import { AppShell } from "@/components/app-shell"
import { DataStoreProvider } from "@/components/data-store"

export default function Page() {
  return (
    <DataStoreProvider>
      <AppShell />
    </DataStoreProvider>
  )
}
