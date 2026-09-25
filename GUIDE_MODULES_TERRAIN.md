# SunuTribunal — Modules issus de l'enquête terrain

Les 3 modules ont été construits à partir de l'entretien et du questionnaire du **greffier en chef du Tribunal d'instance**. Le design (couleurs, cartes, sidebar) n'a pas changé.

| Module | Besoin constaté sur le terrain | Où dans l'app |
|---|---|---|
| **1. Registres du greffe** | Registre courrier papier (Q15–16), registre de transmission (Q27), volume de papier (Q20), courrier difficile à retrouver (Q19) | Admin → **Registres** (nouveau) |
| **2. Archivage numérique** | L'archivage est le problème n°1 : « scanner les fonds de dossier » (Q26), retrouver un dossier est « très difficile » (Q25) | Admin → **Archives** (ex-Dossiers) |
| **3. RDV réels + SMS** | « Grand problème de stock des rendez-vous » (Q12), aucun registre des RDV (Q11), notification SMS souhaitée (Q14), RDV gérés par l'accueil (Q10) | Admin → **Rendez-vous** et Citoyen → **RDV** |

---

## 1. Installation (Windows)

### Étape 1 — Remplacer les fichiers (méthode sans erreur)

Le zip `SunuTribunal_modules.zip` contient **tous** les fichiers modifiés depuis le début, y compris les corrections précédentes, déjà rangés au bon chemin. Cela évite de coller un fichier au mauvais endroit, comme la dernière fois.

Mets le zip dans le dossier `sunutribunal\` (celui qui contient `backend` et `frontend`), puis dans **PowerShell** :

```powershell
cd C:\Users\kndia\OneDrive\Bureau\Sunu_Tribunal\sunutribunal
git checkout -b modules-terrain
Expand-Archive -Path .\SunuTribunal_modules.zip -DestinationPath . -Force
```

> ⚠️ Le zip contient `frontend\.env`. Si tu y avais modifié le lien ngrok, vérifie la ligne `VITE_API_URL` après l'extraction.

### Étape 2 — Backend

```bat
cd backend
venv\Scripts\activate
pip install "twilio>=9,<10"
python manage.py migrate --run-syncdb
python seed.py
python manage.py test apps
python manage.py runserver 0.0.0.0:8000
```

- `migrate --run-syncdb` crée les **9 nouvelles tables** (registres, archives, journal SMS, bureaux d'orientation). Tes comptes et tes données sont conservés : je l'ai vérifié sur une copie de ta base.
- `seed.py` ajoute les tribunaux et les comptes de démonstration (voir §5).
- `test apps` doit afficher : **`Ran 27 tests ... OK`**.

### Étape 3 — Frontend

Aucun nouveau paquet npm n'est nécessaire.

```bat
cd frontend
npm run dev -- --host
```

---

## 2. Format de numérotation des registres

**Format : `CODE-NNNNN/AAAA/JURIDICTION`**

| Registre | Code | Exemple | Lecture |
|---|---|---|---|
| Courrier arrivée | `CA` | `CA-00142/2026/TIDK` | 142ᵉ courrier arrivé en 2026 au TI de Dakar |
| Courrier départ | `CD` | `CD-00087/2026/TIDK` | 87ᵉ courrier expédié en 2026 |
| Affaires civiles | `RAC` | `RAC-00012/2026/TIDK` | 12ᵉ dossier civil de l'année |
| Plaintes | `RPL` | `RPL-00045/2026/TIDK` | 45ᵉ plainte enregistrée |
| Parquet | `RPQ` | `RPQ-00007/2026/TIDK` | 7ᵉ dossier du parquet |

Règles, identiques à un registre papier :
- **Numéro d'ordre continu** par registre, sur 5 chiffres, **remis à 00001 chaque 1er janvier**.
- **Un compteur par juridiction** : deux tribunaux ne se partagent pas la numérotation.
- **Aucun doublon possible**, même si deux agents enregistrent en même temps (verrou en base).
- **Le numéro ne se modifie jamais** après attribution.

**Code de la juridiction :** par défaut, il est tiré des initiales du nom du tribunal (« TGI Dakar - Plateau » → `TGIDP`). Pour mettre le code officiel :
1. Ouvre **Django Admin**, section **Codes de juridiction**.
2. Clique sur **Ajouter**, choisis le tribunal et saisis le code (ex. `TIDK`).

Pour un agent sans tribunal, c'est la valeur `CODE_JURIDICTION` du fichier `.env` qui est utilisée.

---

## 3. Configurer les SMS Twilio (envoi réel)

1. Crée un compte sur **twilio.com** : le compte d'essai est gratuit et donne un crédit de test.
2. Dans **Console → Account Info**, copie l'**Account SID** et l'**Auth Token**.
3. Dans **Phone Numbers → Buy a number**, obtiens un numéro Twilio. Le compte d'essai en offre un.
4. Autorise le Sénégal : **Messaging → Settings → Geo permissions → cocher Senegal (+221)**.
5. **Compte d'essai uniquement :** Twilio n'envoie qu'aux numéros vérifiés. Ajoute ton téléphone et ceux de la démo dans **Phone Numbers → Verified Caller IDs**.
6. Ajoute ces lignes dans `backend\.env` :

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=ton-auth-token
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
```

