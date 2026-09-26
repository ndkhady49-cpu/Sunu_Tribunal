# SunuTribunal — instructions pour Claude

Application de justice digitale sénégalaise (projet de soutenance BTS, ISEP-AT Diamniadio).
Réponds en français.

## Stack
- Frontend : React + Vite + TailwindCSS (`frontend/`), APK Android via Capacitor
- Backend : Django 6 + DRF + JWT + SQLite (`backend/`), venv dans `backend\venv`
- IA : Groq (modèle `openai/gpt-oss-20b`, le seul disponible avec la clé) via `/api/chatbot/`
- SMS : Twilio (`backend/apps/notifications/sms.py`), identifiants dans `backend\.env`
- Tunnel : ngrok (backend port 8000)

## Règles à respecter
- Respecter la charte visuelle « Encre & Or » (définie dans `frontend/tailwind.config.js` et
  `frontend/src/index.css`) ; ne pas réintroduire de couleurs ou de polices hors charte :

  | Nom Tailwind | Rôle | Valeurs |
  |---|---|---|
  | `navy` | Encre, couleur principale | 50 #EEF1F6 · 100 #D5DCE8 · 500 #1C2B44 · 600 #142033 · 700 #0E1A2B · 900 #070D17 |
  | `gold` | Or, accent | 50 #FBF6EC · 100 #F1E4C6 · 400 #C9A45C · 500 #A8843F |
  | `justice` | Vert baobab, succès | 50 #EAF3EF · 100 #C7DFD5 · 400 #2F7A62 · 500 #1F5E4B · 600 #174637 |
  | `danger` | Bordeaux, SOS / erreurs | 50 #F9ECEE · 400 #A23446 · 600 #7A1F2B |
  | `gray` | Neutres chauds | 50 = fond ivoire #F7F3EA · 200 = bordures #E7E1D4 |

  `red`, `green` et `blue` de Tailwind sont redirigés vers bordeaux, baobab et encre.
  Couleurs hors Tailwind (graphiques, carte, toasts) : `frontend/src/utils/couleurs.js`.
- Polices : titres « Cormorant Garamond » 600/700 (`font-display`), texte « Manrope » 400–700.
- Style : fond ivoire, cartes blanches, bordures fines #E7E1D4, coins arrondis 14px, ombres très
  douces, espacements aérés. **Un seul accent or par écran.** Contraste texte/fond conforme WCAG AA.
- Sidebar admin Encre #0E1A2B, sidebar citoyen Baobab profond #174637 (`bg-justice-600`) ;
  élément actif = liseré or à gauche (`.sidebar-item.active`).
- Réutiliser les classes existantes : card, btn-primary (Encre), btn-justice, btn-ghost, btn-danger,
  btn-gold (réservé à l'action principale de la page d'accueil), form-input, form-label, form-select,
  kpi-box, kpi-num, kpi-label, data-table, badge, sidebar-item, et les composants `Badge`, `Modal`.
- Logo : composant `Logo` (`frontend/src/components/common/Logo.jsx`) — `fond="clair"` sur fond
  clair, `fond="sombre"` sur les sidebars et la bannière, `compact` pour l'icône seule. Fichiers dans
  `frontend/src/assets/logo_sunutribunal/` ; favicon `sunutribunal-icone-192.png`.
- Mobile d'abord : chaque écran doit être impeccable à 390 px de large (l'APK).
- Système Windows : toujours donner des commandes Windows (cmd / PowerShell), jamais Linux.
- Rôles du personnel : admin (greffier en chef), juge, greffier, accueil, courrier (voir `STAFF_ROLES`).
- **Accès du personnel (sécurité)** :
  - Page publique : une seule fenêtre « Connexion » (email + mot de passe) pour tous ; aucune mention
    du personnel, du greffe ou des juges. La redirection se fait selon le rôle (`homePathFor`).
  - Un seul message d'échec « Email ou mot de passe incorrect. » : ne jamais révéler si l'email existe ni son rôle.
  - L'inscription publique crée UNIQUEMENT des citoyens (rôle forcé côté serveur).
  - Circuit de création des comptes : le superutilisateur crée **uniquement** le greffier en chef
    (rôle « admin ») dans Django Admin (/admin), avec son tribunal ; le greffier en chef crée ensuite
    juge, greffier, accueil et courrier depuis la page Personnel (`/api/auth/staff/`). Jamais de rôle
    « admin » via l'API ; un autre greffier en chef ne se modifie que dans Django Admin.
  - Mot de passe temporaire : tout compte du personnel créé par Django Admin ou par la page Personnel
    (ou dont le chef réinitialise le mot de passe) doit le changer à la 1re connexion — page
    `/mot-de-passe`, route `POST /api/auth/changer-mot-de-passe/` (validateurs Django). Tant que ce
    n'est pas fait, l'API renvoie 403 `mot_de_passe_a_changer` partout (`apps/accounts/authentication.py`).
  - Blocage : 5 échecs de connexion → 15 minutes (même pour un email inconnu), remise à zéro après succès.
  - Ces informations vivent dans la table `SecuriteCompte` (`apps/accounts/models.py`), pas dans `accounts_user` ;
    débloquer un agent : Django Admin → Utilisateurs → « Sécurité du compte ».
- L'URL du backend se règle uniquement dans `frontend/src/config.js` + `VITE_API_URL` de `frontend/.env`.
  Ne jamais écrire d'URL ngrok en dur ailleurs.

## Base de données
- Les apps n'ont PAS de dossier `migrations` : les tables se créent avec
  `python manage.py migrate --run-syncdb`. Ne pas lancer `makemigrations`.
- Conséquence : on ne peut pas modifier les colonnes d'une table existante. Ajouter plutôt
  de nouveaux modèles / nouvelles tables.

## Numérotation des registres
Format `CODE-NNNNN/AAAA/JURIDICTION` (ex. `CA-00142/2026/TIDK`), via `Compteur.prochain_numero()`
dans `backend/apps/registres/models.py`. Codes : CA, CD, RAC, RPL, RPQ.

## Commandes
```bat
:: Backend
cd backend
venv\Scripts\activate
python manage.py test apps
python manage.py runserver 0.0.0.0:8000

:: Frontend
cd frontend
npm run dev -- --host

:: APK
cd frontend
npm run build
npx cap sync android
cd android
gradlew assembleDebug
```

## Avant de dire qu'une tâche est finie
- Lancer `python manage.py test apps` (les 27 tests doivent passer).
- Pour le frontend, vérifier que `npm run build` passe sans erreur.