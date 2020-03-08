let Homebridge;
let Device  = require('./lib/device');
let Storage = require('./lib/storage');

const PLUGIN_NAME   = 'homebridge-samsung-tizen';
const PLATFORM_NAME = 'SamsungTizen';

module.exports = (homebridge) => {
    Homebridge = homebridge;
    Homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, SamsungPlatform, true);
}

class SamsungPlatform {
    constructor(log, config, api) {
        if (!config) { return; }

        this.log     = log;
        this.api     = api;
        this.storage = new Storage(api);

        this.cachedAccessories = [];

        this.config = {
            delay    : config.delay,
            keys     : config.keys || {},
            inputs   : config.inputs || [],
            devices  : config.devices || [],
            switches : config.switches || [],
            method   : config.method || 'wss',
            refresh  : config.refresh,
            timeout  : config.timeout
        };

        if (this.api) {
            this.api.on('didFinishLaunching', this.init.bind(this));
        }
    }

    async init() {
        await this.storage.init();

        for (let device of this.config.devices) {
            let externalAccessory = null;

            device = new Device(device, this, Homebridge);

            for (let index in device.accessories) {
                let accessory = device.accessories[index];

                if (accessory.type == 'television') {
                    externalAccessory = accessory.platformAccessory;
                }

                if (accessory.type == 'switch' && externalAccessory) {
                    externalAccessory.addService(accessory.services.main.service);
                }

                if (accessory.type == 'volume' && externalAccessory) {
                    externalAccessory.addService(accessory.services.main.service);
                }
            }

            this.api.publishExternalAccessories(PLUGIN_NAME, [externalAccessory]);
        }

        for (let cachedAccessory of this.cachedAccessories) {
            this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [cachedAccessory]);
        }
    }

    configureAccessory(accessory) {
        if (this.cachedAccessories) {
            this.cachedAccessories.push(accessory);
        }
    }
}