7. Redémarre `runserver`.

**Comportement :**
- Les SMS partent à la **confirmation** et au **rejet** d'un RDV, avec la date, l'heure, le bureau d'orientation ou le motif du rejet.
- Ils sont écrits **sans accents**, ce qui permet 160 caractères par SMS au lieu de 70 : c'est moins cher.
- Les numéros sont normalisés automatiquement : `77 123 45 67` devient `+221771234567`.
- Si l'envoi échoue (crédit épuisé, numéro non vérifié…), **le RDV est quand même validé** et l'erreur est inscrite au **journal des SMS**. Ce journal est visible en bas de la page Rendez-vous et dans Django Admin.

---

## 4. Ce que fait chaque module

### Module 1 — Registres du greffe
- Enregistrement du courrier **arrivée / départ** : numéro automatique, expéditeur, référence, objet, nombre de pièces, priorité, dossier lié.
- **Scan** du courrier avec l'appareil photo du téléphone, ou envoi d'un PDF.
- **Circuit** : Enregistré → Transmis à [service] → Accusé de réception → Traité → Expédié / Archivé. Chaque étape garde la date, l'agent et une observation.
- Onglet **Transmission** : le registre de transmission numérique, qui remplace le cahier.
- Recherche par numéro, objet, correspondant ou référence ; filtres par registre et par statut.
- **Export Excel (CSV)** pour imprimer ou archiver le registre.

### Module 2 — Archivage numérique
- Ouverture d'un dossier avec numéro officiel (RAC / RPL / RPQ), parties, juge et mots-clés.
- **Numérisation** : scanner avec le téléphone ou importer plusieurs PDF ou images (15 Mo max chacun).
- **Recherche** dans le numéro, les parties, les mots-clés **et le nom des pièces**.
- **Emplacement de l'original papier** (salle, armoire, étagère, boîte), obligatoire pour archiver.
- Historique complet : ouverture, numérisation, clôture, archivage, réouverture.
- Seul le greffier en chef peut supprimer une pièce, et la suppression est tracée.

### Module 3 — RDV réels et orientation
- Le citoyen choisit un **vrai tribunal** et un service (« Dépôt de dossier » est en premier). L'app lui montre les **pièces à apporter** et le **bureau** où il sera orienté.
- Seuls les créneaux **réellement libres** sont proposés : pas de week-end, pas de créneau passé, pas de double réservation.
- L'**agent d'accueil** valide ou rejette le RDV (motif obligatoire), et un **SMS** est envoyé au citoyen.
- Le citoyen reçoit un **ticket d'orientation** (référence, bureau, pièces) à montrer aux ASP à l'accueil, plus une notification dans l'app.
- Les **bureaux d'orientation** se règlent dans Django Admin, section **Bureaux d'orientation**.

---

## 5. Rôles et comptes de démonstration

| Compte | Mot de passe | Rôle | Voit dans le menu |
|---|---|---|---|
| admin@tgi-dakar.sn | admin1234 | Greffier en chef | Tout, dont **Personnel** |
| greffier@tgi-dakar.sn | greffier1234 | Greffier | RDV, Plaintes, Registres, Archives… |
| accueil@tgi-dakar.sn | accueil1234 | Accueil et orientation | **Rendez-vous**, Courriers, Alertes |
| courrier@tgi-dakar.sn | courrier1234 | Bureau courrier | **Registres**, Courriers, Archives |
| juge@tgi-dakar.sn | juge1234 | Juge | RDV, Plaintes, Archives, Stats |
| citoyen@demo.sn | demo1234 | Citoyen | Espace citoyen |

Le greffier en chef peut aussi créer des agents d'**accueil** et de **courrier** depuis la page **Personnel**.

---

## 6. Scénario de démonstration pour la soutenance (5 minutes)

1. **Citoyen** (sur le téléphone, APK) : prend un RDV « Dépôt de dossier ». Il voit la liste des pièces à apporter et le bureau.
2. **Accueil** : valide le RDV. Le **SMS arrive sur le téléphone** devant le jury.
3. **Citoyen** : ouvre le **ticket d'orientation** et la notification.
4. **Bureau courrier** : enregistre un courrier arrivé, le **scanne**, le transmet au greffe civil, puis montre le **registre de transmission**.
5. **Greffier** : ouvre un dossier, **scanne une pièce**, l'archive avec son emplacement. Il le **retrouve en tapant un mot-clé** : c'est la réponse au « très difficile à retrouver » de l'enquête.

---

## 7. Limites connues (à citer honnêtement au jury)

- **Créneau rejeté :** il reste réservé, car une contrainte d'unicité existe déjà dans ta base. La corriger demanderait de passer aux migrations Django, ce qui est prévu avec Railway.
- **Pièces scannées :** elles sont servies par Django en mode `DEBUG`. Sur Railway, il faudra un stockage de fichiers dédié.
- **Compte Twilio d'essai :** il n'envoie qu'aux numéros vérifiés et ajoute un préfixe « Sent from your Twilio trial account ».
