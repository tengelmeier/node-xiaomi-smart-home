"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dgram_1 = require("dgram");
const events = require("events");
const Gateway_1 = require("./Sensors/Gateway");
const THSensor_1 = require("./Sensors/THSensor");
const DoorSensor_1 = require("./Sensors/DoorSensor");
const MotionSensor_1 = require("./Sensors/MotionSensor");
const Plug_1 = require("./Sensors/Plug");
const Button_1 = require("./Sensors/Button");
class Hub extends events.EventEmitter {
    constructor() {
        super();
        this.sensors = {};
        this.sensorTypes = {
            gateway: 'gateway',
            th: 'sensor_ht',
            button: 'switch',
            plug: 'plug',
            magnet: 'magnet',
            motion: 'motion'
        };
        this.clickTypes = {
            click: 'click',
            double_click: 'double_click',
            long_click_press: 'long_click_press',
            long_click_release: 'long_click_release',
        };
    }
    listen() {
        let dgram = require('dgram');
        this.socket = dgram_1.createSocket({ type: 'udp4', reuseAddr: true });
        let multicastPort = 9898;
        this.socket.on('message', this.onMessage.bind(this));
        this.socket.on('error', this.onError.bind(this));
        this.socket.on('listening', this.onListening.bind(this));
        this.socket.bind(multicastPort);
    }
    stop(cb) {
        this.socket.close(cb);
    }
    onListening() {
        this.socket.setBroadcast(true);
        this.socket.setMulticastTTL(128);
        this.socket.addMembership('224.0.0.50');
        let whoIsCommand = '{"cmd": "whois"}';
        this.socket.send(whoIsCommand, 0, whoIsCommand.length, 4321, '224.0.0.50');
    }
    onError(err) {
        this.emit('error', err);
    }
    onMessage(msgBuffer) {
        try {
            var msg = JSON.parse(msgBuffer.toString());
        }
        catch (e) {
            return;
        }
        let sensor = this.getSensor(msg.sid);
        if (!sensor) {
            if (!msg.model) {
                return;
            }
            try {
                sensor = this.sensorFactory(msg.sid, msg.model);
            }
            catch (e) {
                this.emit('warning', 'Could not add new sensor: ' + e.message);
                return;
            }
        }
        sensor.heartBeat();
        if (msg.data) {
            msg.data = JSON.parse(msg.data);
        }
        if (msg.cmd == 'report' || msg.cmd.indexOf('_ack') != -1) {
            sensor.onMessage(msg);
        }
        this.emit('message', msg);
    }
    sendMessage(message) {
        let json = JSON.stringify(message);
        this.socket.send(json, 0, json.length, 9898, '224.0.0.50');
    }
    sensorFactory(sid, model) {
        let sensor = null;
        switch (model) {
            case this.sensorTypes.gateway:
                sensor = new Gateway_1.default(sid, this);
                break;
            case this.sensorTypes.th:
                sensor = new THSensor_1.default(sid, this);
                break;
            case this.sensorTypes.magnet:
                sensor = new DoorSensor_1.default(sid, this);
                break;
            case this.sensorTypes.button:
                sensor = new Button_1.default(sid, this);
                break;
            case this.sensorTypes.plug:
                sensor = new Plug_1.default(sid, this);
                break;
            case this.sensorTypes.motion:
                sensor = new MotionSensor_1.default(sid, this);
                break;
            default:
                throw new Error('Type `' + model + '` is not valid, use one of  Hub::sensorTypes');
        }
        this.registerSensor(sensor);
        return sensor;
    }
    getSensor(sid) {
        return this.sensors[sid] ? this.sensors[sid] : null;
    }
    registerSensor(sensor) {
        this.sensors[sensor.sid] = sensor;
    }
}
exports.Hub = Hub;
//# sourceMappingURL=Hub.js.map