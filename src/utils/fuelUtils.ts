interface GasStation {
    name: string;
    location: {
      lat: number;
      lng: number;
    };
    price: number | null;
  }
  
  interface PlaceDetails extends google.maps.places.PlaceResult {
    geometry?: {
      location?: google.maps.LatLng;
    };
  }
  
  export const checkFuelPrices = async (
    points: Array<{ lat: number; lng: number }>,
    google: typeof window.google
  ): Promise<number | null> => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
  
    try {
      // Получаем заправки по каждой точке маршрута
      const stationsPromises = points.map(async point => {
        const searchParams: google.maps.places.PlaceSearchRequest = {
          location: point,
          radius: 5000,
          keyword: 'gas station diesel fuel'
        };
  
        // Поиск заправок
        const stations = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
          service.nearbySearch(searchParams, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              // Перемешиваем результаты и берем первые 5
              const shuffled = results.sort(() => 0.5 - Math.random());
              resolve(shuffled.slice(0, 5));
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              resolve([]);
            } else {
              reject(status);
            }
          });
        });
  
        // Получаем детальную информацию по каждой заправке
        const stationDetails = await Promise.all(
          stations.map(station => 
            new Promise<GasStation | null>(resolve => {
              if (!station.place_id) {
                resolve(null);
                return;
              }
  
              service.getDetails(
                {
                  placeId: station.place_id,
                  fields: ['name', 'geometry', 'price_level', 'rating']
                },
                (result: PlaceDetails | null, status) => {
                  if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                    const location = result.geometry?.location;
                    if (!location) {
                      resolve(null);
                      return;
                    }
  
                    // price_level в Google Places API от 0 до 4
                    // Конвертируем в примерную цену на дизель
                    const basePrice = 3.50; // базовая цена дизеля
                    const priceMultiplier = result.price_level ? (1 + result.price_level * 0.1) : null;
                    
                    resolve({
                      name: result.name || 'Unknown Station',
                      location: {
                        lat: location.lat(),
                        lng: location.lng()
                      },
                      price: priceMultiplier ? basePrice * priceMultiplier : null
                    });
                  } else {
                    resolve(null);
                  }
                }
              );
            })
          )
        );
  
        return stationDetails.filter((station): station is GasStation => 
          station !== null && station.price !== null
        );
      });
  
      const allStations = (await Promise.all(stationsPromises)).flat();
      
      // Если нет данных о ценах, возвращаем null
      if (allStations.length === 0) {
        return null;
      }
  
      // Находим все валидные цены
      const validPrices = allStations
        .map(station => station.price)
        .filter((price): price is number => price !== null);
  
      return validPrices.length > 0 ? Math.max(...validPrices) : null;
    } catch (error) {
      console.warn('Error checking fuel prices:', error);
      return null;
    }
  };
  
  export const getFuelPriceMultiplier = async (
    points: Array<{ lat: number; lng: number }>,
    google: typeof window.google
  ): Promise<number> => {
    const maxPrice = await checkFuelPrices(points, google);
    if (!maxPrice) return 1.0;
  
    const basePrice = 3.50;
    return maxPrice > basePrice * 1.05 ? 1.05 : 1.0;
  };