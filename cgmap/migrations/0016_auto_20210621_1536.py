# Generated by Django 3.2 on 2021-06-21 13:36

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cgmap', '0015_auto_20210603_1527'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cryogriddata',
            name='alt',
            field=models.DecimalField(decimal_places=6, default=None, max_digits=9),
        ),
        migrations.AlterField(
            model_name='cryogriddata',
            name='name',
            field=models.CharField(default=None, max_length=50),
        ),
        migrations.AlterField(
            model_name='cryogriddata',
            name='time',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.DateTimeField(), default=None, size=None),
        ),
        migrations.AlterField(
            model_name='cryogriddata',
            name='tsoil',
            field=django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.ArrayField(base_field=models.DecimalField(decimal_places=3, default=None, max_digits=6), size=None), default=None, size=None),
        ),
        migrations.AlterField(
            model_name='cryogriddata',
            name='z_level',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.BigIntegerField(), default=None, size=None),
        ),
        migrations.AlterField(
            model_name='forcingdata',
            name='tair',
            field=django.contrib.postgres.fields.ArrayField(base_field=django.contrib.postgres.fields.ArrayField(base_field=models.DecimalField(decimal_places=3, default=None, max_digits=6), size=None), default=None, size=None),
        ),
        migrations.AlterField(
            model_name='forcingdata',
            name='name',
            field=models.CharField(max_length=50),
        ),
    ]