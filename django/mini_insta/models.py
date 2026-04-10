# File: models.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 2/11/2026
# Description: The models file for the mini instagram app
# Creating the models for the mini instagram app

from django.db import models
from django.urls import reverse
from django.contrib.auth.models import User # importing the User model for authentication

# Create your models here.
class Profile(models.Model):
    ''' models the data attributes of an individual user '''

    # Defining the data attributes of the Profile model
    username = models.TextField()
    display_name = models.TextField()
    profile_image_url = models.URLField(blank=True)
    bio_text = models.TextField()
    join_date = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE) # adding to the Profile model to link it to the User model

    def __str__(self):
        ''' returns a string representation of the Profile model '''
        return f'{self.username}'

    def get_all_posts(self):
        ''' returns all posts for a profile '''
        return Post.objects.filter(profile=self).order_by('timestamp')

    def get_absolute_url(self):
        ''' returns the absolute url for a profile '''
        return reverse('show_profile', kwargs={'pk': self.pk})

    def get_followers(self):
        ''' returns a list of the followers' Profiles'''
        return [f.follower_profile for f in Follow.objects.filter(profile=self)] # list comprehension of follower_profile objects from the Follow object

    def get_num_followers(self):
        ''' returns the number of followers for a profile '''
        return len(self.get_followers())

    def get_following(self):
        ''' returns a list of the profiles that the profile follows '''
        return [f.profile for f in Follow.objects.filter(follower_profile=self)] # list comprehension of profile objects from the Follow object

    def get_num_following(self):
        ''' returns the number of profiles that the profile follows '''
        return len(self.get_following())

    def get_post_feed(self):
        ''' returns a QuerySet of Posts from profiles that this profile follows '''
        following = self.get_following()
        return Post.objects.filter(profile__in=following)

class Post(models.Model):
    ''' models the data attributes of a post '''

    # Defining the data attributes of the Post model
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    caption = models.TextField()
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        ''' returns a string representation of the Post model '''
        return f'{self.caption}'

    def get_all_photos(self):
        ''' returns all photos for a post '''
        return Photo.objects.filter(post=self)

    #def get_absolute_url(self):
    #    ''' returns the absolute url for a post '''
    #    return reverse('show_post', kwargs={'pk': self.pk})

    def get_all_comments(self):
        ''' returns all comments for a post '''
        return Comment.objects.filter(post=self)

    def get_likes(self): 
        ''' returns all likes for a post '''
        return Like.objects.filter(post=self)


class Photo(models.Model):
    ''' models the data attributes of a photo '''

    # Defining the data attributes of the Photo model
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    image_url = models.URLField(blank=True)
    image_file = models.ImageField( blank=True) # new field for the image file
    timestamp = models.DateTimeField(auto_now=True)

    def get_image_url(self):
        ''' returns the image url for a photo '''
        if self.image_file:
            return self.image_file.url
        else:
            return self.image_url

    def __str__(self):
        ''' returns a string representation of the Photo model '''
        return f'{self.get_image_url()}'


class Follow(models.Model):
    ''' models the data attributes of a follow '''

    # profile is who isbeing followed; follower_profile is the follower
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='profile')
    follower_profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='follower_profile')
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        ''' returns a string representation of the Follow model '''    
        return f'{self.follower_profile} follows {self.profile}'

class Comment(models.Model):
    ''' models the data attributes of a comment '''

    # Defining the data attributes of the Comment model
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        ''' returns a string representation of the Comment model '''
        return f'{self.text}'

class Like(models.Model):
    ''' models the data attributes of a like '''

    # Defining the data attributes of the Like model
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now=True)

    def __str__(self):
        ''' returns a string representation of the Like model '''
        return f'{self.profile} likes {self.post}'