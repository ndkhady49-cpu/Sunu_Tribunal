# ⚖️ SunuTribunal — Justice Digitale Sénégal

> **"Une Justice Moderne Pour Tous"**  
> Application e-gouvernement de gestion judiciaire citoyenne

---

## 🏗️ Architecture Technique

```
sunutribunal/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Django + DRF + PostgreSQL
├── docker-compose.yml # Déploiement conteneurisé
└── docs/              # Documentation
```

## 🛠️ Stack Technologique

| Couche        | Technologie                          | Justification                           |
|---------------|--------------------------------------|-----------------------------------------|
| **Frontend**  | React 18 + Vite + TailwindCSS        | Performances, SEO, UI réactive          |
| **Mobile**    | React Native / Flutter               | Code partagé Android + iOS              |
| **Backend**   | Django 4.2 + Django REST Framework   | Robuste, sécurisé, ORM puissant         |
| **Auth**      | JWT (SimpleJWT)                      | Stateless, sécurisé                     |
| **Base de données** | PostgreSQL 15                  | Transactions ACID, scalable             |
| **Cache/Queue**| Redis + Celery                      | Notifications async, performance        |
| **Notifications** | Firebase FCM + Twilio SMS        | Push mobile + SMS fallback              |
| **Carte**     | Leaflet + OpenStreetMap              | Open source, gratuit                    |
| **Conteneurs**| Docker + Docker Compose              | Reproducibilité, déploiement facile     |
| **Hébergement**| Railway / Render / AWS               | Scalable, abordable                     |

---

## 🚀 Lancement Rapide (Développement)

### Prérequis
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Configurez vos variables
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
# → http://localhost:8000
```

### 3. Avec Docker (recommandé)
```bash
docker-compose up --build
# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# Admin    → http://localhost:8000/admin
```

---

## 🔐 Comptes de démonstration

| Rôle       | Email                    | Mot de passe |
|------------|--------------------------|--------------|
| Citoyen    | citoyen@demo.sn          | demo1234     |
| Greffier   | admin@tgi-dakar.sn       | admin1234    |
| Juge       | juge@tgi-dakar.sn        | juge1234     |

---

## 📱 Fonctionnalités

### Espace Citoyen
- ✅ Inscription / Connexion sécurisée (JWT)
- ✅ Prise de rendez-vous en ligne avec créneaux en temps réel
- ✅ Dépôt de plainte multi-étapes avec pièces justificatives
- ✅ Suivi de dossier avec tracker visuel
- ✅ Carte interactive des tribunaux (Leaflet + OSM)
- ✅ Notifications push (Firebase FCM)
- ✅ Bouton SOS d'urgence avec géolocalisation GPS

### Espace Administration (Tribunal)
- ✅ Tableau de bord avec KPIs en temps réel
- ✅ Validation/rejet des rendez-vous (notif citoyen automatique)
- ✅ Instruction des plaintes avec messagerie interne
- ✅ Gestion des alertes SOS avec prise en charge
- ✅ Statistiques analytiques (graphiques Recharts)
- ✅ Suivi des dossiers par juge

---

## 📡 API REST — Endpoints principaux

```
POST   /api/auth/login/              # Connexion (JWT)
POST   /api/auth/register/           # Inscription
GET    /api/auth/me/                 # Profil utilisateur

GET    /api/rdv/                     # Liste rendez-vous
POST   /api/rdv/                     # Créer RDV
POST   /api/rdv/{id}/valider/        # Valider RDV (admin)
GET    /api/rdv/slots/?tribunal=&date=  # Créneaux disponibles

GET    /api/plaintes/                # Liste plaintes
POST   /api/plaintes/                # Déposer plainte
POST   /api/plaintes/{id}/instruire/ # Instruire (admin)
POST   /api/plaintes/{id}/message/   # Envoyer message

GET    /api/alertes/                 # Liste alertes SOS
POST   /api/alertes/                 # Créer alerte SOS
POST   /api/alertes/{id}/prendre/    # Prendre en charge
```

---

## 🔒 Sécurité

- Authentification JWT avec refresh tokens
- CORS configuré (frontend uniquement)
- Validation stricte des données (DRF serializers)
- Upload fichiers sécurisé (types + taille limités)
- HTTPS obligatoire en production (HSTS)
- Variables sensibles via `.env` (jamais dans le code)
- Rate limiting sur les endpoints critiques (à configurer)

---

## 🌍 Déploiement Production

### Railway (recommandé)
```bash
# Backend
railway up --service backend

# Frontend
railway up --service frontend
```

### Variables d'environnement production
```env
DEBUG=False
SECRET_KEY=<clé-secrète-forte-64-chars>
ALLOWED_HOSTS=sunutribunal.sn,www.sunutribunal.sn
DB_HOST=<railway-postgres-host>
REDIS_URL=<railway-redis-url>
```

---

## 👥 Équipe & Contact

**Projet BTS — Soutenance 2025**  
SunuTribunal · Justice Digitale · Sénégal

---

*© 2025 SunuTribunal — Tous droits réservés*
