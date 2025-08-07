// iframe-loader.js - скрипт для загрузки iframe-resizer на стороне родителя
// Этот файл нужно подключить на WordPress сайте

(function() {
  // Загружаем iframe-resizer если еще не загружен
  if (typeof window.iFrameResize === 'undefined') {
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@5.5.2/js/iframeResizer.min.js';
    script.onload = function() {
      initCalculatorIframe();
    };
    document.head.appendChild(script);
  } else {
    initCalculatorIframe();
  }

  function initCalculatorIframe() {
    // Ищем все iframe с калькулятором
    var iframes = document.querySelectorAll('iframe.broker-calculator-iframe');
    
    if (iframes.length > 0) {
      // Инициализируем iframe-resizer
      iFrameResize({
        log: false,
        checkOrigin: false,
        inPageLinks: true,
        heightCalculationMethod: 'bodyScroll',
        scrolling: false,
        tolerance: 0,
        warningTimeout: 0,
        onInit: function(iframe) {
          console.log('Broker Calculator iframe initialized');
        },
        onResized: function(messageData) {
          console.log('Iframe resized to:', messageData.height);
        }
      }, '.broker-calculator-iframe');
    }
    
    // Слушаем кастомные события от калькулятора
    window.addEventListener('message', function(event) {
      // Проверяем origin если нужно
      // if (event.origin !== 'https://your-vercel-app.vercel.app') return;
      
      if (event.data.action === 'resize-iframe') {
        // Fallback для ручного изменения размера
        var iframe = document.querySelector('.broker-calculator-iframe');
        if (iframe) {
          iframe.style.height = event.data.height + 'px';
        }
      }
      
      if (event.data.action === 'calculator-loaded') {
        console.log('Calculator loaded, initial height:', event.data.height);
      }
      
      if (event.data.action === 'openPopup') {
        // Обработка открытия модального окна для обратного звонка
        console.log('Request to open callback popup');
        // Здесь можно открыть WordPress модальное окно
      }
      
      if (event.data.action === 'saveBookingData') {
        // Сохранение данных букинга
        console.log('Booking data received:', event.data.data);
        // Можно сохранить в localStorage или отправить на сервер
        localStorage.setItem('brokerCalculatorBooking', JSON.stringify(event.data.data));
      }
    });
  }
})();