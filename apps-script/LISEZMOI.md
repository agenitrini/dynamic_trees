# Service des avis (pouces) — déploiement

Les boutons « pouce en l'air / pouce en bas » du site et le tableau de bord
(`admin.html`) s'appuient sur un petit service Google Apps Script, lié à une
Google Sheet qui stocke les votes (feuille « Votes ») et les signalements
(feuille « Avis »). Le mot de passe du tableau de bord est vérifié par ce
service : il n'apparaît pas dans le code public du site.

## Mise en place (une seule fois, environ 5 minutes)

1. Créer une Google Sheet vide (par exemple « Avis AlgAv »).
2. Dans la feuille : menu **Extensions → Apps Script**.
3. Remplacer le contenu de `Code.gs` par celui du fichier
   [`Code.gs`](Code.gs) de ce dossier, puis enregistrer.
4. Dans la liste des fonctions en haut, choisir **`setup`** et cliquer sur
   **Exécuter**. Accepter les autorisations demandées (accès à la feuille).
   Cela crée les feuilles « Votes » et « Avis ».
5. **Mot de passe du tableau de bord** : dans l'éditeur, **Paramètres du projet
   (roue dentée) → Propriétés du script → Ajouter une propriété**, nom
   `ADMIN_PASSWORD`, valeur : le mot de passe choisi. Il n'est écrit nulle part
   dans le dépôt, qui est public.
6. Cliquer sur **Déployer → Nouveau déploiement**, type **Application Web** :
   - Exécuter en tant que : **moi** ;
   - Qui a accès : **tout le monde**.
   Cliquer sur **Déployer** et copier l'**URL de l'application Web**
   (`https://script.google.com/macros/s/…/exec`).
7. Coller cette URL dans `js/config.js` (champ `feedbackUrl`), puis publier le
   site. Les boutons apparaissent alors en haut de chaque page.

## Utilisation

- Tableau de bord : `admin.html` (par exemple
  https://agenitrini.github.io/dynamic_trees/admin.html). On y voit les
  compteurs par page, on peut les remettre à zéro (par page ou en totalité), et
  on y lit les signalements avec le lien vers la page concernée.
- Les signalements restent aussi lisibles dans la feuille « Avis » ; la remise à
  zéro des compteurs ne les efface pas.
- Après 5 mots de passe erronés, le tableau de bord est bloqué 10 minutes.

## Changer le mot de passe

Dans l'éditeur Apps Script : **Paramètres du projet → Propriétés du script**,
modifier la propriété `ADMIN_PASSWORD`.

## Mettre à jour le script

Après une modification de `Code.gs` : **Déployer → Gérer les déploiements →
modifier (crayon) → Version : nouvelle version → Déployer**. L'URL ne change pas.
