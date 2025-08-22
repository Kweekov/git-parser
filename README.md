# 🚀 GitHub Profile Parser

![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=blue)

Профессиональный парсер профилей GitHub с детальной аналитикой и современным минималистичным дизайном.

## 🌟 Демо

**🔗 Live Demo:** [https://kweekov.github.io/git-parser/](https://kweekov.github.io/git-parser/)

## ✨ Основные возможности

### 🎯 **Профессиональный UI/UX**
- Минималистичный тёмный дизайн
- Анимированный фон с эффектами
- Полная адаптивность для всех устройств
- Плавные анимации Framer Motion

### 📊 **Детальная аналитика**
- **Основные метрики:** репозитории, подписчики, подписки
- **Расширенная статистика:** звёзды, форки, языки программирования
- **Активность:** коммиты, issues, pull requests
- **Качество кода:** описания, лицензии, размер проектов

### 🔗 **Дополнительные функции**
- **Шаринг профилей** через URL параметры
- **Экспорт данных** в JSON формате
- **GitHub API мониторинг** лимитов запросов
- **Personal Access Token** поддержка

### ⚡ **Техническая база**
- React 19 + TypeScript
- Tailwind CSS 4.1 для стилизации
- Framer Motion для анимаций
- Axios для API запросов
- GitHub REST API v3

## 🚀 Быстрый деплой на GitHub Pages

### 1. Форк и клонирование
```bash
# Склонируйте репозиторий
git clone https://github.com/yourusername/git-parser.git
cd git-parser
```

### 2. Установка зависимостей
```bash
# Установка пакетов
npm install

# Запуск в режиме разработки
npm run dev
```

### 3. Настройка для вашего репозитория
Отредактируйте `vite.config.ts`, замените `/git-parser/` на название вашего репозитория:
```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/your-repo-name/', // ← Измените здесь
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

### 4. Автоматический деплой (рекомендуется)
1. Перейдите в **Settings** → **Pages** вашего GitHub репозитория
2. Выберите **Source**: GitHub Actions
3. Закоммитьте и запушьте изменения:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```
4. GitHub Actions автоматически соберёт и задеплоит проект ✨

### 5. Ручной деплой (альтернатива)
```bash
# Установка gh-pages
npm install --save-dev gh-pages

# Сборка и деплой
npm run deploy
```

## 🛠️ Команды разработки

```bash
# Разработка
npm run dev          # Запуск dev сервера

# Сборка
npm run build        # Сборка для продакшена
npm run preview      # Превью собранного проекта

# Качество кода
npm run lint         # Проверка ESLint

# Деплой
npm run deploy       # Ручной деплой на GitHub Pages
```

## 📁 Структура проекта

```
git-parser/
├── .github/workflows/    # GitHub Actions
├── src/
│   ├── App.tsx          # Главный компонент
│   ├── main.tsx         # Точка входа
│   └── index.css        # Глобальные стили
├── public/              # Статические файлы
├── dist/                # Сборка (автогенерация)
├── vite.config.ts       # Конфигурация Vite
├── package.json         # Зависимости и скрипты
└── README.md           # Документация
```

## 🔧 GitHub API Configuration

### Лимиты без токена
- **60 запросов в час** для неаутентифицированных запросов
- Подходит для демонстрации и лёгкого использования

### С GitHub Personal Access Token
- **5000 запросов в час** с токеном
- Рекомендуется для активного использования

### Получение токена
1. Перейдите в [GitHub Settings](https://github.com/settings/tokens)
2. Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token → выберите срок действия
4. Права доступа не требуются для публичных данных
5. Скопируйте токен и добавьте в приложение

### Настройка токена
1. Откройте приложение
2. Нажмите ⚙️ **Настройки** в правом верхнем углу
3. Вставьте ваш токен
4. Нажмите **Сохранить**

## 🎨 Кастомизация

### Изменение цветовой схемы
Отредактируйте классы Tailwind в `src/App.tsx`:
- `bg-white/5` - фон карточек
- `border-white/10` - границы
- `text-white` - основной текст
- `text-gray-400` - вторичный текст

### Добавление метрик
Расширьте интерфейс `UserStats` в `App.tsx` и функцию `calculateUserStats` для новых метрик.

## 🐛 Устранение неполадок

### Проблема: 403 Forbidden ошибки
**Решение:** Добавьте GitHub Personal Access Token через настройки ⚙️

### Проблема: Приложение не открывается после деплоя
**Решение:** Проверьте `base` в `vite.config.ts` - должно совпадать с названием репозитория

### Проблема: Ссылки не работают
**Решение:** Убедитесь, что GitHub Pages включены в настройках репозитория

## 📄 Лицензия

MIT License - используйте свободно для личных и коммерческих проектов.

## 🤝 Поддержка

Если у вас есть вопросы или предложения:
- Создайте **Issue** в репозитории
- Предложите улучшения через **Pull Request**

---

**Сделано с ❤️ и профессиональным подходом к UI/UX**