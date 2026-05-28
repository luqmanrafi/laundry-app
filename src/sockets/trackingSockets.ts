import { Server, Socket } from "socket.io";
import redisClient from "../config/redisClient.js";

export const setupTrackingSockets = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`Kurir terhubung : ${socket.id}` );
        socket.on('join_order_room', async (orderId: string) => {
            const roomName = `room_order_${orderId}`;
            socket.join(roomName);

            const lastLoc = await redisClient.get(`tracking:order_${orderId}`);
            if(lastLoc){
                socket.emit('kurir_lokasi_terbaru', JSON.parse(lastLoc));
            }
        });
        socket.on('update_lokasi', async(data: {orderId: string, lat: number, lng: number}) =>{
            const { orderId, lat, lng } = data;
            const roomName = `room_order_${orderId}`;

            await redisClient.setEx(`tracking:order_${orderId}`, 3600, JSON.stringify({lat, lng}));
            socket.to(roomName).emit('kurir_lokasi_terbaru', {lat, lng});
        });
    });
}