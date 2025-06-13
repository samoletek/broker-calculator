// Автозаполнение адресов через server-side geocoding API

interface AddressSuggestion {
  formatted_address: string;
  place_id: string;
  types: string[];
}

// Debounce функция для ограничения запросов
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Получение подсказок адресов
export async function getAddressSuggestions(
  input: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  // Не запрашиваем подсказки для коротких строк
  if (input.length < 2) {
    return [];
  }

  try {
    const response = await fetch('/api/maps/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: input,
        limit: 5 // Ограничиваем количество результатов
      }),
      signal
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.warn('Address autocomplete API error:', data.error);
      return [];
    }

    if (data.success && data.results) {
      return data.results.map((result: any) => ({
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        types: result.types
      }));
    }

    return [];
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Игнорируем отмененные запросы
      return [];
    }
    console.error('Address autocomplete error:', error);
    return [];
  }
}

// Debounced версия для использования в компонентах
export const getDebouncedAddressSuggestions = debounce(
  async (
    input: string,
    callback: (suggestions: AddressSuggestion[]) => void,
    signal?: AbortSignal
  ) => {
    const suggestions = await getAddressSuggestions(input, signal);
    callback(suggestions);
  },
  300 // 300ms задержка
);