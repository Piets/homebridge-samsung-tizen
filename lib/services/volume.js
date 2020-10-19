const request = require("request");

let Hap;

const { TvOfflineError } = require('../errors');

module.exports = class Volume {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device    = accessory.device;
        this.accessory = accessory;
        this.service   = this.accessory.platformAccessory.getService(Hap.Service.Lightbulb);

        this.muted = false;
        this.volume = 50;

        this.createService();
    }

    createService() {
        this.service = this.service || new Hap.Service.Lightbulb(`${this.device.config.name} Volume`, `volume_${this.accessory.config.identifier}`);

        this.service.getCharacteristic(Hap.Characteristic.On)
            .on('get', this.getOn.bind(this))
            .on('set', this.setOn.bind(this));

        this.service.getCharacteristic(Hap.Characteristic.Brightness)
            .on('get', this.getVolume.bind(this))
            .on('set', this.setVolume.bind(this));
    }

    getValue() {
        this.loadData((muted, volume) => {
            this.service.getCharacteristic(Hap.Characteristic.Brightness).updateValue(volume);
            this.service.getCharacteristic(Hap.Characteristic.On).updateValue(muted === false && volume > 0);
        });
    }

    getOn(callback) {
        // On means not muted and volume > 0
        this.loadData((muted, volume) => {
            callback(null, muted === false && volume > 0);
        });
    }

    getVolume(callback) {
        this.loadData((muted, volume) => {
            callback(null, volume);
        });
    }

    setOn(value, callback) {
        // Unmute if muted, increase volume to 1 if 0
        this.loadData((muted, volume) => {
            if (value) {
                if (muted) {
                    request(`http://${this.device.config.speakerIP}/unmute`);
                }

                if (volume < 1) {
                    request(`http://${this.device.config.speakerIP}/setVolume?volume=1`);
                }
            } else {
                // Mute
                request(`http://${this.device.config.speakerIP}/mute`);
            }

            callback();
        });
    }

    setVolume(value, callback) {
        request(`http://${this.device.config.speakerIP}/setVolume?volume=${value}`, function(error, response, body) {
            if (error && this.device !== undefined && this.device.log) {
                this.device.log.debug(error.stack);
            }

            callback();
        });
    }

    // Helper to load cached data
    loadData(callback) {
        request(`http://${this.device.config.speakerIP}/`, function(error, response, body) {
            if (error) {
                if (this.device !== undefined && this.device.log) {
                    this.device.log.debug(error.stack);
                }
                callback(this.muted, this.volume);
                return;
            }

            let data = JSON.parse(body);
            this.muted = data.muted === true;
            this.volume = data.volume;

            callback(this.muted, this.volume);
        });
    }
}
