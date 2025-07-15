export interface PricingConfig {
  version: string;
  lastUpdated: string;
  updatedBy?: string;
  
  // Базовые ставки за милю
  baseRates: {
    openTransport: {
      min: number;
      max: number;
    };
    enclosedTransport: {
      min: number;
      max: number;
    };
  };

  // Множители стоимости автомобилей
  vehicleValueMultipliers: {
    under100k: number;
    from100kTo300k: number;
    from300kTo500k: number;
    over500k: number;
  };

  // Дополнительные услуги
  additionalServices: {
    premiumEnhancements: number;
    specialLoad: number;
    inoperableZeroMileage: number;
    supplementaryInsurance: number;
  };

  // Комиссии за оплату
  paymentFees: {
    creditCard: number;
    achCheckCod: number;
  };

  // Погодные множители
  weatherMultipliers: {
    clear: number;
    cloudy: number;
    rain: number;
    snow: number;
    storm: number;
    extreme: number;
  };

  // Факторы маршрутов
  routeFactors: {
    popular: number;
    regular: number;
    remote: number;
  };

  // Настройки валидации
  validation: {
    maxDistance: number;
    minPriceThreshold: number;
    shortDistanceLimit: number;
  };

  // Цены на топливо
  fuel: {
    baseDieselPrice: number;
    priceLevelMultiplier: number;
    priceThreshold: number;
    highPriceMultiplier: number;
  };

  // Транспортные коэффициенты
  transport: {
    dailyDrivingMiles: number;
    trafficMultipliers: {
      light: number;
      moderate: number;
      heavy: number;
    };
    trafficThresholds: {
      lightThreshold: number;
      heavyThreshold: number;
    };
  };

  // Платные дороги
  tolls: {
    baseTollRate: number;
    minCostMultiplier: number;
    minCostBase: number;
    maxCostMultiplier: number;
    
    // Региональные множители
    regionalMultipliers: {
      northeast: number;
      newEngland: number;
      midAtlantic: number;
      greatLakesMidwest: number;
      southeast: number;
      texasSouthernPlains: number;
      mountainWest: number;
      greatPlains: number;
      pacificCoast: number;
      louisiana: number;
    };
    
    // Скидки за расстояние
    distanceDiscounts: {
      over2000Miles: number;
      over1000Miles: number;
    };
    
    // Региональные доли от общей суммы
    regionalPortions: {
      northeast: number;
      newEngland: number;
      midAtlantic: number;
      greatLakesMidwest: number;
      southeast: number;
      texasSouthernPlains: number;
      mountainWest: number;
      greatPlains: number;
      pacificCoast: number;
      louisiana: number;
    };
  };

}

export interface PricingConfigHistory {
  id: string;
  version: string;
  config: PricingConfig;
  createdAt: string;
  updatedBy?: string;
  changeDescription?: string;
}

export interface EdgeConfigResponse {
  success: boolean;
  data?: PricingConfig;
  error?: string;
  version?: string;
}