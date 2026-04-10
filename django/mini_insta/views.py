from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse # Importing the reverse function to redirect to the profile page
from django.http import Http404 # Importing the Http404 class to raise a 404 error if the profile does not exist
from django.db.models import Q # Importing the Q object to filter the profiles and posts

from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView, TemplateView, View  # Generic views
from .models import Profile, Post, Photo, Follow, Like  # Importing models from models.py
from .forms import CreatePostForm, UpdatePostForm, CreateProfileForm # Importing forms from forms.py
from .forms import UpdateProfileForm # Importing the UpdateProfileForm from the forms.py file
from django.urls import reverse # Importing the reverse function to redirect to the profile page

from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin  # Will use to ensure a user is logged in in order to view the page
from django.contrib.auth.views import LogoutView # Will use to log out the user and redirect to the logged out page
from django.contrib.auth import login
from django.contrib.auth.forms import UserCreationForm


# Create your views here.

def get_profile_for_user(user):
    ''' helper function to return the Profile for the given User. Handles 0 or multiple profiles.'''
    profile = Profile.objects.filter(user=user).order_by('pk').first()
    if profile is None:
        raise Http404("No profile found for this user.")
    return profile


class myLoginRequiredMixin(LoginRequiredMixin):
    ''' A custom login required mixin that redirects to the login page if the user is not logged in '''

    def get_login_url(self):
        ''' Redirect to the login page '''
        return reverse('login') # redirect to the login view


class ProfileOwnerTestMixin(UserPassesTestMixin):
    ''' Only the user associated with the Profile (from URL pk) may pass. Using for profile-scoped views. '''

    def test_func(self):
        try:
            profile = Profile.objects.get(pk=self.kwargs['pk'])
        except Profile.DoesNotExist:
            return False
        return profile.user == self.request.user


class PostOwnerTestMixin(UserPassesTestMixin):
    ''' Only the user associated with the Post's Profile may pass. Use for post update/delete views. '''

    def test_func(self):
        try:
            post = Post.objects.get(pk=self.kwargs['pk'])
        except Post.DoesNotExist:
            return False
        return post.profile.user == self.request.user


class ProfileListView(ListView):
    ''' A view to display a list of all profiles '''
    model = Profile
    template_name = 'mini_insta/show_all_profiles.html'
    context_object_name = 'profiles' # using plural variable name for the profiles list


class CreateProfileView(CreateView):
    ''' Register: create a Django User and a Profile in one step. User is assigned to the profile in the view. '''

    model = Profile
    form_class = CreateProfileForm
    template_name = 'mini_insta/create_profile_form.html'
    context_object_name = 'profile'

    def get_context_data(self, **kwargs):
        ''' Add the UserCreationForm to context so the template can show both forms. '''
        context = super().get_context_data(**kwargs)
        context['user_form'] = kwargs.get('user_form') or UserCreationForm(
            self.request.POST if self.request.method == 'POST' else None
        )
        return context

    def form_valid(self, form):
        ''' Create User from UserCreationForm, log them in, attach User to Profile, then save Profile. '''
        user_form = UserCreationForm(self.request.POST)
        user = user_form.save()
        login(self.request, user, backend='django.contrib.auth.backends.ModelBackend')
        form.instance.user = user
        return super().form_valid(form)

    def get_success_url(self):
        return reverse('show_my_profile')

    def post(self, request, *args, **kwargs):
        ''' Validate both forms; if valid, call form_valid to create User, log in, and save Profile. '''
        user_form = UserCreationForm(request.POST)
        form = CreateProfileForm(request.POST)
        if user_form.is_valid() and form.is_valid():
            return self.form_valid(form)
        context = self.get_context_data(user_form=user_form)
        context['form'] = form
        return self.render_to_response(context)


class ProfileDetailView(DetailView):
    ''' A view to display a single profile (by URL pk). '''

    model = Profile
    template_name = 'mini_insta/show_profile.html'
    context_object_name = 'profile' # using singular variable name for the profile object

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        profile = self.object
        context['is_own_profile'] = False
        context['already_follows'] = False
        if self.request.user.is_authenticated:
            my_profile = Profile.objects.filter(user=self.request.user).order_by('pk').first()
            if my_profile:
                context['is_own_profile'] = (my_profile == profile)
                if not context['is_own_profile']:
                    context['already_follows'] = Follow.objects.filter(profile=profile, follower_profile=my_profile).exists()
        return context


