import { getPricingConfigServer } from '@/app/lib/hooks/usePricingConfig';
import ClientCalculator from '@/app/components/ClientCalculator';

export default async function BrokerCalculator() {
  // Получаем конфигурацию на сервере из Edge Config
  const config = await getPricingConfigServer();
  
  // Передаем конфигурацию в клиентский компонент
  return <ClientCalculator config={config} />;
}