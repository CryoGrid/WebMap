# Generated by Django 3.2 on 2021-08-16 13:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cgmap', '0025_remove_cryogriddata_time'),
    ]

    operations = [
        migrations.CreateModel(
            name='TemperatureDepthLevel',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
            ],
            options={
                'db_table': 'temperature_depth_level',
                'managed': False,
            },
        ),
    ]