class MyProfileDetailView(myLoginRequiredMixin, DetailView):
    ''' A view to display the logged-in user's own profile (no pk in URL). '''

    model = Profile
    template_name = 'mini_insta/show_profile.html'
    context_object_name = 'profile'

    def get_object(self, queryset=None):
        ''' Use the logged-in user to find and return their Profile. '''
        return get_profile_for_user(self.request.user)


class PostDetailView(DetailView):
    ''' A view to display a single post '''

    model = Post
    template_name = 'mini_insta/show_post.html'
    context_object_name = 'post' # using singular variable name for the post object

    def get_context_data(self, **kwargs):
        ''' Add profile, is_own_post, user_likes_post to context '''
        context = super().get_context_data(**kwargs)
        post = self.object
        context['profile'] = post.profile
        context['is_own_post'] = False
        context['user_likes_post'] = False
        if self.request.user.is_authenticated:
            my_profile = Profile.objects.filter(user=self.request.user).order_by('pk').first()
            if my_profile:
                context['is_own_post'] = (post.profile == my_profile)
                if not context['is_own_post']:
                    context['user_likes_post'] = Like.objects.filter(post=post, profile=my_profile).exists()
        return context


class CreatePostView(myLoginRequiredMixin, CreateView):
    ''' A view to create a new post for the logged-in user's profile '''

    model = Post
    form_class = CreatePostForm
    template_name = 'mini_insta/create_post_form.html'
    context_object_name = 'post' # using singular variable name for the post object
    
    def get_context_data(self, **kwargs):
        ''' Add profile object to context (current user's profile) '''
        context = super().get_context_data(**kwargs) # getting the context dictionary from the parent class
        profile = get_profile_for_user(self.request.user)
        context['profile'] = profile # adding the profile object to the context
        return context

    def form_valid(self, form):
        ''' Add profile object to post and create the photo object if provided '''

# finding the logged in user
        user = self.request.user
        # now attaching that user to the post (the form instance)
        form.instance.user = user

        profile = get_profile_for_user(self.request.user)
        form.instance.profile = profile # Add the profile object to the post instance
        
        post = form.save() # save the post so it has a pk in the database
        
        # Commenting out the previous image_url code for now to focus on the image_file code
        # image_url = self.request.POST.get('image_url', '') # getting the image_url from the POST request
        
        # if image_url:
        #     Photo.objects.create(post=post, image_url=image_url) # create a new Photo object with the saved post as the foreign key

        # Read the data from self.request.FILES
        files = self.request.FILES.getlist('files')
        for file in files:
            Photo.objects.create(post=post, image_file=file) # create a new Photo object for each file with the saved post as the foreign key

        return super().form_valid(form) # delegate work to the super class of the form_valid method

    def get_success_url(self):
        ''' Redirect to the profile page '''
        return reverse('show_post', kwargs={'pk': self.object.pk}) # redirect to the show_post view with the pk of the post that was just created

    def get_login_url(self):
        ''' Redirect to the login page '''
        return reverse('login') # redirect to the login view


class UpdateProfileView(myLoginRequiredMixin, UpdateView):
    ''' A view to update the logged-in user's profile '''

    model = Profile
    form_class = UpdateProfileForm
    template_name = 'mini_insta/update_profile_form.html'
    context_object_name = 'profile' # using singular variable name for the profile object

    def get_object(self, queryset=None):
        ''' Return the current user's profile (no pk in URL). Handles multiple profiles per user. '''
        return get_profile_for_user(self.request.user)

class DeletePostView(myLoginRequiredMixin, PostOwnerTestMixin, DeleteView):
    ''' A view to delete a post '''

    model = Post
    template_name = 'mini_insta/delete_post_form.html'
    context_object_name = 'post' # using singular variable name for the post object

    def get_context_data(self, **kwargs):
        ''' Add profile object to context based on this post '''
        context = super().get_context_data(**kwargs)
        post = self.object
        context['profile'] = post.profile
        return context

    def get_success_url(self):
        ''' Redirect to the profile page '''
        return reverse('show_profile', kwargs={'pk': self.object.profile.pk}) # redirect to the show_profile view with the pk of the profile that the post belongs to


