# Generated by Django 3.2 on 2021-06-21 14:23

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cgmap', '0018_auto_20210621_1558'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cryogriddata',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime.now),
        ),
        migrations.AlterField(
            model_name='forcingdata',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime.now),
        ),
    ]
