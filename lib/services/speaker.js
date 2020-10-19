const request = require("request");

let Hap;

module.exports = class Speaker {
    constructor(accessory, homebridge) {
        Hap = homebridge.hap;

        this.device = accessory.device;

        this.muted = false;
        this.volume = 50;

        this.createService();

        let self = this;

        setInterval(() => {
            request(`http://${this.device.config.speakerIP}/`, function(error, response, body) {
                if (error) {
                    return;
                }

                let data = JSON.parse(body);
                self.service.getCharacteristic(Hap.Characteristic.Volume).updateValue(data.volume);
                self.service.getCharacteristic(Hap.Characteristic.Mute).updateValue(data.muted === true);
            });
        }, 2500);
    }

    createService() {
        this.service = new Hap.Service.TelevisionSpeaker(this.device.config.name + ' Volume')
            .setCharacteristic(Hap.Characteristic.Active, Hap.Characteristic.Active.ACTIVE)
            .setCharacteristic(Hap.Characteristic.VolumeControlType, Hap.Characteristic.VolumeControlType.ABSOLUTE);

        this.service.getCharacteristic(Hap.Characteristic.VolumeSelector)
            .on('set', this.incDecVolume.bind(this));

        this.service.getCharacteristic(Hap.Characteristic.Volume)
            .on('get', this.getVolume.bind(this))
            .on('set', this.setVolume.bind(this));

        this.service.getCharacteristic(Hap.Characteristic.Mute)
            .on('get', this.getMute.bind(this))
            .on('set', this.setMute.bind(this));

        this.service.linked = true;
    }

    incDecVolume(value, callback) {
        let method = value ? 'decreaseVolume' : 'increaseVolume';

        request(`http://${this.device.config.speakerIP}/${method}`, function(error, response, body) {
            if (error && this.device && this.device.log) {
                this.device.log.debug(error.stack);
            }

            callback();
        });
    }

    getVolume(callback) {
        this.loadData((muted, volume) => {
            callback(null, volume);
        });
    }

    setVolume(value, callback) {
        request(`http://${this.device.config.speakerIP}/setVolume?volume=${volume}`, function(error, response, body) {
            if (error && this.device && this.device.log) {
                this.device.log.debug(error.stack);
            }

            callback();
        });
    }

    getMute(callback) {
        this.loadData((muted, volume) => {
            callback(null, muted);
        });
    }

    setMute(value, callback) {
        let method = value ? 'mute' : 'unmute';

        request(`http://${this.device.config.speakerIP}/${method}`, function(error, response, body) {
            if (error && this.device && this.device.log) {
                this.device.log.debug(error.stack);
            }

            callback();
        });
    }

    // Helper to load cached data
    loadData(callback) {
        request(`http://${this.device.config.speakerIP}/`, function(error, response, body) {
            if (error) {
                if (this.device && this.device.log) {
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
