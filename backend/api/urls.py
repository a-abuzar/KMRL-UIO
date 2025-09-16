from django.urls import path
from .views import MasterDataView, GeneratePlanView

urlpatterns = [
    path('master-data/', MasterDataView.as_view(), name='master-data'),
    path('generate-plan/', GeneratePlanView.as_view(), name='generate-plan'),
]
