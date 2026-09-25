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
- NE JAMAIS changer le design : Navy #0D1F3C, vert justice #0A5C3A, or #C9A227, police DM Sans.
  Réutiliser les classes existantes : card, btn-primary, btn-justice, btn-ghost, btn-danger,
  form-input, form-label, form-select, kpi-box, kpi-num, kpi-label, data-table, badge, sidebar-item,
  et les composants `Badge`, `Modal`.
- Sidebar verte côté citoyen, navy côté admin.
- Système Windows : toujours donner des commandes Windows (cmd / PowerShell), jamais Linux.
- L'inscription publique crée UNIQUEMENT des citoyens. Les comptes du tribunal se créent
  via Django Admin ou la page Personnel (API `/api/auth/staff/`).
- Rôles du personnel : admin (greffier en chef), juge, greffier, accueil, courrier (voir `STAFF_ROLES`).
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