# File: models.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 4/2/2026
# Description: The models for the dad jokes API

from django.db import models

# Create your models here.

class Joke(models.Model):
    ''' models the data attributes of a joke '''

    # Defining the data attributes of the Joke model
    text = models.TextField()
    contributor = models.TextField()
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        ''' returns a string representation of the Joke model '''
        return f'{self.text}'


class Picture(models.Model):
    ''' models the data attributes of a picture '''

    # Defining the data attributes of the Picture model
    image_url = models.URLField(blank=True)
    contributor = models.TextField()
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        ''' returns a string representation of the Picture model '''
        return f'{self.image_url}'


def load_data():
    ''' function to load the dad jokes dataset into the database using the Joke and Picture models '''

    joke1 = Joke(text='What do you call a sheep who can sing and dance? Lady Ba Ba.', contributor='Kiefer Ebanks')
    joke2 = Joke(text='Why can\'t dinosaurs clap their hands? Because they\'re extinct.', contributor='Kiefer Ebanks')
    joke3 = Joke(text='Dogs can\'t operate MRI machines. But catscan', contributor='Kiefer Ebanks')
    joke4 = Joke(text='Which vegetable has the best kung fu? Broc-lee', contributor='Kiefer Ebanks')
    joke5 = Joke(text='I was going to try an all almond diet, but that\'s just nuts', contributor='Kiefer Ebanks')
    joke1.save()
    joke2.save()
    joke3.save()
    joke4.save()
    joke5.save()

    picture1 = Picture(image_url='https://media-cldnry.s-nbcnews.com/image/upload/t_fit-760w,f_auto,q_auto:best/rockcms/2025-12/dad-jokes-swl-251209-35-d7f0f2.jpg', contributor='Kiefer Ebanks')
    picture2 = Picture(image_url='https://hips.hearstapps.com/hmg-prod/images/dad-jokes-for-kids-setup-punchline-1650571379.png?crop=1.00xw:0.668xh;0,0.157xh&resize=980:*', contributor='Kiefer Ebanks')
    picture3 = Picture(image_url='https://media-cldnry.s-nbcnews.com/image/upload/t_fit-760w,f_auto,q_auto:best/rockcms/2025-12/dad-jokes-swl-251209-36-f2968a.jpg', contributor='Kiefer Ebanks')
    picture4 = Picture(image_url='https://hips.hearstapps.com/hmg-prod/images/toad-joke-67ab6f70d79e8.jpg?resize=980:*', contributor='Kiefer Ebanks')
    picture5 = Picture(image_url='https://static.boredpanda.com/blog/wp-content/uploads/2023/11/funny-dad-jokes-puns-50-654ce60e259fd__700.jpg', contributor='Kiefer Ebanks')
    picture1.save()
    picture2.save()
    picture3.save()
    picture4.save()
    picture5.save()
