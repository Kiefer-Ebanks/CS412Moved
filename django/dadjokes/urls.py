# File: urls.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 4/2/2026
# Description: The urls for the dad jokes urls including  the views for the dad jokes app and the API endpoints

from django.urls import path
from . import views

urlpatterns = [
    path('', views.RandomView.as_view(), name='home'), # URL pattern to show a random dad joke and random picture just like the random page
    path('random/', views.RandomView.as_view(), name='random'), # URL pattern for the view to display a random dad joke and random picture
    path('random/<int:pk>/', views.RandomView.as_view(), name='random_joke'), # Random page template but joke loaded by primary key
    path('jokes/', views.DadJokesListView.as_view(), name='jokes'), # URL pattern for the view to display a list of all dad jokes
    path('joke/<int:pk>/', views.DadJokeDetailView.as_view(), name='joke'), # URL pattern for the view to display a single dad joke
    path('pictures/', views.PicturesListView.as_view(), name='pictures'), # URL pattern for the view to display a list of all pictures
    path('picture/<int:pk>/', views.PictureDetailView.as_view(), name='picture'), # URL pattern for the view to display a single picture

    # API URLs
    path('api/', views.RandomJokeAPIView.as_view(), name='api'),
    path('api/random', views.RandomJokeAPIView.as_view(), name='api_random_joke'),
    path('api/jokes/', views.JokeListAPIView.as_view(), name='api_jokes'),
    path('api/jokes/<int:pk>/', views.JokeDetailAPIView.as_view(), name='api_joke'),
    path('api/pictures/', views.PictureListAPIView.as_view(), name='api_pictures'),
    path('api/pictures/<int:pk>/', views.PictureDetailAPIView.as_view(), name='api_picture'),
    path('api/random_picture/', views.RandomPictureAPIView.as_view(), name='api_random_picture'),
]