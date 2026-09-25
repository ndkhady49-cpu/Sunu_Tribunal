"""
SunuTribunal â€” Statistiques et compteurs (chiffres rÃ©els, calculÃ©s depuis la base)
    GET /api/stats/badges/      compteurs des menus (tous les rÃ´les)
    GET /api/stats/dashboard/   vue gÃ©nÃ©rale du tribunal (personnel)
    GET /api/stats/analytique/  page Statistiques (greffier en chef, juge, greffier)
    GET /api/stats/citoyen/     accueil de l'espace citoyen
Chaque chiffre respecte le cloisonnement des listes : un juge ne compte que ses dossiers,
un agent que son tribunal, un citoyen que ses propres donnÃ©es.
"""
from collections import defaultdict


from django.urls import path
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.models import User, STAFF_ROLES
from apps.accounts.permissions import IsStaffRole, HasRole
from apps.alertes.views import alertes_visibles
from apps.correspondances.views import courriers_visibles, ROLES_CITOYEN
from apps.notifications.models import Notification
from apps.plaintes.models import Plainte, EvenementPlainte
from apps.plaintes.views import plaintes_visibles
from apps.rdv.models import RendezVous

MOIS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']

# CatÃ©gorie de chaque dossier (graphiques Â« par service Â»).
# Plaintes : pÃ©nal sauf le foncier (civil) et la cybercriminalitÃ© (suivie Ã  part).
CATEGORIE_PLAINTE = {'agression': 'penal', 'escroquerie': 'penal', 'violence': 'penal',
                     'autre': 'penal', 'foncier': 'civil', 'cyber': 'cyber'}
CATEGORIE_RDV = {'depot_dossier': 'civil', 'civil': 'civil', 'consultation': 'civil', 'autre': 'civil',
                 'audience': 'penal', 'commercial': 'commercial', 'etat_civil': 'etat_civil'}
CATEGORIES = [('civil', 'Civil', '#0d1f3c'), ('penal', 'Penal', '#e8484e'),
              ('commercial', 'Commercial', '#e08800'), ('etat_civil', 'Etat civil', '#0f8a58'),
              ('cyber', 'Cyber', '#6366f1')]

PLAINTES_ACTIVES = ('pending', 'progress', 'urgent')
RDV_ACTIFS       = ('pending', 'confirmed')
ALERTES_ACTIVES  = ('active', 'progress')

# Statut affichÃ© (composant Badge du frontend)
BADGE_PLAINTE = {'pending': 'pending', 'progress': 'progress', 'urgent': 'urgent', 'done': 'done',
                 'rejected': 'rejected', 'archived': 'done'}
BADGE_RDV = {'pending': 'pending', 'confirmed': 'progress', 'done': 'done',
             'rejected': 'rejected', 'cancelled': 'rejected'}


def rdv_visibles(user):
    """MÃªme rÃ¨gle que la liste des RDV (apps/rdv/views.py)."""
    qs = RendezVous.objects.select_related('citoyen', 'tribunal')
    if user.role in STAFF_ROLES or user.is_superuser:
        return qs.filter(tribunal=user.tribunal) if user.tribunal_id and not user.is_superuser else qs
    return qs.filter(citoyen=user)


def _categorie(obj):
    if isinstance(obj, Plainte):
        return CATEGORIE_PLAINTE.get(obj.nature, 'penal')
    return CATEGORIE_RDV.get(obj.service, 'civil')


def _jours(debut, fin):
    return max((fin - debut).total_seconds() / 86400, 0)


def _debut_mois(maintenant):
    return maintenant.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _recents(plaintes, rdvs, lien_plainte, lien_rdv, n=5):
    elements = [{'ref': p.reference, 'citoyen': p.plaignant.full_name, 'type': 'Plainte',
                 'desc': f'{p.get_nature_display()} Â· {p.tribunal.nom}', 'status': BADGE_PLAINTE.get(p.statut, 'pending'),
                 'label': p.get_statut_display(), 'date': p.created_at, 'lien': lien_plainte(p)}
                for p in plaintes.order_by('-created_at')[:n]]
    elements += [{'ref': r.reference, 'citoyen': r.citoyen.full_name, 'type': 'RDV',
                  'desc': f'{r.tribunal.nom} Â· {r.get_service_display()}', 'status': BADGE_RDV.get(r.statut, 'pending'),
                  'label': r.get_statut_display(), 'date': r.created_at, 'lien': lien_rdv(r)}
                 for r in rdvs.order_by('-created_at')[:n]]
    return sorted(elements, key=lambda e: e['date'], reverse=True)[:n]


