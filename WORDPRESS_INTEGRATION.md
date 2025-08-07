# Инструкция по эмбеддингу калькулятора в WordPress

## Установка

Вставить этот HTML код в нужное место на хоум-странице WordPress:

```html
<!-- Калькулятор -->
<iframe 
    id="broker-calculator"
    src="https://brokercalculator.xyz"
    width="100%"
    style="border: none; min-height: 800px;"
    scrolling="no">
</iframe>

<!-- Скрипт для динамической высоты -->
<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@5.5.2/js/iframeResizer.min.js"></script>
<script>
  iFrameResize({ 
    log: false,
    checkOrigin: false,
    heightCalculationMethod: 'bodyScroll'
  }, '#broker-calculator');
</script>
```

## Готово!

Калькулятор автоматически подстраивает высоту под контент и работает на всех устройствах.