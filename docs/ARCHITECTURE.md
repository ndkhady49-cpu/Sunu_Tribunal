# Architecture SunuTribunal

## Schéma d'Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENTS                                  │
│                                                              │
│  📱 App Mobile        🌐 Web Browser      🖥️ Admin Web       │
│  (React Native /      (React + Vite       (React Dashboard)  │
│   Flutter)             + TailwindCSS)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     NGINX (Reverse Proxy)                    │
│              SSL Termination · Load Balancing                │
└───────────────┬──────────────────────┬──────────────────────┘
                │                      │
                ▼                      ▼
┌───────────────────────┐   ┌──────────────────────────────────┐
│  React Static Files   │   │   Django REST Framework API      │
│  /usr/share/nginx/    │   │                                  │
│  html                 │   │  ┌─────────────────────────────┐ │
└───────────────────────┘   │  │  Apps:                      │ │
                            │  │  • accounts (Auth + JWT)    │ │
                            │  │  • rdv (Rendez-vous)        │ │
                            │  │  • plaintes (Plaintes)      │ │
                            │  │  • alertes (SOS)            │ │
                            │  │  • notifications            │ │
                            │  └─────────────────────────────┘ │
                            └──────────────┬───────────────────┘
                                           │
              ┌────────────────────────────┼───────────────────┐
              │                            │                   │
              ▼                            ▼                   ▼
┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐
│   PostgreSQL 15      │  │   Redis (Cache +     │  │ External Services│
│                      │  │   Celery Queue)      │  │                  │
│ Tables:              │  │                      │  │ • Firebase FCM   │
│ • users              │  │ • Session cache      │  │   (Push notif)   │
│ • tribunaux          │  │ • Task queue         │  │ • Twilio SMS     │
│ • rendez_vous        │  │ • Rate limiting      │  │ • OpenStreetMap  │
│ • plaintes           │  │                      │  │   (Cartes)       │
│ • alertes_sos        │  └──────────────────────┘  │ • SendGrid Email │
│ • notifications      │                            └──────────────────┘
│ • pieces_jointes     │
└─────────────────────┘

## Flux de données — Rendez-vous

Citoyen App ──POST /api/rdv/──► Django API
                                    │
                                    ▼
                             PostgreSQL (save)
                                    │
                                    ▼
                         Celery Task (async)
                                    │
                            ┌───────┴──────────┐
                            ▼                  ▼
                     Firebase FCM          Email/SMS
                   (Admin notifié)      (Confirmation)
                            │
                    Admin App reçoit
                    notification push
                            │
                    Admin valide RDV ──POST /api/rdv/{id}/valider/
                            │
                            ▼
                     Firebase FCM ──► Citoyen notifié
                     "Votre RDV est confirmé ✅"

## Flux SOS

Citoyen ──POST /api/alertes/──► Django API
              (GPS coords)          │
                                    ├──► PostgreSQL (save alerte)
                                    ├──► Firebase (admin notifié instantanément)
                                    ├──► Twilio SMS (Police)
                                    └──► Celery (log + suivi)
```
