import fs from "fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const staticAssets = [
  "icon.png",
  "nuers_wBG.jpg",
  "NUERSLOGO.png",
  "NUERSLOGOWHITE.png",
  "NUERS copy.png",
  "NUERS.png",
  "NUERS_WHITE.png",
  "robots.txt",
  "vite.svg",
]

function copyStaticAssets() {
  return {
    name: "copy-static-assets",
    closeBundle() {
      const outputDir = path.resolve(__dirname, "dist")

      for (const asset of staticAssets) {
        const source = path.resolve(__dirname, "public", asset)
        const destination = path.resolve(outputDir, asset)

        if (fs.existsSync(source)) {
          fs.mkdirSync(path.dirname(destination), { recursive: true })
          fs.copyFileSync(source, destination)
        }
      }

      fs.writeFileSync(path.resolve(outputDir, "_redirects"), "/*    /index.html   200\n")
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), copyStaticAssets()],
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
