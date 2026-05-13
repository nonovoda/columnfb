# UI STYLE GUIDE — ColumnFB Unified UX/UI Baseline

Этот документ фиксирует **эталонный визуальный и UX-стиль** на базе `clmnPresetsManager.js` и обязателен для всех будущих скриптов проекта.

## 1) DNA стиля

Стиль: **compact dark utility panel** для Facebook Ads Manager.

Ключевые принципы:
- максимальная плотность и читаемость при малой ширине;
- приоритет действиям, а не декоративности;
- единая палитра тёмно-зелёной темы;
- предсказуемая интерактивность (loading/disabled/cancel);
- мягкая, но явная обратная связь в логах.

## 2) Каноническая палитра

Источник: `UITheme` в `clmnPresetsManager.js`.

- `panelBg`: `#0f1715`
- `panelText`: `#e8fff0`
- `panelBorder`: `#2b433a`
- `panelShadow`: `0 24px 60px rgba(0,0,0,.45)`
- `accent`: `#4dff8f`
- `accentMuted`: `#99b3a6`
- `label`: `#c7e0d2`
- `controlBg`: `#121f1b`
- `controlBorder`: `#2f4a40`
- `logBg`: `#0b1210`
- `logBorder`: `#22372f`
- `success`: `#9bff7d`
- `warning`: `#ffd27d`
- `error`: `#ff8f8f`

## 3) Типографика

- База: `Inter, "Segoe UI", Arial, sans-serif`
- Основной размер: `13px`
- Base line-height: `1.4`
- H1/бренд: `32px`, `800`, `line-height: 1.05`, `letter-spacing: .01em`
- Labels: `12px`, `500`
- Meta/versions/notes: `11px`
- Логи: `12px` + префикс времени `[HH:MM:SS]`

## 4) Геометрия и композиция

- Контейнер: `fixed`, центр через `translate(-50%, -50%)`
- Ширина: `min(420px, calc(100vw - 24px))`
- Max height: `calc(100vh - 40px)`
- Padding: `14px`
- Radius: `14px` (панель), `9px` (контролы), `10px` (лог)
- Базовый gap/вертикальный шаг: `8-10px`
- Z-index: `2147483647`

## 5) Компонентные стандарты

### Header
- Заголовок + версия слева.
- Кнопка закрытия `X` справа сверху, прозрачная, без рамки.

### Tabs
- Простая горизонтальная линия-разделитель.
- Активный таб подчёркнут линией `2px` цвета accent.

### Controls
- Общий стиль для `input/select/textarea/button`:
  - фон `#121f1b`, рамка `#2f4a40`, текст `#e8fff0`, padding `9px`, radius `9px`.

### Buttons
- По умолчанию: secondary-style (surface + border).
- Hover: смена border на accent.
- Loading-state:
  - disabled=true;
  - opacity `0.72`;
  - текст `Обработка...`.
- После любого завершения (успех/ошибка/cancel) — полный reset.

### Split buttons (важный паттерн)
Если есть альтернативные действия одного уровня, использовать ряд 50/50 с gap `8px`.
Пример канона: `Импорт JSON` + `TMPZDM Preset`.

### Log panel
- Блок внизу интерфейса.
- Цвета событий:
  - info: базовый текст
  - success: `#9bff7d`
  - warning: `#ffd27d`
  - error: `#ff8f8f`
- Автоувеличение высоты по контенту до `320px`, минимум `120px`, автоскролл вниз.

## 6) UX поведение (обязательное)

- Любой action, который может занять время, должен блокировать кнопку.
- Отмена системного диалога (например file picker) — штатный сценарий, без зависания UI.
- Ошибки отражаются и в логе, и при необходимости через `alert`.
- Перед массовым действием показывать confirm с dry-run summary.
- После действия в текущем аккаунте предлагать перезагрузку страницы.

## 7) Технический baseline для будущих скриптов

- Обязательные артефакты: `tokens.js`, `styles.css`, `typography.css`, этот `UI_STYLE_GUIDE.md`.
- Новые UI должны использовать токены, а не «жёсткие» цвета по месту.
- Допускается расширение токенов, но нельзя ломать backward-compatible базовые ключи.
