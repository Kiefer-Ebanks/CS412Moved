# File: forms.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 2/20/2026
# Description: The forms file for the mini instagram app
# Creating the forms for the mini instagram app

from django import forms
from .models import *

class CreatePostForm(forms.ModelForm):
    ''' A form to create a new post '''

    class Meta:
        model = Post
        fields = ['caption']


class CreateProfileForm(forms.ModelForm):
    ''' A form to create a new profile (username, display_name, bio_text, profile_image_url). User is set in the view. '''

    class Meta:
        model = Profile
        fields = ['username', 'display_name', 'bio_text', 'profile_image_url']


class UpdateProfileForm(forms.ModelForm):
    ''' A form to update a profile '''

    class Meta:
        model = Profile
        fields = ['display_name', 'bio_text', 'profile_image_url']


class UpdatePostForm(forms.ModelForm):
    ''' A form to update a post '''

    class Meta:
        model = Post
        fields = ['caption']