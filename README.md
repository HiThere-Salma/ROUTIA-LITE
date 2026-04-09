# ROUTIA-LITE

Interface web légère pour la plateforme RoutIA.

## Stack technique

- **React** + **TypeScript** via Vite
- **Tailwind CSS** pour le styling
- **Supabase** pour la base de données et l'authentification
- **React Router** pour la navigation
- **Lucide React** pour les icônes

## Architecture

\`\`\`
src/
  core/        # layout, composants UI réutilisables, hooks
  modules/     # pages par domaine métier
  routes/      # routing centralisé
  lib/         # client Supabase et utilitaires
\`\`\`

## Installation

Prérequis : Node.js 18+

\`\`\`bash
git clone https://github.com/bfakri-adven/ROUTIA-LITE
cd ROUTIA-LITE
npm install
\`\`\`

## Configuration

Crée un fichier `.env` à la racine :

\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## Lancement

\`\`\`bash
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`

## Contributeurs

- ADVEN Conseil

## Licence

Projet interne RoutIA — tous droits réservés LASATECH SOLUTIONS.