# â”€â”€ Compteurs des menus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def badges(request):
    user = request.user
    notifs = Notification.objects.filter(destinataire=user, lu=False).count()
    courriers = courriers_visibles(user)
    if not user.is_staff_role:
        return Response({'notifs': notifs, 'courriers': courriers.filter(sens='sortant', lu=False).count()})

    plaintes = plaintes_visibles(user)
    if user.role == 'juge':
        plaintes = plaintes.filter(statut__in=PLAINTES_ACTIVES)        # ses dossiers Ã  juger
    else:
        plaintes = plaintes.filter(statut__in=('pending', 'urgent'))   # nouvelles et urgentes pour le greffe
    return Response({
        'notifs':    notifs,
        'plaintes':  plaintes.count(),
        'courriers': courriers.filter(sens='entrant', lu=False).count(),
        'alertes':   alertes_visibles(user).filter(statut='active').count(),
        'rdv':       rdv_visibles(user).filter(statut='pending').count(),
    })


# â”€â”€ Vue gÃ©nÃ©rale du tribunal (AdminHome) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@api_view(['GET'])
@permission_classes([IsStaffRole])
def dashboard(request):
    user = request.user
    maintenant = timezone.localtime()
    debut_mois = _debut_mois(maintenant)
    plaintes, rdvs = plaintes_visibles(user), rdv_visibles(user)
    alertes = alertes_visibles(user)

    plaintes_a_traiter = plaintes.filter(statut__in=PLAINTES_ACTIVES)
    rdv_du_jour = rdvs.filter(date=maintenant.date()).exclude(statut__in=('rejected', 'cancelled'))
    nouveaux_mois = (plaintes.filter(created_at__gte=debut_mois).count()
                     + rdvs.filter(created_at__gte=debut_mois).count())

    # Dossiers dÃ©posÃ©s par mois (annÃ©e en cours, jusqu'au mois actuel)
    par_mois = [0] * maintenant.month
    for d in list(plaintes.filter(created_at__year=maintenant.year).values_list('created_at', flat=True)) + \
             list(rdvs.filter(created_at__year=maintenant.year).values_list('created_at', flat=True)):
        par_mois[timezone.localtime(d).month - 1] += 1

    # ActivitÃ© par service : part de chaque catÃ©gorie dans les dossiers en cours
    compte = defaultdict(int)
    for obj in list(plaintes_a_traiter) + list(rdvs.filter(statut__in=RDV_ACTIFS)):
        compte[_categorie(obj)] += 1
    total = sum(compte.values())
    activite = [{'service': label, 'pct': round(100 * compte[code] / total) if total else 0, 'color': couleur}
                for code, label, couleur in CATEGORIES if code != 'cyber' or compte[code]]

    return Response({
        'date': maintenant.date().isoformat(),
        'tribunal': user.tribunal.nom if user.tribunal_id else 'Tous les tribunaux',
        'kpis': {
            'dossiers_actifs':   plaintes_a_traiter.count() + rdvs.filter(statut__in=RDV_ACTIFS).count(),
            'nouveaux_mois':     nouveaux_mois,
            'rdv_jour':          rdv_du_jour.count(),
            'rdv_en_attente':    rdvs.filter(statut='pending').count(),
            'plaintes_a_traiter': plaintes_a_traiter.count(),
            'plaintes_urgentes': plaintes.filter(statut='urgent').count(),
            'alertes_actives':   alertes.filter(statut__in=ALERTES_ACTIVES).count(),
            'alertes_non_prises': alertes.filter(statut='active').count(),
        },
        'mensuel': [{'mois': MOIS[i], 'val': v} for i, v in enumerate(par_mois)],
        'activite': activite,
        'recents': _recents(plaintes, rdvs, lambda p: f'/admin/plaintes?ref={p.reference}',
                            lambda r: '/admin/rdv'),
    })


