from geopy.geocoders import Nominatim

def get_coords(location_name: str):
    geolocator = Nominatim(user_agent="mediagent_app")
    location = geolocator.geocode(location_name)
    if location:
        return location.latitude, location.longitude
    return None, None