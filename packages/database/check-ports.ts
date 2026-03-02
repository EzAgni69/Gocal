import * as net from 'net';
import * as fs from 'fs';

function checkPort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            resolve(false);
        });
        socket.connect(port, '127.0.0.1');
    });
}

async function run() {
    const is5434 = await checkPort(5434);
    const is5432 = await checkPort(5432);
    fs.writeFileSync('port-check.txt', `5434: ${is5434}, 5432: ${is5432}`);
    process.exit(0);
}

run();
