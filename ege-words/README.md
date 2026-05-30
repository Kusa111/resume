# ЕГЭ Слова

Мобильный минималистичный тренажёр сложных орфограмм ЕГЭ. Проект полностью статический: `index.html`, CSS и нативный JavaScript без серверной части и базы данных.

## Что внутри

- режимы: **Задание 9**, **Задание 10**, **Задание 11**, **Задание 12**, **ПРЕ/ПРИ**;
- локальная база слов в `src/data.js` в формате `original`, `masked`, `answer`, `hint`;
- случайный порядок карточек без повторов до конца текущего набора;
- ввод с клавиатуры и проверка по Enter или кнопке OK;
- WIN STREAK и лучший streak в `localStorage`;
- mobile-first дизайн, рассчитанный на ширину от 360px.

## Локальный запуск

Так как это статический сайт без сборки, достаточно открыть `index.html` в браузере. Для проверки через локальный сервер из корня текущего репозитория можно запустить:

```bash
python3 -m http.server 4173
```

и открыть `http://localhost:4173/ege-words/`. Относительные пути в HTML также подходят для GitHub Pages-адреса `https://kusa111.github.io/resume/ege-words/`.

## Деплой на GitHub Pages

Текущая папка `ege-words/` является отдельным статическим разделом внутри репозитория и не меняет файлы главной страницы `/resume/`. При публикации текущей ветки GitHub Pages сайт будет открываться по адресу `https://kusa111.github.io/resume/ege-words/`.

Если нужен полностью отдельный репозиторий и ссылка `https://kusa111.github.io/ege-words/`, используйте вариант ниже:

1. Создайте новый репозиторий на GitHub с именем `ege-words`.
2. Скопируйте содержимое папки `ege-words/` в корень нового репозитория.
3. Закоммитьте и запушьте в ветку `main`:

```bash
git init
git add .
git commit -m "Create EGE words trainer"
git branch -M main
git remote add origin git@github.com:kusa111/ege-words.git
git push -u origin main
```

4. В GitHub откройте **Settings → Pages**.
5. В разделе **Build and deployment** выберите:
   - Source: **Deploy from a branch**;
   - Branch: **main**;
   - Folder: **/ (root)**.
6. Сохраните настройки. Через несколько минут сайт будет доступен по адресу:

```text
https://kusa111.github.io/ege-words/
```

Аналогично можно создать репозиторий `ege-trainer`; тогда итоговая ссылка будет `https://kusa111.github.io/ege-trainer/`.
