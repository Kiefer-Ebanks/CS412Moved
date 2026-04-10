# File: views.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 4/2/2026
# Description: The views for the dad jokes app and the API endpoints

from django.views.generic import ListView, DetailView
from django.shortcuts import get_object_or_404
from .models import Joke, Picture
import random

# Importing the generics class from the rest_framework
# Importing the JokeSerializer and PictureSerializer from the serializers.py file
from rest_framework import generics
from .serializers import JokeSerializer, PictureSerializer


class RandomView(DetailView):
    ''' DetailView for Joke: URL may include pk (DB lookup) or omit it (random joke). '''

    model = Joke
    template_name = 'dadjokes/random.html'
    context_object_name = 'joke'

    def get_object(self, queryset=None):
        qs = self.get_queryset() if queryset is None else queryset
        pk = self.kwargs.get(self.pk_url_kwarg)
        if pk is not None:
            return get_object_or_404(qs, pk=pk)
        return random.choice(list(qs))

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['picture'] = random.choice(list(Picture.objects.all()))
        return context

class DadJokesListView(ListView):
    ''' A ListView that displays a list of all dad jokes '''
    model = Joke
    template_name = 'dadjokes/jokes.html'
    context_object_name = 'jokes'

class DadJokeDetailView(DetailView):
    ''' Displays the Joke whose primary key matches the pk in the URL'''
    model = Joke
    template_name = 'dadjokes/one_joke.html'
    context_object_name = 'joke'

class PicturesListView(ListView):
    ''' A ListView that displays a list of all pictures '''

    model = Picture
    template_name = 'dadjokes/pictures.html'
    context_object_name = 'pictures'

class PictureDetailView(DetailView):
    ''' A DetailView that displays a single picture '''

    model = Picture
    template_name = 'dadjokes/one_picture.html'
    context_object_name = 'picture'




# API Views

class JokeListAPIView(generics.ListCreateAPIView):
    ''' API View to return a list of Jokes and create a new joke '''

    queryset = Joke.objects.all()
    serializer_class = JokeSerializer

class JokeDetailAPIView(generics.RetrieveDestroyAPIView):
    ''' API View to return a single Joke '''

    queryset = Joke.objects.all()
    serializer_class = JokeSerializer

class PictureListAPIView(generics.ListAPIView):
    ''' API View to return a list of Pictures '''

    queryset = Picture.objects.all()
    serializer_class = PictureSerializer

class PictureDetailAPIView(generics.RetrieveDestroyAPIView):
    ''' API View to return a single Picture '''

    queryset = Picture.objects.all()
    serializer_class = PictureSerializer

class RandomJokeAPIView(generics.RetrieveAPIView):
    ''' GET requests return one joke at random '''

    queryset = Joke.objects.all()
    serializer_class = JokeSerializer

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        obj = random.choice(list(queryset))
        return obj


class RandomPictureAPIView(generics.RetrieveAPIView):
    ''' GET requests return one picture at random '''

    queryset = Picture.objects.all()
    serializer_class = PictureSerializer

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        obj = random.choice(list(queryset))
        return obj