class UpdatePostView(myLoginRequiredMixin, PostOwnerTestMixin, UpdateView):
    ''' A view to update a post '''

    model = Post
    form_class = UpdatePostForm
    template_name = 'mini_insta/update_post_form.html'
    context_object_name = 'post' # using singular variable name for the post object

    def get_context_data(self, **kwargs):
        ''' Add profile object to context based on this post '''
        context = super().get_context_data(**kwargs)
        post = self.object
        context['profile'] = post.profile
        return context

    def get_success_url(self):
        ''' Redirect to the post page '''
        return reverse('show_post', kwargs={'pk': self.object.pk}) # redirect to the show_post view with the pk of the post that was just updated


class ShowFollowersDetailView(DetailView):
    ''' A view to display the followers of a profile '''

    model = Profile
    template_name = 'mini_insta/show_followers.html'
    context_object_name = 'profile' # using singular variable name for the profile object

    def get_context_data(self, **kwargs):
        ''' Add followers to context '''
        context = super().get_context_data(**kwargs)
        profile = self.object
        context['followers'] = profile.get_followers()
        return context


class ShowFollowingDetailView(DetailView):
    ''' A view to display the profiles that a profile follows '''

    model = Profile
    template_name = 'mini_insta/show_following.html'
    context_object_name = 'profile' # using singular variable name for the profile object

    def get_context_data(self, **kwargs):
        ''' Add following to context '''
        context = super().get_context_data(**kwargs)
        profile = self.object
        context['following'] = profile.get_following()
        return context


class PostFeedListView(myLoginRequiredMixin, ListView):
    ''' A ListView that displays the post feed for the logged-in user's profile '''

    model = Post
    template_name = 'mini_insta/show_feed.html'
    context_object_name = 'post_feed'

    def get_queryset(self):
        ''' Return posts from profiles that this profile follows '''
        profile = get_profile_for_user(self.request.user)
        return profile.get_post_feed()

    def get_context_data(self, **kwargs):
        ''' Add profile to context for the feed heading '''
        context = super().get_context_data(**kwargs)
        context['profile'] = get_profile_for_user(self.request.user)
        return context


class SearchView(myLoginRequiredMixin, ListView):
    ''' A ListView for search results (Profiles and Posts). Search is done on behalf of the logged-in user's profile. '''

    template_name = 'mini_insta/search_results.html'
    context_object_name = 'object_list'

    def dispatch(self, request, *args, **kwargs):
        ''' If query is absent from GET, show the search form; otherwise run the ListView. '''

        if 'query' not in self.request.GET:
            profile = get_profile_for_user(self.request.user)
            return render(request, 'mini_insta/search.html', {'profile': profile})

        return super().dispatch(request, *args, **kwargs) # delegate work to the super class of the dispatch method

    def get_queryset(self):
        ''' Return Posts whose caption contains the search query. '''

        query = self.request.GET['query'].strip() # get the search query from the GET request
        return Post.objects.filter(caption__icontains=query) # return posts whose caption contains the search query

    def get_context_data(self, **kwargs):
        ''' Add profile, query, matching posts, and matching profiles to context. '''

        context = super().get_context_data(**kwargs)
        profile = get_profile_for_user(self.request.user)
        query = self.request.GET['query'].strip() # get the search query from the GET request
        context['profile'] = profile
        context['query'] = query
        context['posts'] = self.get_queryset()
        context['profiles'] = Profile.objects.filter(
            Q(username__icontains=query) |
            Q(display_name__icontains=query) |
            Q(bio_text__icontains=query)
        )
        return context


class FollowView(myLoginRequiredMixin, View):
    ''' Logged-in user follows the profile specified by pk. Redirects back to that profile. '''

    def get(self, request, *args, **kwargs):
        my_profile = get_profile_for_user(request.user)
        other_profile = get_object_or_404(Profile, pk=kwargs['pk'])
        if my_profile != other_profile and not Follow.objects.filter(profile=other_profile, follower_profile=my_profile).exists():
            Follow.objects.create(profile=other_profile, follower_profile=my_profile)
        return redirect('show_profile', pk=other_profile.pk)


class DeleteFollowView(myLoginRequiredMixin, View):
    ''' Logged-in user unfollows the profile specified by pk. Redirects back to that profile. '''

    def get(self, request, *args, **kwargs):
        my_profile = get_profile_for_user(request.user)
        other_profile = get_object_or_404(Profile, pk=kwargs['pk'])
        Follow.objects.filter(profile=other_profile, follower_profile=my_profile).delete()
        return redirect('show_profile', pk=other_profile.pk)


