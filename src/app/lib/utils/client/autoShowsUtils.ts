import { PricingConfig } from '../../../../types/pricing-config.types';

interface PlaceDetails extends google.maps.places.PlaceResult {
  name: string;
  geometry?: {
    location: google.maps.LatLng;
  };
}

interface AutoShowEvent {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  dates: {
    start: Date;
    end: Date;
  };
  distance: number;
}

export const checkAutoShows = async (
  location: { lat: number; lng: number },
  date: Date,
  google: typeof window.google,
  config: PricingConfig
): Promise<AutoShowEvent[]> => {
  const service = new google.maps.places.PlacesService(document.createElement('div'));
  
  const searchParams: google.maps.places.PlaceSearchRequest = {
    location: location,
    radius: config.autoShows.searchRadius,
    keyword: 'auto show car show automotive exhibition convention center stadium'
  };

  try {
    const places = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
      service.nearbySearch(searchParams, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      });
    });

    // Search date +/- dateRange days from config
    const searchStartDate = new Date(date);
    searchStartDate.setDate(searchStartDate.getDate() - config.autoShows.dateRange);
    const searchEndDate = new Date(date);
    searchEndDate.setDate(searchEndDate.getDate() + config.autoShows.dateRange);

    if (places.length === 0) {
      return [];
    }

    const detailedResults = await Promise.all(
      places.map(async (place) => {
        if (!place.place_id) return null;

        try {
          const placeInfo = await new Promise<PlaceDetails>((resolve, reject) => {
            service.getDetails(
              { 
                placeId: place.place_id!, 
                fields: ['name', 'geometry', 'formatted_address', 'website'] 
              },
              (result, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                  resolve(result as PlaceDetails);
                } else {
                  reject(status);
                }
              }
            );
          });

          if (!placeInfo || !placeInfo.geometry?.location) return null;

          const distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(location),
            placeInfo.geometry.location
          ) / 1609.34; // convert to miles

          return {
            name: placeInfo.name || 'Unknown Event',
            location: {
              lat: placeInfo.geometry.location.lat(),
              lng: placeInfo.geometry.location.lng()
            },
            dates: {
              start: searchStartDate,
              end: searchEndDate
            },
            distance: Math.round(distance * 10) / 10
          };
        } catch (error) {
          console.warn('Error getting place details:', error);
          return null;
        }
      })
    );

    return detailedResults.filter((result): result is AutoShowEvent => result !== null);
  } catch (error) {
    console.warn('Error searching for auto shows:', error);
    return [];
  }
};

export const getAutoShowMultiplier = (autoShows: AutoShowEvent[], date: Date, config: PricingConfig): number => {
  if (autoShows.length > 0) {
    return config.autoShows.multiplier;
  }
  return 1.0;
};