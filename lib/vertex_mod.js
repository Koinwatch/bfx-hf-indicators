'use strict'

const debug = require('debug')('bfx:hf:indicators: By Roman examples:vm')
const _isFinite = require('lodash/isFinite')
const Indicator = require('./indicator')
const SMA = require('./sma')
const BB = require('./bbands')

class VertexMod extends Indicator{
    constructor(args = []){
        const [Processed, Control_Period, Signal_Period, BB_Up_Period, BB_Up_Deviation, BB_Dn_Period, BB_Dn_Deviation] = args

        super({
            args,
            id: VertexMod.id,
            name: `VertexMode`,
            seedPeriod: 1440  // for daily
        })

        this._Processed = Processed
        this._Control_Period = Control_Period
        this._Signal_Period = Signal_Period
        this._BB_Up_Period = BB_Up_Period
        this._BB_Up_Deviation = BB_Up_Deviation
        this._BB_Dn_Period = BB_Dn_Period
        this._BB_Dn_Deviation = BB_Dn_Deviation

        this._ind_buf_ver = []      // vertex buffer
        this._ind_buf_signal = []   // signal buffer
        this._ind_buf_bbu = []      // bollinger band up buffer
        this._ind_buf_bbn = []      // bollinger band down buffer
        this._high = []
        this._low = []
        this._close = []
        
        this._sma = new SMA([this._Signal_Period])
        this._bbu = new BB([this._BB_Up_Period, this._BB_Up_Deviation])
        this._bbn = new BB([this._BB_Dn_Period, this._BB_Dn_Deviation])
    }

    static unserialize(args = []) {
        return new VertexMod(args)
    }

    reset() {
        super.reset()

        this._ind_buf_ver = []
        this._ind_buf_signal = []
        this._ind_buf_bbu = []
        this._ind_buf_bbn = []
        this._high = []
        this._low = []
        this._close = []

        if (this._sma) this._sma.reset()
        if (this._bbu) this._bbu.reset()
        if (this._bbn) this._bbn.reset()

    }

    update(candle){
        const { high, low, close } = candle
        this._high[this._high.length] = high
        this._low[this._low.length] = low
        this._close[this._close.length] = close

        let price_high = 0
        let price_close = 0
        let price_low = 0
        let counter = 0
        let complex_up = 0
        let complex_dn = 0
        let trigger_high = -999999
        let trigger_low  = 999999
        let sum_up = 0
        let sum_dn = 0

        while(counter < this._Control_Period){
            sum_up = 0
            sum_dn = 0

            price_high = this._high[this._high.length - counter - 1]        //Для теста  + 1
            price_low = this._low[this._low.length - counter - 1]            //Для теста  + 1
            price_close = this._close[this._close.length - counter - 1]       //Для теста  + 1

            if (price_high > trigger_high) {
                trigger_high = price_high
                sum_up += price_close
            }
            if (price_low  < trigger_low ) {
                trigger_low  = price_low
                sum_dn += price_close
            }

            counter++
            complex_up += sum_up
            complex_dn += sum_dn
        }

        if (_isFinite(complex_dn) && _isFinite(complex_up) && complex_dn != 0 &&  complex_up != 0){
            const vertex_mod_val = (complex_dn / complex_up) - (complex_up / complex_dn)

            this._ind_buf_ver.push(vertex_mod_val)

            this._sma.update(vertex_mod_val)
            this._bbu.update(vertex_mod_val)
            this._bbn.update(vertex_mod_val)

            this._ind_buf_signal.push(this._sma.v())
            this._ind_buf_bbu.push(this._bbu.v().top)
            this._ind_buf_bbn.push(this._bbn.v().bottom)
        }

        return super.update({
            vertex_mod: this._ind_buf_ver[this._ind_buf_ver.length - 1],
            signal: this._ind_buf_signal[this._ind_buf_signal.length - 1],
            band_up: this._ind_buf_bbu[this._ind_buf_bbu.length - 1],
            band_dn: this._ind_buf_bbn[this._ind_buf_bbn.length - 1]
        })
    }
    add(candle){
        const { high, low, close } = candle
        this._high.push(high)
        this._low.push(low)
        this._close.push(close)

        let price_high = 0
        let price_close = 0
        let price_low = 0
        let counter = 0
        let complex_up = 0
        let complex_dn = 0
        let trigger_high = -999999
        let trigger_low  = 999999
        let sum_up = 0
        let sum_dn = 0

        while(counter < this._Control_Period){
            sum_up = 0
            sum_dn = 0

            price_high = this._high[this._high.length - counter - 1]        //Для теста  + 1
            price_low = this._low[this._low.length - counter - 1]            //Для теста  + 1
            price_close = this._close[this._close.length - counter - 1]       //Для теста  + 1

            if (price_high > trigger_high) {
                trigger_high = price_high
                sum_up += price_close
            }
            if (price_low  < trigger_low ) {
                trigger_low  = price_low
                sum_dn += price_close
            }

            counter++
            complex_up += sum_up
            complex_dn += sum_dn
        }

        if (_isFinite(complex_dn) && _isFinite(complex_up) && complex_dn != 0 &&  complex_up != 0){
            const vertex_mod_val = (complex_dn / complex_up) - (complex_up / complex_dn)

            this._ind_buf_ver.push(vertex_mod_val)

            this._sma.add(vertex_mod_val)
            this._bbu.add(vertex_mod_val)
            this._bbn.add(vertex_mod_val)

            this._ind_buf_signal.push(this._sma.v())
            this._ind_buf_bbu.push(this._bbu.v().top)
            this._ind_buf_bbn.push(this._bbn.v().bottom)
        }

        return super.add({
            vertex_mod: this._ind_buf_ver[this._ind_buf_ver.length - 1],
            signal: this._ind_buf_signal[this._ind_buf_signal.length - 1],
            band_up: this._ind_buf_bbu[this._ind_buf_bbu.length - 1],
            band_dn: this._ind_buf_bbn[this._ind_buf_bbn.length - 1]
        })
    }

    ready () {
        return _isObject(this.v())
    }
}

VertexMod.id = 'VertexMod'
VertexMod.label = 'VertexMod'
VertexMod.humanLabel = 'VertexMod'

VertexMod.ui = {
    position: 'external',
    type: 'vertex mod'
}

VertexMod.args = [{
    label: 'Processed',
    default: 2000
}, {
    label: 'Control_Period',
    default: 14
}, {
    label: 'Signal_Period',
    default: 5
}, {
    label: 'BB_Up_Period',
    default: 12
}, {
    label: 'BB_Up_Deviation',
    default: 2
}, {
    label: 'BB_Dn_Period',
    default: 12
}, {
    label: 'BB_Dn_Deviation',
    default: 2
}]

module.exports = VertexMod