"""python manage.py test apps.archives"""
import shutil, tempfile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.rdv.models import Tribunal

MEDIA_TEST = tempfile.mkdtemp()


@override_settings(MEDIA_ROOT=MEDIA_TEST)
class ArchivageTests(APITestCase):

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(MEDIA_TEST, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.tribunal = Tribunal.objects.create(nom='TGI Dakar', adresse='Dakar')
        self.greffier = User.objects.create_user('g@test.sn', 'motdepasse123', nom='Sarr',
                                                 role='greffier', tribunal=self.tribunal)
        self.chef = User.objects.create_user('chef@test.sn', 'motdepasse123', nom='Fall',
                                             role='admin', tribunal=self.tribunal)
        self.juge = User.objects.create_user('juge@test.sn', 'motdepasse123', nom='Diop',
                                             role='juge', tribunal=self.tribunal)
        self.client.force_authenticate(self.greffier)

    def _dossier(self, **kw):
        data = {'registre': 'civil', 'categorie': 'foncier', 'intitule': 'Litige terrain Keur Massar',
                'demandeur': 'Moussa Faye', 'defendeur': 'Awa Gueye', 'juge': self.juge.id,
                'mots_cles': 'titre foncier, bornage'}
        data.update(kw)
        return self.client.post('/api/archives/dossiers/', data, format='json')

    def test_numero_par_registre(self):
        r = self._dossier()
        self.assertEqual(r.status_code, 201, r.data)
        self.assertTrue(r.data['numero'].startswith('RAC-00001/'))
        self.assertTrue(r.data['numero'].endswith('/TGID'))
        self.assertTrue(self._dossier(registre='parquet').data['numero'].startswith('RPQ-00001/'))
        self.assertTrue(self._dossier().data['numero'].startswith('RAC-00002/'))

    def test_scan_recherche_et_archivage(self):
        did = self._dossier().data['id']
        pdf = SimpleUploadedFile('jugement_n12.pdf', b'%PDF-1.4 test', content_type='application/pdf')
        img = SimpleUploadedFile('cni.jpg', b'\xff\xd8\xff', content_type='image/jpeg')
        r = self.client.post(f'/api/archives/dossiers/{did}/pieces/',
                             {'fichiers': [pdf, img], 'type_piece': 'jugement'}, format='multipart')
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(len(r.data), 2)

        # recherche par partie, mot-clé et nom de pièce
        for q in ('Gueye', 'bornage', 'jugement_n12'):
            self.assertEqual(len(self.client.get(f'/api/archives/dossiers/?q={q}').data), 1, q)

        # archivage sans emplacement → refusé
        self.assertEqual(self.client.post(f'/api/archives/dossiers/{did}/archiver/').status_code, 400)
        r = self.client.post(f'/api/archives/dossiers/{did}/archiver/',
                             {'salle': 'A2', 'armoire': '3', 'boite': '2026-014'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['statut'], 'archive')
        self.assertIn('Boîte 2026-014', r.data['emplacement'])
        actions = [h['action'] for h in r.data['historique']]
        self.assertEqual(actions, ['Ouverture du dossier', 'Numérisation', 'Archivage'])

        s = self.client.get('/api/archives/dossiers/stats/').data
        self.assertEqual((s['total'], s['archives'], s['pieces']), (1, 1, 2))

    def test_format_refuse_et_suppression_reservee_au_chef(self):
        did = self._dossier().data['id']
        exe = SimpleUploadedFile('virus.exe', b'MZ', content_type='application/octet-stream')
        r = self.client.post(f'/api/archives/dossiers/{did}/pieces/', {'fichiers': [exe]}, format='multipart')
        self.assertEqual(r.status_code, 400)
        pdf = SimpleUploadedFile('pv.pdf', b'%PDF', content_type='application/pdf')
        pid = self.client.post(f'/api/archives/dossiers/{did}/pieces/', {'fichiers': [pdf]}, format='multipart').data[0]['id']
        self.assertEqual(self.client.delete(f'/api/archives/dossiers/{did}/pieces/{pid}/').status_code, 403)
        self.client.force_authenticate(self.chef)
        self.assertEqual(self.client.delete(f'/api/archives/dossiers/{did}/pieces/{pid}/').status_code, 204)

    def test_cloture_et_reouverture(self):
        did = self._dossier().data['id']
        r = self.client.post(f'/api/archives/dossiers/{did}/cloturer/')
        self.assertEqual((r.data['statut'], bool(r.data['date_cloture'])), ('clos', True))
        r = self.client.post(f'/api/archives/dossiers/{did}/rouvrir/')
        self.assertEqual((r.data['statut'], r.data['date_cloture']), ('actif', None))
        self.assertEqual(self.client.get('/api/archives/dossiers/juges/').data[0]['id'], self.juge.id)
