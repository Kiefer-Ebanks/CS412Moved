from django.contrib import admin

# Register your models here.

# Importing the Profile model from the models.py file
from .models import Profile
from .models import Post
from .models import Photo
from .models import Follow
from .models import Comment
from .models import Like
# Registering the Profile model with the admin site
admin.site.register(Profile)

# Registering the Post, Photo, Follow, Comment, and Like models with the admin site
admin.site.register(Post)
admin.site.register(Photo)
admin.site.register(Follow)
admin.site.register(Comment)
admin.site.register(Like)