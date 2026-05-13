# FB Tooling UI Core

Структура для будущих bookmarklet-скриптов Facebook Ads Manager.

## Файлы

- `UI_STYLE_GUIDE.md` — короткий гайд по стилю для Codex.
- `ui/core/tokens.js` — цвета, радиусы, размеры, тени и типографика.
- `ui/core/typography.css` — базовая типографика.
- `ui/core/styles.css` — универсальные стили компонентов.

## Базовая разметка

```html
<section class="fbtool">
  <div class="fbtool__header">
    <div>
      <h1 class="fbtool__title">FB Spend Manager</h1>
      <div class="fbtool__meta">v 2026.04.09</div>
    </div>
    <button class="fbtool__close">×</button>
  </div>

  <label>Период</label>
  <select>
    <option>Сегодня</option>
  </select>

  <button class="fbtool__btn fbtool__btn--primary fbtool__mt-10">
    Запустить
  </button>

  <div class="fbtool__log"></div>
  <div class="fbtool__note">Безопасный режим: последовательная работа с API.</div>
</section>
```
