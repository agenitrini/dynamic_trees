# Structures arborescentes dynamiques

Visualisations animées, pas à pas, des structures de données du cours
d'**algorithmique avancée** (AlgAv, Master 1 Informatique, Sorbonne Université) :
arbres de recherche, tries, tas, files binomiales, Huffman, LZW, hachage.

Le site est inspiré des [visualisations de David Galles](https://www.cs.usfca.edu/~galles/visualization/Algorithms.html),
mais entièrement réécrit : moteur d'animation propre, sans dépendance, interface
moderne bilingue (français / anglais) et thème clair / sombre.

## Utilisation

Aucune installation : ouvrir `index.html` dans un navigateur (cela fonctionne
aussi directement depuis le disque, en `file://`), ou publier le dépôt tel quel
(GitHub Pages, serveur web statique).

- `index.html` : liste des structures par chapitre ; une bulle d'information
  décrit chaque structure et son objectif au survol.
- `viz.html?algo=<id>` : la visualisation (`viz.html?algo=avl`, …). Paramètres
  optionnels : `ex=<exemple>` pour lancer un exemple, `lang=fr|en`.
- `examples.html` : la bibliothèque d'exemples (ceux des transparents en priorité),
  chacun ouvrant directement la visualisation.

Dans une visualisation : saisir une ou plusieurs valeurs (séparées par des
espaces) puis choisir l'opération. Le lecteur permet lecture / pause, pas à pas
avant et arrière, réglage de la vitesse et déplacement dans la chronologie. Le
panneau latéral montre le journal des étapes (cliquable), le pseudo-code du
cours avec la ligne courante surlignée, et une fiche sur la structure.

Raccourcis : <kbd>Espace</kbd> lecture/pause, <kbd>←</kbd> <kbd>→</kbd> pas à
pas, <kbd>Entrée</kbd> dans un champ pour valider ; molette pour zoomer, glisser
pour déplacer, double-clic pour recentrer.

## Avis des visiteurs

Chaque page porte, dans le bandeau supérieur, un pouce en l'air (« page qui
semble cohérente avec le cours AlgAv », après confirmation) et un pouce en bas
(formulaire décrivant le problème), avec leurs compteurs. Les votes et les
signalements sont enregistrés par un service Google Apps Script ; le tableau de
bord `admin.html`, protégé par mot de passe, affiche les compteurs, permet de les
remettre à zéro et liste les signalements avec le lien vers la page. Mise en
place : [apps-script/LISEZMOI.md](apps-script/LISEZMOI.md). Tant que
`js/config.js` ne contient pas l'adresse du service, les boutons sont masqués.

## Structures

| Chapitre | Structures (identifiant) |
|---|---|
| 1. Compression | tas min (`heap`), Huffman statique (`huffman`), Huffman adaptatif (`ahuffman`), LZW (`lzw`) |
| 2. Files de priorité | file binomiale (`binomial`) |
| 3. Arbres de recherche | ABR (`abr`), AVL (`avl`), arbre auto-adaptatif (`splay`), arbre 2-3-4 (`a234`, éclatements en descente ou en remontée), arbre B (`btree`), arbre digital (`dst`), trie binaire (`triebin`), trie Patricia (`patricia`), R-trie (`rtrie`), trie hybride (`trieh`) |
| 4. Hachage | table de hachage (`hash` : chaînage, sondage linéaire / quadratique, double hachage), filtre de Bloom (`bloom`), hachage dynamique (`dynhash`), hachage extensible (`exthash`) |

Les algorithmes suivent le cours (transparents 2026) et les implantations Python
du projet PSTL « AlgAv unifiée ».

## Organisation du code

```
index.html, viz.html, examples.html   pages
css/style.css                         styles (variables CSS, thèmes clair et sombre)
js/i18n.js                            traductions, thème, en-tête et bouton drapeau
js/catalog.js                         catalogue : noms, descriptions, coûts, exemples
js/home.js, js/examples.js            accueil et bibliothèque d'exemples
js/core/scene.js                      scène, mise en page des arbres, classe DT.Algo
js/core/renderer.js                   rendu SVG animé, zoom et déplacement
js/core/player.js                     lecteur (lecture, pas à pas, vitesse)
js/core/app.js                        page de visualisation (commandes, panneaux)
js/algos/<id>.js                      une structure par fichier
tests/                                tests (Node, sans navigateur)
```

### Principe du moteur

Un algorithme manipule un modèle de données pur (`this.s`, clonable par
`structuredClone`, ce qui donne l'annulation gratuitement). À chaque étape
intéressante il appelle `this.step(message, { line })` : l'étape capture une
*scène* (nœuds, arêtes, textes positionnés) produite par sa méthode `draw(S)`.
Le moteur de rendu anime ensuite le passage d'une scène à la suivante en
interpolant les éléments de même identifiant : il suffit de garder les
identifiants des nœuds stables pour qu'une rotation ou un éclatement glisse
naturellement. Les messages sont des clés de traduction, résolues à
l'affichage : changer de langue met à jour toute la visualisation.

### Ajouter une structure

1. Créer `js/algos/<id>.js` : une classe qui étend `DT.Algo` avec `initState()`,
   les opérations (méthodes appelées par les boutons), `draw(S)`, et les
   descriptions statiques `controls` (barre de commandes) et `code`
   (pseudo-code). `js/algos/abr.js` sert de modèle.
2. Déclarer la structure dans `js/catalog.js` (textes FR/EN, coûts, exemples).
3. Ajouter une méthode `check()` qui vérifie les invariants, et des tests.

## Tests

```
node tests/run.js          # tous les tests
node tests/run.js tries    # seulement les fichiers dont le nom contient « tries »
```

Les tests chargent les modules dans Node, rejouent tous les exemples du
catalogue, vérifient les invariants de chaque structure après des centaines
d'opérations aléatoires, reproduisent les exemples des transparents (arbre 2-3-4
du cours, DST « ASERCHINGXMPL », Huffman adaptatif « carambarbcm », LZW,
tables de hachage, hachage dynamique et extensible…) et contrôlent que chaque
message existe en français et en anglais.

## Auteurs et licence

Copyright © 2024-2026 **Antoine Genitrini** (développeur principal).

Contributeurs : projet PSTL 2023-2024 (Sorbonne Université) — Tracy Hong,
Julien Fang, Jean-Marc Zhuang, Laura Rattanavan. Voir [AUTHORS.md](AUTHORS.md).

Ce programme est un logiciel libre distribué sous licence
[GNU GPL version 3](LICENSE) ou (à votre choix) toute version ultérieure.
