from django.urls import path
from .views import (
    MasterDataView, 
    GeneratePlanView,
    BrandingPrioritiesView,
    CleaningDetailingView,
    FitnessCertificatesView,
    JobcardStatusView,
    MileageBalancingView,
    StablingGeometryView
)

urlpatterns = [
    path('master-data/', MasterDataView.as_view(), name='master-data'),
    path('generate-plan/', GeneratePlanView.as_view(), name='generate-plan'),
    path('branding-priorities/', BrandingPrioritiesView.as_view(), name='branding-priorities'),
    path('cleaning-detailing/', CleaningDetailingView.as_view(), name='cleaning-detailing'),
    path('fitness-certificates/', FitnessCertificatesView.as_view(), name='fitness-certificates'),
    path('jobcard-status/', JobcardStatusView.as_view(), name='jobcard-status'),
    path('mileage-balancing/', MileageBalancingView.as_view(), name='mileage-balancing'),
    path('stabling-geometry/', StablingGeometryView.as_view(), name='stabling-geometry'),
]
