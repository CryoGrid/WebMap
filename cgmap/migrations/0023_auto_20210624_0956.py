# Generated by Django 3.2 on 2021-06-24 07:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cgmap', '0022_auto_20210622_1353'),
    ]

    operations = [
        migrations.CreateModel(
            name='Date',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(default=None)),
            ],
        ),
    ]
