# Site vitrine TraceLot & BioStock

Site one-page de présentation du projet de fin d'études de YRIGALE Kouyo Saint Michel.
HTML + Tailwind CSS, animations GSAP (ScrollTrigger), scènes 3D Three.js.

## Mettre en ligne

Le dossier `dist/` est le site prêt à déployer. Envoyez tout son contenu tel quel
(Cloudflare Pages, Hostinger, Netlify, GitHub Pages…). Aucun serveur ni build n'est nécessaire.

```
dist/
  index.html
  css/app.css      Tailwind compilé + styles du site
  js/main.js       interactions et animations GSAP
  js/scenes.js     scènes 3D (module ES)
  img/             logos détourés
```

Pour tester en local, servez le dossier (le module 3D ne se charge pas en `file://`) :

```
cd dist && python3 -m http.server 8000
```

Bibliothèques chargées depuis des CDN, versions figées : GSAP 3.12.5 et ScrollTrigger (cdnjs),
Three.js 0.160.0 (jsDelivr), polices Manrope, Inter et JetBrains Mono (Google Fonts).

## Modifier le site

Les sources sont dans `src/` :

- `src/page.html` : tous les textes et la structure des sections
- `src/styles.css` : couleurs de la charte BioStock et composants
- `src/main.js` : compteurs, parcours épinglé, démo des verdicts, démo hors-ligne, registre
- `src/scenes.js` : camion, sacs taggés, village, pont-bascule, serveur, centrale

Après modification, reconstruisez :

```
npm install
python3 tools/build.py
```

Le script compile Tailwind et régénère `dist/` ainsi qu'une version autonome
en un seul fichier dans `artifact/`.

## Points à vérifier avant diffusion

- Les chiffres de la maquette BioStock (1 284 lots, alertes, etc.) sont des données d'exemple.
- Les villages cités (Zégo, Hiré, Didoko, Guitry) servent d'illustration.
- Contacts : WhatsApp +225 07 48 98 18 79 et LinkedIn de Saint Michel, dans la section « Prochaine étape ».
- Respect de `prefers-reduced-motion` : sans animation, le parcours s'affiche en cartes statiques.
