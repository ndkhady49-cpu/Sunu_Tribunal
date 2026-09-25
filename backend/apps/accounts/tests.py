"""
Tests de sécurité des rôles — SunuTribunal
Lancer : python manage.py test apps.accounts
"""
import datetime
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.rdv.models import Tribunal, RendezVous


class RolesSecuriteTests(APITestCase):

    def setUp(self):
        self.tribunal = Tribunal.objects.create(nom='TGI Dakar', adresse='Dakar')
        self.citoyen = User.objects.create_user('citoyen@test.sn', 'motdepasse123', nom='Diallo')
        self.chef = User.objects.create_user('chef@test.sn', 'motdepasse123', nom='Fall',
                                             role='admin', tribunal=self.tribunal)
        self.juge = User.objects.create_user('juge@test.sn', 'motdepasse123', nom='Diop',
                                             role='juge', tribunal=self.tribunal)

    # ── Inscription publique ────────────────────────────
    def test_inscription_force_role_citoyen(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'pirate@test.sn', 'nom': 'Pirate',
            'password': 'motdepasse123', 'password2': 'motdepasse123',
            'role': 'admin',
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(User.objects.get(email='pirate@test.sn').role, 'citoyen')

    def test_me_ne_peut_pas_changer_son_role(self):
        self.client.force_authenticate(self.citoyen)
        res = self.client.patch('/api/auth/me/', {'role': 'admin', 'telephone': '770000000'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.citoyen.refresh_from_db()
        self.assertEqual(self.citoyen.role, 'citoyen')
        self.assertEqual(self.citoyen.telephone, '770000000')

    # ── Gestion du personnel ────────────────────────────
    def test_citoyen_et_juge_ne_gerent_pas_le_personnel(self):
        for u in (self.citoyen, self.juge):
            self.client.force_authenticate(u)
            self.assertEqual(self.client.get('/api/auth/staff/').status_code, 403)

    def test_chef_cree_un_greffier_qui_peut_se_connecter(self):
        self.client.force_authenticate(self.chef)
        res = self.client.post('/api/auth/staff/', {
            'email': 'greffier@test.sn', 'nom': 'Sarr', 'prenom': 'Fatou',
            'password': 'temp1234', 'role': 'greffier',
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        g = User.objects.get(email='greffier@test.sn')
        self.assertEqual(g.tribunal, self.tribunal)

        self.client.force_authenticate(None)
        res = self.client.post('/api/auth/login/', {'email': 'greffier@test.sn', 'password': 'temp1234'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['role'], 'greffier')

    def test_chef_ne_peut_pas_creer_un_citoyen_via_staff(self):
        self.client.force_authenticate(self.chef)
        res = self.client.post('/api/auth/staff/', {
            'email': 'x@test.sn', 'nom': 'X', 'password': 'temp1234', 'role': 'citoyen',
        }, format='json')
        self.assertEqual(res.status_code, 400)

    def test_desactivation_compte(self):
        self.client.force_authenticate(self.chef)
        res = self.client.patch(f'/api/auth/staff/{self.juge.id}/', {'is_active': False}, format='json')
        self.assertEqual(res.status_code, 200)
        self.juge.refresh_from_db()
        self.assertFalse(self.juge.is_active)
        # impossible de se désactiver soi-même
        res = self.client.patch(f'/api/auth/staff/{self.chef.id}/', {'is_active': False}, format='json')
        self.assertEqual(res.status_code, 400)

    # ── Actions réservées au personnel ──────────────────
    def test_citoyen_ne_valide_pas_son_propre_rdv(self):
        rdv = RendezVous.objects.create(citoyen=self.citoyen, tribunal=self.tribunal, service='civil',
                                        date=datetime.date(2026, 11, 2), heure=datetime.time(9, 0))
        self.client.force_authenticate(self.citoyen)
        self.assertEqual(self.client.post(f'/api/rdv/{rdv.id}/valider/').status_code, 403)
        self.client.force_authenticate(self.juge)
        self.assertEqual(self.client.post(f'/api/rdv/{rdv.id}/valider/').status_code, 200)

    def test_generation_courrier_reservee_au_personnel(self):
        self.client.force_authenticate(self.citoyen)
        res = self.client.post('/api/chatbot/generate-doc/', {'destinataire': 'A', 'motif': 'B'}, format='json')
        self.assertEqual(res.status_code, 403)

    def test_chatbot_accepte_un_token_expire(self):
        # Un token invalide ne doit pas provoquer de 401 sur l'assistant public
        self.client.credentials(HTTP_AUTHORIZATION='Bearer token-invalide')
        res = self.client.post('/api/chatbot/ask/', {'message': ''}, format='json')
        self.assertEqual(res.status_code, 400)  # 400 = message vide, donc pas de 401
