"""
SunuTribunal — Seed Script
Run: python seed.py
Populates database with initial tribunaux, test users
"""
import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sunutribunal.settings')
django.setup()

from apps.rdv.models import Tribunal
from apps.accounts.models import User


def seed_tribunaux():
    tribunaux = [
        {
            'nom': 'TGI Dakar - Plateau',
            'adresse': 'Avenue Leopold Sedar Senghor, Dakar',
            'telephone': '+221 33 889 10 00',
            'email': 'tgi.dakar@justice.sn',
            'latitude': 14.697900,
            'longitude': -17.438000,
            'heures_ouverture': 'Lun-Ven 08h-17h',
        },
        {
            'nom': 'Tribunal de Commerce de Dakar',
            'adresse': 'Rue Carnot, Dakar Plateau',
            'telephone': '+221 33 823 24 10',
            'email': 'commerce.dakar@justice.sn',
            'latitude': 14.693800,
            'longitude': -17.440000,
            'heures_ouverture': 'Lun-Ven 08h-17h',
        },
        {
            'nom': 'Tribunal Regional de Pikine',
            'adresse': 'Route de Pikine, Dakar',
            'telephone': '+221 33 834 07 52',
            'email': 'pikine@justice.sn',
            'latitude': 14.752200,
            'longitude': -17.392000,
            'heures_ouverture': 'Lun-Ven 08h-16h',
        },
        {
            'nom': 'Tribunal Regional de Saint-Louis',
            'adresse': 'Centre-ville, Saint-Louis',
            'telephone': '+221 33 961 14 00',
            'email': 'saintlouis@justice.sn',
            'latitude': 16.017900,
            'longitude': -16.489700,
            'heures_ouverture': 'Lun-Ven 08h-17h',
        },
        {
            'nom': 'Tribunal Regional de Thies',
            'adresse': 'Quartier Randoulene, Thies',
            'telephone': '+221 33 951 10 23',
            'email': 'thies@justice.sn',
            'latitude': 14.791700,
            'longitude': -16.926100,
            'heures_ouverture': 'Lun-Ven 08h-17h',
        },
    ]

    for t in tribunaux:
        obj, created = Tribunal.objects.get_or_create(nom=t['nom'], defaults=t)
        print(f"{'[CREATED]' if created else '[EXISTS] '} {obj.nom}")

    print(f"\n{Tribunal.objects.count()} tribunaux in database")


def seed_users():
    users = [
        {
            'email': 'citoyen@demo.sn',
            'password': 'demo1234',
            'nom': 'Diallo',
            'prenom': 'Abdoulaye',
            'telephone': '+221771234567',
            'cni': '1234567890123',
            'role': 'citoyen',
        },
        {
            'email': 'admin@tgi-dakar.sn',
            'password': 'admin1234',
            'nom': 'Diallo',
            'prenom': 'Mamadou',
            'role': 'admin',
            'is_staff': True,
        },
        {
            'email': 'juge@tgi-dakar.sn',
            'password': 'juge1234',
            'nom': 'Sarr',
            'prenom': 'Aminata',
            'role': 'juge',
        },
    ]

    tgi = Tribunal.objects.filter(nom__icontains='TGI Dakar').first()

    for u in users:
        password = u.pop('password')
        is_staff = u.pop('is_staff', False)
        obj, created = User.objects.get_or_create(email=u['email'], defaults=u)
        if created:
            obj.set_password(password)
            obj.is_staff = is_staff
            obj.is_verified = True
            if u.get('role') in ('admin', 'juge') and tgi:
                obj.tribunal = tgi
            obj.save()
        print(f"{'[CREATED]' if created else '[EXISTS] '} {obj.email} ({obj.role})")


if __name__ == '__main__':
    print('=== SunuTribunal Seed Script ===\n')
    print('--- Tribunaux ---')
    seed_tribunaux()
    print('\n--- Users ---')
    seed_users()
    print('\n=== Seed completed! ===')
    print('\nDemo accounts:')
    print('  Citoyen: citoyen@demo.sn / demo1234')
    print('  Admin:   admin@tgi-dakar.sn / admin1234')
    print('  Juge:    juge@tgi-dakar.sn / juge1234')
