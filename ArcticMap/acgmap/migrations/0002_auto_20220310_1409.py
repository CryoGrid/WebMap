# Generated by Django 3.2.8 on 2022-03-10 13:09

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('acgmap', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='date',
            old_name='time',
            new_name='year',
        ),
        migrations.RemoveField(
            model_name='forcingdata',
            name='precipitation',
        ),
    ]