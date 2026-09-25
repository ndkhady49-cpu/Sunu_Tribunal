"""python manage.py test apps.alertes"""
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.notifications.models import Notification


class AlertesTests(APITestCase):

    def setUp(self):
        mk = User.objects.create_user
        self.citoyen = mk('c@test.sn', 'motdepasse123', nom='Diallo', telephone='771234567')
        self.voisin  = mk('v@test.sn', 'motdepasse123', nom='Ndiaye')
        self.accueil = mk('a@test.sn', 'motdepasse123', nom='Ba', role='accueil')
        self.greffier = mk('g@test.sn', 'motdepasse123', nom='Sy', role='greffier')

    def test_circuit_sos(self):
        self.client.force_authenticate(self.citoyen)
        r = self.client.post('/api/alertes/', {'type_alerte': 'agression', 'description': 'Au secours',
                                               'latitude': '14.692800', 'longitude': '-17.446700'}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        aid = r.data['id']
        self.assertTrue(Notification.objects.filter(destinataire=self.accueil, type_notif='sos').exists())

        self.client.force_authenticate(self.voisin)
        self.assertEqual(self.client.get('/api/alertes/').data, [])
        self.assertEqual(self.client.post(f'/api/alertes/{aid}/prendre/').status_code, 403)

        self.client.force_authenticate(self.accueil)
        self.assertEqual(len(self.client.get('/api/alertes/').data), 1)
        r = self.client.post(f'/api/alertes/{aid}/prendre/')
        self.assertEqual((r.data['statut'], r.data['pris_en_charge_par_nom']), ('progress', self.accueil.full_name))
        self.assertEqual(self.client.post(f'/api/alertes/{aid}/prendre/').status_code, 400)
        self.assertEqual(self.client.post(f'/api/alertes/{aid}/cloturer/', {'commentaire': 'Police sur place'},
                                          format='json').data['statut'], 'resolved')

        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.get('/api/alertes/').data[0]['statut'], 'resolved')
        titres = set(Notification.objects.filter(destinataire=self.citoyen).values_list('titre', flat=True))
        self.assertTrue({'Alerte SOS transmise', 'Alerte prise en charge', 'Alerte clôturée'} <= titres)
        # Les autres agents savent qui a pris l'alerte
        self.assertTrue(Notification.objects.filter(destinataire=self.greffier, titre__endswith='prise en charge').exists())

    def test_personnel_ne_cree_pas_de_sos(self):
        self.client.force_authenticate(self.accueil)
        self.assertEqual(self.client.post('/api/alertes/', {'type_alerte': 'vol'}, format='json').status_code, 403)
