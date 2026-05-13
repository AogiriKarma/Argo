# Argo

Wiki communautaire du serveur Minecraft **Veilleurs au Clair de Lune** — items, mobs, PNJ, quêtes, cartes, listes de courses.

Hébergé sur https://argo.aogiri.dev.

## Stack

- SvelteKit 2 + Svelte 5 (runes)
- Tailwind CSS v4
- `adapter-static` → SPA pure
- Données : dump Firestore offline (`static/data/dump.json`)
- Pas de backend : tout persiste en `localStorage` côté navigateur

## Développement

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → build/
npm run preview  # tester le build
```

## Mise à jour des données

Quand le serveur ajoute/modifie items/quêtes :

1. Re-runner le dump Firestore (script externe au repo)
2. Remplacer `static/data/dump.json`
3. Commit + push → re-deploy automatique

## Déploiement

Auto-deploy via Cloudflare Pages sur push de `main`.

Build settings :
- Build command : `npm run build`
- Build output : `build`
- Root directory : `/`