class LikeView(myLoginRequiredMixin, View):
    ''' Logged-in user likes the post specified by pk. Redirects back to that post. '''

    def get(self, request, *args, **kwargs):
        my_profile = get_profile_for_user(request.user)
        post = get_object_or_404(Post, pk=kwargs['pk'])
        if post.profile != my_profile and not Like.objects.filter(post=post, profile=my_profile).exists():
            Like.objects.create(post=post, profile=my_profile)
        return redirect('show_post', pk=post.pk)


class DeleteLikeView(myLoginRequiredMixin, View):
    ''' Logged-in user unlikes the post specified by pk. Redirects back to that post. '''

    def get(self, request, *args, **kwargs):
        my_profile = get_profile_for_user(request.user)
        post = get_object_or_404(Post, pk=kwargs['pk'])
        Like.objects.filter(post=post, profile=my_profile).delete()
        return redirect('show_post', pk=post.pk)


class LoggedOutView(TemplateView):
    ''' A view to display the logged out page '''

    template_name = 'mini_insta/logged_out.html'


########################### REST API Views ###########################

from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser # importing the parsers to allow the API to handle multipart/form-data requests for image uploads
from rest_framework.exceptions import PermissionDenied, ValidationError # importing the exceptions to handle permission and validation errors
from rest_framework.permissions import IsAuthenticated # importing to ensure the user is authenticated to create a post on their own profile
from .serializers import *


class ProfileListAPIView(generics.ListAPIView):
    ''' API View to return a list of Articles '''

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class ProfileDetailAPIView(generics.RetrieveDestroyAPIView):
    ''' API view to return a single Article'''

    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer


class PostListAPIView(generics.ListAPIView):
    ''' API View to return a list of Posts '''

    queryset = Post.objects.all()
    serializer_class = PostSerializer

class PostDetailAPIView(generics.RetrieveDestroyAPIView):
    ''' API view to return a single Post '''

    queryset = Post.objects.all()
    serializer_class = PostSerializer

class ProfilePostListAPIView(generics.ListCreateAPIView):
    ''' API View to return posts with images for a single profile and to create posts '''

    queryset = Post.objects.all() # this queryset is overwritten by get_queryset but serves as backup to provide objects to serialize by getting all the posts from the database
    serializer_class = PostSerializer
    parser_classes = [MultiPartParser, FormParser] # allows the API to handle multipart/form-data requests for image uploads
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        ''' Return all posts for the profile specified by pk '''

        profile = Profile.objects.filter(pk=self.kwargs['pk']).first() # get the profile from the database using the pk from the URL
        if profile is None:
            raise Http404("Profile not found.")
        return Post.objects.filter(profile=profile) # return all posts for the profile

    def perform_create(self, serializer):
        ''' Create a post only for the authenticated owner of this profile URL '''

        if self.request.user.is_authenticated == False:
            raise ValidationError('Authentication required to create a post.')

        profile = Profile.objects.filter(pk=self.kwargs['pk']).first() # get the profile from the database using the pk from the URL
        
        if profile is None:
            raise Http404("Profile not found.")

        if profile.user != self.request.user: # check if the profile user is not the same as the request user
            raise PermissionDenied('You can only create posts for your own profile.')

        post = serializer.save(profile=profile) # save the post with the profile

        # create one Photo object per uploaded file
        files = self.request.FILES.getlist('files')
        for file in files:
            Photo.objects.create(post=post, image_file=file)

class ProfileFeedListAPIView(generics.ListAPIView):
    ''' API View to return a feed for one profile '''

    queryset = Post.objects.all() # this queryset is overwritten by get_queryset but serves as backup to provide objects to serialize by getting all the posts from the database
    serializer_class = PostSerializer

    def get_queryset(self):
        ''' Return feed posts from profiles followed by the profile specified by pk '''

        profile = Profile.objects.filter(pk=self.kwargs['pk']).first() # get the profile from the database using the pk from the URL
        if profile is None:
            raise Http404("Profile not found.")
        return profile.get_post_feed()

########################### Authentication API Views ###########################


# Registration API View

class UserRegistrationView(generics.CreateAPIView):
    ''' API view to register a new user '''

    serializer_class = UserSerializer

# Login API View

# importing the necessary modules for the login API view
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

class UserLoginView(APIView):
    ''' API view to login a user '''

    def post(self, request):
        ''' login a user '''

        username = request.data.get('username') # get the username from the request data
        password = request.data.get('password') # get the password from the request data
        user = authenticate(username=username, password=password) # authenticate the user

        if user is not None:
            token, created = Token.objects.get_or_create(user=user) # create or retrieve a token for the user
            return Response({'token': token.key}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)