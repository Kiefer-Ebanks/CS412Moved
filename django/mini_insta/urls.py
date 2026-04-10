# File: urls.py
# Author: Kiefer Ebanks (kebanks@bu.edu), 2/12/2026
# Description: The urls file for the mini instagram app
# Creating the url pathsfor the mini instagram app

from django.urls import path
from .views import * #ProfileListView, ProfileDetailView, PostDetailView

from django.contrib.auth import views as auth_views # importing the views for the authentication system

# Authentication API imports
from .views import UserRegistrationView, UserLoginView

# Creating the url paths for the mini instagram app
urlpatterns = [
    path(r'', ProfileListView.as_view(), name='show_all_profiles'),
    path(r'profile/', MyProfileDetailView.as_view(), name='show_my_profile'),
    path(r'profile/<int:pk>/', ProfileDetailView.as_view(), name='show_profile'),
    path(r'post/<int:pk>/', PostDetailView.as_view(), name='show_post'),
    path(r'profile/create_post/', CreatePostView.as_view(), name='create_post'),
    path(r'profile/update/', UpdateProfileView.as_view(), name='update_profile'),
    path(r'post/<int:pk>/delete/', DeletePostView.as_view(), name='delete_post'),
    path(r'post/<int:pk>/update/', UpdatePostView.as_view(), name='update_post'),
    path(r'profile/<int:pk>/followers/', ShowFollowersDetailView.as_view(), name='show_followers'),
    path(r'profile/<int:pk>/following/', ShowFollowingDetailView.as_view(), name='show_following'),
    path(r'profile/<int:pk>/follow', FollowView.as_view(), name='follow'),
    path(r'profile/<int:pk>/delete_follow', DeleteFollowView.as_view(), name='delete_follow'),
    path(r'post/<int:pk>/like', LikeView.as_view(), name='like'),
    path(r'post/<int:pk>/delete_like', DeleteLikeView.as_view(), name='delete_like'),
    path(r'profile/feed', PostFeedListView.as_view(), name='show_feed'), # Display the post feed for the logged-in user's profile
    path(r'profile/search', SearchView.as_view(), name='search'),

    # Authentication URLs
    path(r'create_profile/', CreateProfileView.as_view(), name='create_profile'),
    path(r'register/', CreateProfileView.as_view(), name='register'),
    path(r'login/', auth_views.LoginView.as_view(template_name='mini_insta/login.html'), name='login'), # providing the template and login form via the 
    #path(r'logout/', auth_views.LogoutView.as_view(next_page='show_all_profiles'), name='logout'), # redirecting to the show_all_profiles page after the user logs out
    path(r'logout/', auth_views.LogoutView.as_view(next_page='logout_confirmation'), name='logout'), # providing the template and logout form via the auth_views.LogoutView
    path(r'logout_confirmation/', LoggedOutView.as_view(), name='logout_confirmation'), # providing the template and logout form via the auth_views.LogoutView


    # REST API Views:
    path(r'api/profiles/', ProfileListAPIView.as_view(), name='api_show_all_profiles'),
    path(r'api/profiles/<int:pk>/', ProfileDetailAPIView.as_view(), name='api_show_profile'),
    path(r'api/profiles/<int:pk>/posts/', ProfilePostListAPIView.as_view(), name='api_profile_posts'),
    path(r'api/profiles/<int:pk>/feed/', ProfileFeedListAPIView.as_view(), name='api_profile_feed'),
    path(r'api/posts/', PostListAPIView.as_view(), name='api_show_all_posts'),
    path(r'api/posts/<int:pk>/', PostDetailAPIView.as_view(), name='api_show_post'),

    # Authentication API Views:
    path(r'api/register/', UserRegistrationView.as_view(), name='api_register'),
    path(r'api/login/', UserLoginView.as_view(), name='api_login'),
]