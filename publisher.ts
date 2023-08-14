import { connect } from 'amqplib';
import { v4 as uuidv4 } from 'uuid';
const http = require('http');
const url = require('url');
import { EventEmitter } from 'events';

const eventEmitter = new EventEmitter();

const run = async () => {
	try {
		const connection = await connect('amqp://localhost');
		const channel = await connection.createChannel();
		await channel.assertExchange('test', 'topic', { durable: true });

		return channel;
	} catch (e) {
		console.error('RabbitMQ Error:');
		console.error(e);
		return null;
	}
};

http.createServer(async function (req: any, res: any) {
	try {
		const channel = await run();

		// URL's which communicate with another microservices by rmq
		// req.url.includes('listOrPattern')
		if (req.url) {
			if (channel) {
				const q = url.parse(req.url, true).query;
				let params = '';
				Object.keys(q).forEach((key, index) => {
					const value = q[key];
					params = params + `param ${index + 1}: ` + key + " " + value + "; "
				})

				const correlationId = uuidv4();
				const replyQueue = await channel.assertQueue('', { exclusive: true });

				// Подписываемся на событие для данного correlationId
				eventEmitter.once(correlationId, (message) => {
					console.log('Received response:');
					console.log(message);
					console.log('');
				});

				channel.consume(replyQueue.queue, (message) => {
					console.log('Publisher logs:');
					console.log(message?.properties.correlationId);

					if (message?.properties.correlationId === correlationId) {
						// Эмитируем событие для данного correlationId
						eventEmitter.emit(correlationId, message?.content.toString());
					}
				});

				// Добавляем задержку от 1 до 10 секунд, для проверки асинхронности
				const randomDelay = Math.random() * 9000 + 1000;
				setTimeout(() => {
					channel.publish('test', 'my.command',
						Buffer.from(`CorrelationId: ${correlationId}\nSend params:\n${params}`),
						{ replyTo: replyQueue.queue, correlationId: correlationId });
				}, randomDelay);
			} else {
				console.error('RabbitMQ channel connection error.');
			}
		}

		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.write(req.url);
		res.end();
	} catch (error) {
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.write('Internal Server Error');
		res.end();
	}
}).listen(8080);