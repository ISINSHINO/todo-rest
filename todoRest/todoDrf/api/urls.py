from django.urls import path, include
from api.views import TaskViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
urlpatterns = [
   path('', include(router.urls)),
   path('clear-completed/', TaskViewSet.as_view({"delete": "clear_completed"})),
   path('complete-all/', TaskViewSet.as_view({"put": "complete_all"}))
]