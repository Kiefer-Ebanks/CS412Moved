# File: admin.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 4/2/2026
# Description: The admin for the dad jokes app

from django.contrib import admin

# Register your models here.

from .models import Joke, Picture

admin.site.register(Joke)
admin.site.register(Picture)