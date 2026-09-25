"""python manage.py test apps.correspondances"""
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.notifications.models import Notification
from apps.plaintes.models import Plainte
from apps.rdv.models import Tribunal
from apps.registres.models import Courrier


class CourriersTests(APITestCase):

    def setUp(self):
        self.tgi = Tribunal.objects.create(nom='TGI Dakar', adresse='Dakar')
        mk = User.objects.create_user
        self.citoyen  = mk('c@test.sn', 'motdepasse123', nom='Diallo', prenom='Awa')
        self.voisin   = mk('v@test.sn', 'motdepasse123', nom='Ndiaye')
        self.courrier = mk('bc@test.sn', 'motdepasse123', nom='Sow', role='courrier', tribunal=self.tgi)
        self.juge     = mk('j@test.sn', 'motdepasse123', nom='Sarr', role='juge', tribunal=self.tgi)
        self.plainte  = Plainte.objects.create(plaignant=self.citoyen, tribunal=self.tgi, nature='foncier',
                                               description='x', juge=self.juge)

    def test_aller_retour_avec_registre(self):
        self.client.force_authenticate(self.citoyen)
        pj = SimpleUploadedFile('titre.pdf', b'%PDF-1.4', content_type='application/pdf')
        r = self.client.post('/api/correspondances/', {
            'sujet': 'Pièce complémentaire', 'message': 'Voici mon titre foncier.',
            'dossier_ref': self.plainte.reference, 'destinataire_service': 'greffe', 'piece_jointe': pj,
        }, format='multipart')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(r.data['numero_registre'].startswith('CA-'))
        self.assertEqual(r.data['tribunal'], self.tgi.id)          # déduit du dossier
        entrant = r.data['id']
        reg = Courrier.objects.get(numero=r.data['numero_registre'])
        self.assertEqual((reg.sens, reg.registre, reg.dossier_lie), ('arrivee', 'plaintes', self.plainte.reference))
        self.assertTrue(Notification.objects.filter(destinataire=self.courrier, lien=f'/admin/courrier?id={entrant}').exists())

        # Le bureau courrier le voit, un autre citoyen non
        self.client.force_authenticate(self.courrier)
        self.assertEqual([c['id'] for c in self.client.get('/api/correspondances/?sens=entrant').data], [entrant])
        self.client.force_authenticate(self.voisin)
        self.assertEqual(self.client.get('/api/correspondances/').data, [])
        self.assertEqual(self.client.post(f'/api/correspondances/{entrant}/lu/').status_code, 404)

        # Réponse du tribunal → registre départ + notification du citoyen
        self.client.force_authenticate(self.courrier)
        r = self.client.post(f'/api/correspondances/{entrant}/repondre/', {'message': 'Bien reçu.'}, format='json')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(r.data['numero_registre'].startswith('CD-'))
        self.assertEqual((r.data['sujet'], r.data['parent']), ('Re: Pièce complémentaire', entrant))
        self.assertTrue(Notification.objects.filter(destinataire=self.citoyen, type_notif='message').exists())

        self.client.force_authenticate(self.citoyen)
        recus = self.client.get('/api/correspondances/?sens=sortant').data
        self.assertEqual(len(recus), 1)
        self.assertFalse(recus[0]['lu'])
        self.assertTrue(self.client.post(f'/api/correspondances/{recus[0]["id"]}/lu/').data['lu'])
        # Le citoyen ne peut pas marquer « lu » son propre envoi (c'est au tribunal de le faire)
        self.assertEqual(self.client.post(f'/api/correspondances/{entrant}/lu/').status_code, 400)

    def test_ecrire_au_juge_du_dossier(self):
        self.client.force_authenticate(self.citoyen)
        r = self.client.post('/api/correspondances/', {
            'sujet': 'Report', 'message': 'Je demande un report.',
            'dossier_ref': self.plainte.reference, 'destinataire_service': 'juge_dossier'}, format='json')
        self.assertEqual(r.data['juge_nom'], self.juge.full_name)
        self.client.force_authenticate(self.juge)
        self.assertEqual(len(self.client.get('/api/correspondances/').data), 1)

    def test_dossier_d_un_autre_refuse(self):
        self.client.force_authenticate(self.voisin)
        r = self.client.post('/api/correspondances/', {'sujet': 'x', 'message': 'y',
                                                       'dossier_ref': self.plainte.reference}, format='json')
        self.assertEqual(r.status_code, 400)
        r = self.client.post('/api/correspondances/', {'sujet': 'x', 'message': 'y'}, format='json')
        self.assertIn('tribunal', r.data)

    def test_nouveau_courrier_du_tribunal(self):
        self.client.force_authenticate(self.courrier)
        self.assertEqual(self.client.get('/api/correspondances/citoyens/?q=dia').data[0]['id'], self.citoyen.id)
        self.assertEqual(self.client.get(f'/api/correspondances/dossiers/?citoyen={self.citoyen.id}').data[0]['ref'],
                         self.plainte.reference)
        r = self.client.post('/api/correspondances/', {'citoyen': self.citoyen.id, 'sujet': 'Convocation',
                                                       'message': 'Audience le 15.'}, format='json')
        self.assertEqual((r.status_code, r.data['sens']), (201, 'sortant'))
        # Un agent ne peut pas écrire à un autre agent par ce canal
        r = self.client.post('/api/correspondances/', {'citoyen': self.juge.id, 'sujet': 'x', 'message': 'y'}, format='json')
        self.assertEqual(r.status_code, 400)
