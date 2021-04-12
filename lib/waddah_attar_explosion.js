'use strict'

const _isFinite = require('lodash/isFinite')

const Indicator = require('./indicator')
const MACD = require('./macd')
const BollingerBands = require('./bbands')

class WaddahAttarExplosion extends Indicator {
    constructor(args = []) {
        const [Sensetive, DeadZonePip] = args

        super({
            args,
            id: WaddahAttarExplosion.id,
            name: `WaddahAttarExplosion(${Sensetive})`,
            seedPeriod: 44
        })

        this._ind_buffer1 = []
        this._ind_buffer2 = []
        this._ind_buffer3 = []
        this._ind_buffer4 = []
        this._macd = new MACD([20, 40, 9])
        this._bbands = new BollingerBands([20, 2])
        this._Sensetive = Sensetive;
        this._DeadZonePip = DeadZonePip;
    }

    static unserialize(args = []) {
        return new WaddahAttarExplosion(args)
    }

    reset() {
        super.reset()

        this._ind_buffer1 = []
        this._ind_buffer2 = []
        this._ind_buffer3 = []
        this._ind_buffer4 = []

        if (this._macd) this._macd.reset()
        if (this._bbands) this._bbands.reset()

    }


    update(value) {

        this._macd.update(value)
        this._bbands.update(value)

        if (!this.ready()) {
            return this.v()
        }
        const trend1 = (this._macd.v().macd - this._macd.prev(1).macd) * this._Sensetive
        const trend2 = (this._macd.prev(2).macd - this._macd.prev(3).macd) * this._Sensetive
        const explo1 = (this._bbands.v().top - this._bbands.v().bottom)
        const explo2 = (this._bbands.prev(1).top - this._bbands.prev(1).bottom)


        if (trend1 >= 0) {
            this._ind_buffer1[this._ind_buffer1.length - 1] = trend1
        } else {
            this._ind_buffer1[this._ind_buffer1.length - 1] = 0
        }
        if (trend1 < 0) {
            this._ind_buffer2[this._ind_buffer2.length - 1] = -1 * trend1
        } else {
            this._ind_buffer2[this._ind_buffer2.length - 1] = 0
        }
        this._ind_buffer3[this._ind_buffer3.length - 1] = explo1
        this._ind_buffer4[this._ind_buffer4.length - 1] = this._DeadZonePip

        return super.update({
            bulls: this._ind_buffer1[this._ind_buffer1.length - 1],
            bear: this._ind_buffer2[this._ind_buffer2.length - 1],
            bands: this._ind_buffer3[this._ind_buffer3.length - 1],
            level: this._ind_buffer4[this._ind_buffer4.length - 1]
        })
    }

    add(value) {

        this._macd.add(value)
        this._bbands.add(value)

        if (!this.ready()) {
            return this.v()
        }

        const trend1 = (this._macd.v().macd - this._macd.prev(1).macd) * this._Sensetive
        const trend2 = (this._macd.prev(2).macd - this._macd.prev(3).macd) * this._Sensetive
        const explo1 = (this._bbands.v().top - this._bbands.v().bottom)
        //const explo2 = (this._bbands.prev(1).top - this._bbands.prev(1).bottom)


        if (trend1 >= 0 && trend1 > explo1 && trend1 >= trend2) {
            this._ind_buffer1.push(trend1);
        } else {
            this._ind_buffer1.push(0);
        }
        if (trend1 < 0 &&  (0-trend1) > explo1 && trend1 <= trend2) {
            this._ind_buffer2.push(-1 * trend1);
        } else {
            this._ind_buffer2.push(0)

        }
        this._ind_buffer3.push(explo1);
        this._ind_buffer4.push(this._DeadZonePip);

        return super.add({
            bulls: this._ind_buffer1[this._ind_buffer1.length - 1],
            bear: this._ind_buffer2[this._ind_buffer2.length - 1],
            bands: this._ind_buffer3[this._ind_buffer3.length - 1],
            level: this._ind_buffer4[this._ind_buffer4.length - 1]
        })
    }

    ready() {
        return (this._macd.l() > 44)
    }
}

WaddahAttarExplosion.id = 'WAE'
WaddahAttarExplosion.label = 'WaddahAttarExplosion'
WaddahAttarExplosion.humanLabel = 'WaddahAttarExplosion'
WaddahAttarExplosion.ui = {
    position: 'external',
    type: 'macd'
}

WaddahAttarExplosion.args = [{
    label: 'Sensetive',
    default: 150
}, {
    label: 'DeadZonePip',
    default: 0.0030
}]

module.exports = WaddahAttarExplosion