# Generated by Django 3.2.8 on 2022-03-02 11:50

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cgmap', '0029_auto_20220216_1154'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cryogriddata',
            name='tsoil',
            field=django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.ArrayField(base_field=models.DecimalField(decimal_places=3, default=None, max_digits=9), size=None), default=None, size=None),
        ),
        migrations.AlterField(
            model_name='forcingdata',
            name='tair',
            field=django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.ArrayField(base_field=models.DecimalField(decimal_places=3, default=None, max_digits=9), size=None), default=None, size=None),
        ),
    ]