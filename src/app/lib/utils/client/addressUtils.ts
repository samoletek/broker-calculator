export const isUSAddress = async (address: string, google: typeof window.google): Promise<boolean> => {
  const geocoder = new google.maps.Geocoder();

  try {
    const response = await geocoder.geocode({ address });

    if (response.results.length === 0) {
      return false;
    }

    const result = response.results[0];

    return result.address_components.some(component =>
      component.types.includes('country') && component.short_name === 'US'
    );
  } catch (error) {
    console.error('Error validating address:', error);
    return false;
  }
};