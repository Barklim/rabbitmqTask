import { connect } from 'amqplib';

const run = async () => {
	try {
		const connection = await connect('amqp://localhost');
		const channel = await connection.createChannel();
		await channel.assertExchange('test', 'topic', { durable: true });
		const queue = await channel.assertQueue('my-cool-queue', { durable: true });
		channel.bindQueue(queue.queue, 'test', 'my.command');
		channel.consume(queue.queue, (message) => {
			if (!message) {
				return;
			}
			console.log('Subscriber logs:');
			console.log(message.content.toString());
			if (message.properties.replyTo) {
				console.log('Reply to exclusive Queue:');
				console.log(message.properties.replyTo);
				console.log('');
				channel.sendToQueue(message.properties.replyTo, Buffer.from('Subscriber answer'), { correlationId: message.properties.correlationId })
			}
		}, {
			noAck: true
		})
	} catch (e) {
		console.error(e);
	}
};

run();