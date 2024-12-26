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
  google: typeof window.google
): Promise<AutoShowEvent[]> => {
  const service = new google.maps.places.PlacesService(document.createElement('div'));
  
  const searchParams: google.maps.places.PlaceSearchRequest = {
    location: location,
    radius: 32186, // 20 миль в метрах
    keyword: 'auto show car show automotive exhibition convention center stadium'
  };

  try {
    const places = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
      service.nearbySearch(searchParams, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]); // Возвращаем пустой массив вместо ошибки
        } else {
          reject(status);
        }
      });
    });

    // Дата поиска +/- 3 дня
    const searchStartDate = new Date(date);
    searchStartDate.setDate(searchStartDate.getDate() - 3);
    const searchEndDate = new Date(date);
    searchEndDate.setDate(searchEndDate.getDate() + 3);

    // Обрабатываем результаты только если есть места
    if (places.length === 0) {
      return []; // Возвращаем пустой массив если нет результатов
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
          ) / 1609.34; // конвертируем метры в мили

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

    return detailedResults.filter(result => result !== null) as AutoShowEvent[];
  } catch (error) {
    console.warn('Error searching for auto shows:', error);
    return []; // Возвращаем пустой массив вместо выброса ошибки
  }
};

export const getAutoShowMultiplier = (autoShows: AutoShowEvent[], date: Date): number => {
  if (autoShows.length > 0) {
    return 1.1; // +10% к базовой цене
  }
  return 1.0;
};