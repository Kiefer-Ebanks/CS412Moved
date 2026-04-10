# File: urls.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 3/19/2026
# Description: The urls file for the voter analytics app
# Creating the url paths for the voter analytics app

from django.urls import path
from django.conf import settings
from . import views

# Creating the url paths for the voter analytics app
urlpatterns = [
    path(r'', views.VoterListView.as_view(), name='home'), # URL pattern for the view to display a list of all voters in the database
    path(r'voters', views.VoterListView.as_view(), name='voters'), # URL pattern for the view to display a list of all voters in the database
    path(r'voter/<int:pk>', views.VoterDetailView.as_view(), name='voter'), # URL pattern for the view to display a single voter in the database
    path(r'graphs/', views.GraphsView.as_view(), name='graphs'), # URL pattern for the view to display the graphs from plotly
]