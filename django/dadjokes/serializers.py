# File: serializers.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 4/2/2026
# Description: The serializers for the dad jokes app and the API endpoints

from rest_framework import serializers
from .models import Joke, Picture

class JokeSerializer(serializers.ModelSerializer):
    ''' serializer class to convert an article from django model instance to JSON for API '''
    
    # Defining the fields of the JokeSerializer
    class Meta:
        model = Joke
        fields = ['id', 'text', 'contributor', 'timestamp']

    # Defining the create method for the JokeSerializer
    # You should only be able to create a joke, not update a joke
    def create(self, validated_data):
        ''' create and return a new Joke instance given the validated data '''
        return Joke.objects.create(**validated_data) # creating a new Joke instance with the validated data


class PictureSerializer(serializers.ModelSerializer):
    ''' serializer class to convert an article from django model instance to JSON for API '''

    # Defining the fields of the PictureSerializer
    class Meta:
        model = Picture
        fields = ['id', 'image_url', 'contributor', 'timestamp']

    # Defining the create method for the PictureSerializer
    # You should only be able to create a picture, not update a picture
    def create(self, validated_data):
        ''' create and return a new Picture instance given the validated data '''
        return Picture.objects.create(**validated_data) # creating a new Picture instance with the validated data