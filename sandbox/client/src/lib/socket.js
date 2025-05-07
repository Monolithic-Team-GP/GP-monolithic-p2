import { io } from "socket.io-client";

const socket = io("https://ap-southeast-1.data.tidbcloud.com/api/v1beta/app/dataapp-WDElPzvR/endpoint");

export default socket
