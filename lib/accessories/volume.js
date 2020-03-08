let VolumeService      = require('../services/volume');
let InformationService = require('../services/information');

let Homebridge, Platform;

module.exports = class Volume {
    constructor(config, device, platform, homebridge) {
        Platform   = platform;
        Homebridge = homebridge;

        this.device   = device;
        this.config   = config;
        this.type     = 'volume';
        this.UUID     = Homebridge.hap.uuid.generate(this.device.UUID + this.config.identifier + 'Volume')

        this.services = {};

        this.platformAccessory = new Homebridge.platformAccessory(`${this.device.config.name} Volume`, this.UUID);
        this.platformAccessory.reachable = true;

        this.createServices();
    }

    createServices() {
        // Services
        this.services.main        = new VolumeService(this, Homebridge);
        this.services.information = new InformationService(this, Homebridge);

        // Add services
        this.getServices().forEach(service => {
            try {
                this.platformAccessory.addService(service);
            } catch(error) { }
        });
    }

    getServices() {
        return Object.values(this.services).map(type => type.service);
    }
}
