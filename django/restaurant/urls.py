# File: urls.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 2/3/2026
# Description: The URL file for the restaurant app
# Creating the URLs for the restaurant app

from django.urls import path
from django.conf import settings
from . import views
 
 
urlpatterns = [ 
    path(r'', views.main, name="main"),
    path(r'order/', views.order, name="order"),
    path(r'confirmation/', views.confirmation, name="confirmation"),
]