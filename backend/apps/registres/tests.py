"""python manage.py test apps.registres"""
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.rdv.models import Tribunal
from apps.registres.models import Courrier, Compteur, ParametreJuridiction, code_juridiction


class RegistreCourrierTests(APITestCase):

    def setUp(self):
        self.tribunal = Tribunal.objects.create(nom="Tribunal d'instance de Dakar", adresse='Dakar')
        self.agent = User.objects.create_user('courrier@test.sn', 'motdepasse123', nom='Ndiaye',
                                              role='courrier', tribunal=self.tribunal)
        self.citoyen = User.objects.create_user('c@test.sn', 'motdepasse123', nom='Ba')
        self.client.force_authenticate(self.agent)

    def _creer(self, **kw):
        data = {'sens': 'arrivee', 'registre': 'civil', 'date_courrier': '2026-09-20',
                'correspondant': 'Cabinet Me Diop', 'objet': 'Transmission de conclusions'}
        data.update(kw)
        return self.client.post('/api/registres/courriers/', data, format='json')

    def test_code_juridiction(self):
        self.assertEqual(code_juridiction(self.tribunal), 'TID')
        ParametreJuridiction.objects.create(tribunal=self.tribunal, code='tidk')
        self.assertEqual(code_juridiction(self.tribunal), 'TIDK')

    def test_numerotation_sequentielle_par_sens(self):
        r1 = self._creer(); r2 = self._creer(); r3 = self._creer(sens='depart', correspondant='Parquet')
        self.assertEqual(r1.status_code, 201, r1.data)
        annee = r1.data['numero'].split('/')[1]
        self.assertEqual(r1.data['numero'], f'CA-00001/{annee}/TID')
        self.assertEqual(r2.data['numero'], f'CA-00002/{annee}/TID')
        self.assertEqual(r3.data['numero'], f'CD-00001/{annee}/TID')
        self.assertEqual(Compteur.objects.get(registre='CA').dernier, 2)

    def test_circuit_transmission_complet(self):
        cid = self._creer().data['id']
        r = self.client.post(f'/api/registres/courriers/{cid}/transmettre/',
                             {'service_destination': 'greffe_civil', 'commentaire': 'Urgent'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data['statut'], 'transmis')
        self.assertEqual(r.data['service_actuel'], 'greffe_civil')
        self.assertEqual(self.client.post(f'/api/registres/courriers/{cid}/accuser_reception/').data['statut'], 'recu')
        self.assertEqual(self.client.post(f'/api/registres/courriers/{cid}/traiter/').data['statut'], 'traite')
        r = self.client.post(f'/api/registres/courriers/{cid}/archiver/')
        self.assertEqual(r.data['statut'], 'archive')
        actions = [t['action'] for t in r.data['transmissions']]
        self.assertEqual(actions, ['enregistrement', 'transmission', 'reception', 'traitement', 'archivage'])
        # un courrier archivé ne circule plus
        r = self.client.post(f'/api/registres/courriers/{cid}/transmettre/', {'service_destination': 'parquet'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_regles_metier(self):
        cid = self._creer().data['id']
        self.assertEqual(self.client.post(f'/api/registres/courriers/{cid}/accuser_reception/').status_code, 400)
        self.assertEqual(self.client.post(f'/api/registres/courriers/{cid}/expedier/').status_code, 400)
        r = self.client.post(f'/api/registres/courriers/{cid}/transmettre/', {'service_destination': 'nimporte'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_recherche_stats_export(self):
        self._creer(objet='Demande de copie de jugement', reference_externe='REF-77')
        self._creer(sens='depart', objet='Convocation', priorite='urgente')
        self.assertEqual(len(self.client.get('/api/registres/courriers/?q=jugement').data), 1)
        self.assertEqual(len(self.client.get('/api/registres/courriers/?q=REF-77').data), 1)
        self.assertEqual(len(self.client.get('/api/registres/courriers/?sens=depart').data), 1)
        s = self.client.get('/api/registres/courriers/stats/').data
        self.assertEqual((s['total'], s['arrivees'], s['departs'], s['urgents_ouverts']), (2, 1, 1, 1))
        r = self.client.get('/api/registres/courriers/export/')
        self.assertEqual(r.status_code, 200)
        self.assertIn('Demande de copie de jugement', r.content.decode('utf-8'))
        self.assertEqual(len(self.client.get('/api/registres/transmissions/').data), 2)

    def test_citoyen_interdit(self):
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.get('/api/registres/courriers/').status_code, 403)
