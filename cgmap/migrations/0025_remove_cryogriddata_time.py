# Generated by Django 3.2 on 2021-07-19 09:48
import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cgmap', '0024_auto_20210624_0959'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cryogriddata',
            name='time',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.DateTimeField(), default=None, size=None),
        ),
    ]
