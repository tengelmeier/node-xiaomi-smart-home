import GenericSensor from "./GenericSensor";
import HubMessage from "../Types/HubMessage";
export default class MotionSensor extends GenericSensor {

    private motion: boolean = null;
    onMessage(message: HubMessage)
    {
        this.motion = message.data.status == 'motion'
        if (message.cmd == 'report' || message.cmd == 'read_ack')
        {
            this.hub.emit('data.motion', this.sid, this.motion);
        }
    }
}

