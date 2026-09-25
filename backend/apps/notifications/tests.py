"""python manage.py test apps.notifications — compteurs et tableaux de bord (/api/stats/)"""
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.alertes.models import AlerteSOS
from apps.plaintes.models import Plainte
from apps.rdv.models import Tribunal


class StatsTests(APITestCase):

    def setUp(self):
        self.tgi = Tribunal.objects.create(nom='TGI Dakar', adresse='Dakar')
        mk = User.objects.create_user
        self.citoyen  = mk('c@test.sn', 'motdepasse123', nom='Diallo')
        self.greffier = mk('g@test.sn', 'motdepasse123', nom='Sy', role='greffier', tribunal=self.tgi)
        self.juge     = mk('j@test.sn', 'motdepasse123', nom='Sarr', role='juge', tribunal=self.tgi)
        for nature in ('foncier', 'agression', 'cyber'):
            Plainte.objects.create(plaignant=self.citoyen, tribunal=self.tgi, nature=nature, description='x')
        Plainte.objects.filter(nature='cyber').update(juge=self.juge, statut='progress')
        AlerteSOS.objects.create(citoyen=self.citoyen, type_alerte='vol')

    def test_badges_selon_le_role(self):
        self.client.force_authenticate(self.greffier)
        b = self.client.get('/api/stats/badges/').data
        self.assertEqual((b['plaintes'], b['alertes']), (2, 1))   # 2 en attente pour le greffe
        self.client.force_authenticate(self.juge)
        self.assertEqual(self.client.get('/api/stats/badges/').data['plaintes'], 1)  # uniquement son dossier
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(set(self.client.get('/api/stats/badges/').data), {'notifs', 'courriers'})

    def test_tableaux_de_bord(self):
        self.client.force_authenticate(self.greffier)
        d = self.client.get('/api/stats/dashboard/').data
        self.assertEqual((d['kpis']['plaintes_a_traiter'], d['kpis']['alertes_actives']), (3, 1))
        self.assertEqual(d['tribunal'], 'TGI Dakar')
        self.assertEqual(sum(m['val'] for m in d['mensuel']), 3)
        a = self.client.get('/api/stats/analytique/').data
        self.assertEqual(a['kpis']['total'], 3)
        self.assertEqual(sum(r['nombre'] for r in a['repartition']), 3)

        self.client.force_authenticate(self.juge)
        self.assertEqual(self.client.get('/api/stats/analytique/').data['kpis']['total'], 1)

        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.get('/api/stats/dashboard/').status_code, 403)
        c = self.client.get('/api/stats/citoyen/').data
        self.assertEqual((c['kpis']['plaintes_en_cours'], len(c['recents'])), (3, 3))
