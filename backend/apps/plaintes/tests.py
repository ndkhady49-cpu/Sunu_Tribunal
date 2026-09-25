"""python manage.py test apps.plaintes"""
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.plaintes.models import Plainte
from apps.rdv.models import Tribunal


class PlaintesTests(APITestCase):

    def setUp(self):
        self.tgi = Tribunal.objects.create(nom='TGI Dakar', adresse='Dakar')
        self.autre_tgi = Tribunal.objects.create(nom='TGI Thies', adresse='Thies')
        mk = User.objects.create_user
        self.citoyen = mk('c@test.sn', 'motdepasse123', nom='Diallo', prenom='Awa')
        self.voisin  = mk('v@test.sn', 'motdepasse123', nom='Ndiaye')
        self.greffier = mk('g@test.sn', 'motdepasse123', nom='Sy', role='greffier', tribunal=self.tgi)
        self.juge    = mk('j@test.sn', 'motdepasse123', nom='Sarr', role='juge', tribunal=self.tgi)
        self.juge2   = mk('j2@test.sn', 'motdepasse123', nom='Badji', role='juge', tribunal=self.tgi)
        self.juge_thies = mk('j3@test.sn', 'motdepasse123', nom='Fall', role='juge', tribunal=self.autre_tgi)
        self.accueil = mk('a@test.sn', 'motdepasse123', nom='Ba', role='accueil', tribunal=self.tgi)

    def _deposer(self, fichiers=None):
        self.client.force_authenticate(self.citoyen)
        data = {'tribunal': self.tgi.id, 'nature': 'foncier', 'description': 'Litige sur une parcelle.'}
        if fichiers:
            data['pieces'] = fichiers
        return self.client.post('/api/plaintes/', data, format='multipart')

    def _post(self, user, url, data=None):
        self.client.force_authenticate(user)
        return self.client.post(url, data or {}, format='json')

    def test_circuit_complet(self):
        scan = SimpleUploadedFile('scan.jpg', b'\xff\xd8\xff' + b'0' * 100, content_type='image/jpeg')
        r = self._deposer([scan])
        self.assertEqual(r.status_code, 201, r.data)
        pid, ref = r.data['id'], r.data['reference']
        self.assertEqual(len(r.data['pieces']), 1)
        self.assertTrue(Notification.objects.filter(destinataire=self.greffier, titre='Nouvelle plainte déposée').exists())

        # Le greffe voit la plainte ; le juge ne la voit pas avant assignation
        self.client.force_authenticate(self.greffier)
        self.assertEqual([p['reference'] for p in self.client.get('/api/plaintes/').data], [ref])
        self.client.force_authenticate(self.juge)
        self.assertEqual(self.client.get('/api/plaintes/').data, [])

        # Assignation : juge d'un autre tribunal refusé, puis bon juge
        self.assertEqual(self._post(self.greffier, f'/api/plaintes/{pid}/assigner/', {'juge': self.juge_thies.id}).status_code, 400)
        r = self._post(self.greffier, f'/api/plaintes/{pid}/assigner/', {'juge': self.juge.id})
        self.assertEqual(r.data['juge_nom'], self.juge.full_name)
        self.assertTrue(Notification.objects.filter(destinataire=self.juge, titre='Nouveau dossier assigné').exists())
        self.assertTrue(Notification.objects.filter(destinataire=self.citoyen, titre='Dossier confié à un juge').exists())

        # Le juge assigné la voit, l'autre juge non
        self.client.force_authenticate(self.juge)
        self.assertEqual(len(self.client.get('/api/plaintes/').data), 1)
        self.client.force_authenticate(self.juge2)
        self.assertEqual(self.client.get('/api/plaintes/').data, [])
        self.assertEqual(self._post(self.juge2, f'/api/plaintes/{pid}/instruire/').status_code, 404)

        # Instruction, urgence, message, rejet (motif obligatoire)
        self.assertEqual(self._post(self.juge, f'/api/plaintes/{pid}/instruire/').data['statut'], 'progress')
        self.assertEqual(self._post(self.juge, f'/api/plaintes/{pid}/urgent/').data['statut'], 'urgent')
        self.assertEqual(self._post(self.juge, f'/api/plaintes/{pid}/message/', {'message': 'Apportez le titre foncier.'}).status_code, 201)
        self.assertEqual(self._post(self.juge, f'/api/plaintes/{pid}/rejeter/', {}).status_code, 400)
        r = self._post(self.juge, f'/api/plaintes/{pid}/rejeter/', {'motif': 'Prescription {acquise}'})
        self.assertEqual((r.data['statut'], r.data['motif_rejet']), ('rejected', 'Prescription {acquise}'))

        # Côté citoyen : historique complet, message et motif visibles
        self.client.force_authenticate(self.citoyen)
        d = self.client.get('/api/plaintes/my/').data[0]
        self.assertEqual([e['type'] for e in d['evenements']],
                         ['depot', 'assignation', 'instruction', 'urgent', 'message', 'rejet'])
        self.assertEqual(d['messages'][0]['contenu'], 'Apportez le titre foncier.')
        self.assertTrue(d['messages'][0]['est_tribunal'])
        self.assertEqual(d['motif_rejet'], 'Prescription {acquise}')
        self.assertTrue(Notification.objects.filter(destinataire=self.citoyen, titre='Plainte rejetée').exists())
        # Le greffe est prévenu de la décision du juge
        self.assertTrue(Notification.objects.filter(destinataire=self.greffier, titre__contains='Plainte rejetée').exists())

    def test_cloisonnement(self):
        pid = self._deposer().data['id']
        # Un autre citoyen ne voit pas la plainte et ne peut pas y écrire
        self.client.force_authenticate(self.voisin)
        self.assertEqual(self.client.get('/api/plaintes/').data, [])
        self.assertEqual(self._post(self.voisin, f'/api/plaintes/{pid}/message/', {'message': 'x'}).status_code, 404)
        # L'accueil n'a pas accès aux plaintes ; le citoyen ne peut pas décider
        self.client.force_authenticate(self.accueil)
        self.assertEqual(self.client.get('/api/plaintes/').data, [])
        self.assertEqual(self._post(self.citoyen, f'/api/plaintes/{pid}/instruire/').status_code, 403)
        self.assertEqual(self._post(self.citoyen, f'/api/plaintes/{pid}/assigner/', {'juge': self.juge.id}).status_code, 403)
        # Pas de modification directe (PATCH) : tout passe par les actions tracées
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.patch(f'/api/plaintes/{pid}/', {'juge': self.juge.id}, format='json').status_code, 405)

    def test_message_du_citoyen_notifie_le_greffe(self):
        pid = self._deposer().data['id']
        self._post(self.citoyen, f'/api/plaintes/{pid}/message/', {'message': 'Des nouvelles ?'})
        self.assertTrue(Notification.objects.filter(destinataire=self.greffier,
                                                    titre__startswith='Message du plaignant').exists())

    def test_piece_refusee(self):
        exe = SimpleUploadedFile('virus.exe', b'MZ', content_type='application/octet-stream')
        r = self._deposer([exe])
        self.assertEqual(r.status_code, 400)
        self.assertEqual(Plainte.objects.count(), 0)