# â”€â”€ Page Statistiques (AdminStats) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@api_view(['GET'])
@permission_classes([HasRole('admin', 'juge', 'greffier')])
def analytique(request):
    user = request.user
    maintenant = timezone.localtime()
    annee = maintenant.year
    plaintes = plaintes_visibles(user).filter(created_at__year=annee)
    rdvs = rdv_visibles(user).filter(created_at__year=annee)
    dossiers = list(plaintes) + list(rdvs)

    # Date de traitement : Ã©vÃ©nement Â« traitÃ© Â» pour une plainte, derniÃ¨re mise Ã  jour pour un RDV effectuÃ©
    fin_plainte = dict(EvenementPlainte.objects.filter(plainte__in=plaintes, type='traite')
                       .values_list('plainte_id', 'created_at'))

    def traite_le(obj):
        if isinstance(obj, Plainte):
            return fin_plainte.get(obj.id, obj.updated_at) if obj.statut == 'done' else None
        return obj.updated_at if obj.statut == 'done' else None

    traites = [(o, traite_le(o)) for o in dossiers if traite_le(o)]
    clos = [o for o in dossiers if o.statut in ('done', 'rejected', 'cancelled', 'archived')]
    delais = [_jours(o.created_at, fin) for o, fin in traites]

    mensuel = [{'mois': MOIS[i], 'civil': 0, 'penal': 0, 'commercial': 0} for i in range(maintenant.month)]
    for o in dossiers:
        cat = _categorie(o)
        cle = {'cyber': 'penal', 'etat_civil': 'civil'}.get(cat, cat)   # 3 barres dans le graphique
        mensuel[timezone.localtime(o.created_at).month - 1][cle] += 1

    delai_mois = defaultdict(list)
    for o, fin in traites:
        delai_mois[timezone.localtime(fin).month].append(_jours(o.created_at, fin))

    natures = defaultdict(int)
    for p in plaintes:
        natures[p.get_nature_display()] += 1
    couleurs = ['#e8484e', '#e08800', '#0d1f3c', '#0f8a58', '#6366f1', '#9ca3af']
    repartition = [{'name': nom, 'value': round(100 * n / len(plaintes)), 'nombre': n, 'color': couleurs[i % 6]}
                   for i, (nom, n) in enumerate(sorted(natures.items(), key=lambda x: -x[1]))]

    perf = []
    for code, label, _ in CATEGORIES:
        ouverts = [o for o in dossiers if _categorie(o) == code]
        faits = [(o, fin) for o, fin in traites if _categorie(o) == code]
        if not ouverts:
            continue
        d = [_jours(o.created_at, fin) for o, fin in faits]
        perf.append({'service': label, 'ouverts': len(ouverts), 'traites': len(faits),
                     'taux': f'{round(100 * len(faits) / len(ouverts))}%',
                     'delai': f'{sum(d) / len(d):.1f}j' if d else 'â€”'})

    citoyens = User.objects.filter(role__in=ROLES_CITOYEN)
    return Response({
        'annee': annee,
        'kpis': {
            'traites':          len(traites),
            'total':            len(dossiers),
            'taux_resolution':  round(100 * len(traites) / len(clos)) if clos else None,
            'clos':             len(clos),
            'delai_moyen':      round(sum(delais) / len(delais), 1) if delais else None,
            'citoyens':         citoyens.count(),
            'citoyens_mois':    citoyens.filter(date_joined__gte=_debut_mois(maintenant)).count(),
        },
        'mensuel': mensuel,
        'repartition': repartition,
        'delai': [{'mois': MOIS[m - 1], 'jours': round(sum(v) / len(v), 1)} for m, v in sorted(delai_mois.items())],
        'performance': perf,
    })


# â”€â”€ Accueil citoyen (CitoyenHome) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def citoyen(request):
    user = request.user
    plaintes = Plainte.objects.filter(plaignant=user).select_related('plaignant', 'tribunal')
    rdvs = RendezVous.objects.filter(citoyen=user).select_related('citoyen', 'tribunal')
    notifs = Notification.objects.filter(destinataire=user)
    derniere = notifs.filter(lu=False).first()
    return Response({
        'kpis': {
            'dossiers_actifs': plaintes.filter(statut__in=PLAINTES_ACTIVES).count()
                               + rdvs.filter(statut__in=RDV_ACTIFS).count(),
            'rdv_confirmes':   rdvs.filter(statut='confirmed', date__gte=timezone.localdate()).count(),
            'plaintes_en_cours': plaintes.filter(statut__in=PLAINTES_ACTIVES).count(),
            'notifs':          notifs.filter(lu=False).count(),
        },
        'derniere_notif': {'titre': derniere.titre, 'corps': derniere.corps, 'lien': derniere.lien}
                          if derniere else None,
        'recents': _recents(plaintes, rdvs, lambda p: f'/citoyen/suivi?ref={p.reference}',
                            lambda r: f'/citoyen/suivi?ref={r.reference}'),
    })


urlpatterns = [
    path('badges/',     badges),
    path('dashboard/',  dashboard),
    path('analytique/', analytique),
    path('citoyen/',    citoyen),
]
