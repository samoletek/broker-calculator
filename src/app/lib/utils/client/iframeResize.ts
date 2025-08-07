export const initIframeResizer = () => {
  if (typeof window === 'undefined') return;
  
  // Проверяем, находимся ли мы внутри iframe
  const isInIframe = window.self !== window.top;
  
  if (isInIframe) {
    try {
      // Загружаем iframe-resizer contentWindow скрипт динамически
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/iframe-resizer@5.5.2/js/iframeResizer.contentWindow.min.js';
      script.onload = () => {
        console.log('iframe-resizer: Content window script loaded');
      };
      document.head.appendChild(script);
    } catch (e) {
      console.error('iframe-resizer: Failed to initialize', e);
    }
  }
};

// Функция для ручной отправки высоты родителю (как fallback)
export const sendHeightToParent = () => {
  if (window.self !== window.top) {
    try {
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      // Отправляем сообщение родителю
      window.parent.postMessage({
        action: 'resize-iframe',
        height: height
      }, '*');
      
      console.log('iframe-resizer: Manual height sent', height);
    } catch (e) {
      console.error('iframe-resizer: Failed to send height', e);
    }
  }
};

// Функция для отслеживания изменений размера
export const observeHeightChanges = (callback?: () => void) => {
  if (typeof window === 'undefined') return;
  
  const observer = new ResizeObserver(() => {
    sendHeightToParent();
    if (callback) callback();
  });
  
  // Наблюдаем за body и documentElement
  observer.observe(document.body);
  observer.observe(document.documentElement);
  
  // Также отслеживаем изменения DOM
  const mutationObserver = new MutationObserver(() => {
    sendHeightToParent();
    if (callback) callback();
  });
  
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  
  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
  };
};