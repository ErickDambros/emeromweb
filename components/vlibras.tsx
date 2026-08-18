"use client"

import { useEffect } from "react"

export function VLibrasWidget() {
  useEffect(() => {
    const scriptSrc = "https://vlibras.gov.br/app/vlibras-plugin.js"
    const widgetSrc = "https://vlibras.gov.br/app"

    let script = document.getElementById("vlibras-plugin-script") as HTMLScriptElement | null

    const initWidget = () => {
      // @ts-expect-error - VLibras global
      if (typeof window !== "undefined" && window.VLibras) {
        try {
          // @ts-expect-error - VLibras global
          new window.VLibras.Widget(widgetSrc)
          // Dispara o evento 'load' no window para disparar o listener interno do vlibras-plugin.js no Next.js
          window.dispatchEvent(new Event("load"))
        } catch (e) {
          console.error("VLibras init error:", e)
        }
      }
    }

    if (!script) {
      script = document.createElement("script")
      script.id = "vlibras-plugin-script"
      script.src = scriptSrc
      script.async = true
      script.addEventListener("load", () => {
        initWidget()
      })
      document.body.appendChild(script)
    } else {
      initWidget()
    }
  }, [])

  return (
    <div {...{ vw: "true" }} className="enabled">
      <div {...{ "vw-access-button": "true" }} className="active" />
      <div {...{ "vw-plugin-wrapper": "true" }}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  )
}
