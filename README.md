## О проекте

Разработан механизм асинхронной обработки
HTTP запросов в рамках микросервисной архитектуры

----

### Алгоритм работы

- Получаем HTTP запрос на уровне микросервиса М1.
- Транслируем HTTP запрос в очередь RabbitMQ. Запрос трансформируется в задание.
- Обрабатываем задание микросервисом М2 из очереди RabbitMQ.
- Помещаем результат обработки задания в RabbitMQ.
- Возвращаем результат HTTP запроса как результат выполнения задания из RabbitMQ.

### Описание модулей

Проект содержит 2 модуля:
1. publisher - ./publisher.ts
2. subscriber - ./subscriber.ts

----

### Требования

1. Разработан механизм асинхронной обработки HTTP запросов
2. Используется стек NodeJS, RabbitMQ
  - Версия Node.js - [v18.16.0](https://nodejs.org/en/blog/release/v18.6.0) 
  - Версия npm  - [9.5.1](https://www.npmjs.com/package/npm/v/9.5.1)
  - Версия amqplib  - [^0.9.0](https://www.npmjs.com/package/amqplib)
3. Репозиторий на [Github](https://github.com/Barklim/rabbitmqTask/)
4. Инструкция по локальному развертыванию проекта
5. Требуется реализовать логирование для целей отладки и мониторинга
6. Разработан микросервис М1 для обработки входящих HTTP запросов
7. Разработан микросервис М2 для обработки заданий из RabbitMQ

----

### Запуск проекта

Инструкция по локальному развертыванию проекта

- `npm install` - Установка зависимостей
- `run docker-compose up -d` - Запуск образа RabbitMQ
- `tsc` - Компилируем в js
- `node dist/subscriber.js` - Запуск M2 подписчика, обработчика задания
- `node dist/publisher.js` - Запуск M1, обработчика запроса

- `docker ps` - Проверка запуска образа
- `docker stop 56c6c..` - Остановить контейнер
- `docker rm 56c6c..` - Удалить контейнер

Для того чтобы проверить работу, можно вызывать урл с некоторым параметром
`http://localhost:8080/user?param=1`
Для проверки асинхронности, на отправку сообщения в М2 микросервис (для обработки задания)
стоит задержка со случайным числом от 1го до 10. Если быстро отослать к М1 запросы,
с разными параметрами, тогда по логам можно будет удостовериться что они будут отправлены, а значит и
обработаны асинхронно. Также можно будет сопоставить по логам айди сообщений, CorrelationId сообщений
генерируется по uuid

#### Примеры логов 

`Subscriber logs:` <br/>
`CorrelationId: 533a2ee6-19db-416e-a0b0-dbd5abbb559a` <br/>
`Send params:` <br/>
`params 1: param 5;` <br/>
`Reply to exclusive Queue:` <br/>
`amq.gen-hMk6EgIDAmyUbNKvHAQE1Q` <br/>

`Publisher logs:` <br/>
`533a2ee6-19db-416e-a0b0-dbd5abbb559a` <br/>
`Received response:` <br/>
`Subscriber answer` <br/>

----

### Реквизиты

Стандартные реквизиты для входа в RabbitMQ по адресу `localhost:15672`

```
user password
guest guest
```

----

### Todo

- Пример тестирования
- Использовать разные типы exchange (direct, fanout, headers, topic)
- Администрирование: grafana, prometheus. Пользователя под каждый микросервис
- Бэкап curl запрос к API rmq, автоматизация, либо еще какой-то пример использования api
- Реализовать примеры по типам обмена сообщений:
    - Асинхронный запрос/ответ
    - Уведомление
    - Подписка на событие
    - Событие с ожиданием ответа

----

### Usefull links

- [Microservices.io](https://microservices.io/patterns/data/event-sourcing.html)
- [Асинхронная архитектура](https://education.borshev.com/architecture)