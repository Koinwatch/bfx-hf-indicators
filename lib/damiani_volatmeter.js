'use strict'

const _isFinite = require('lodash/isFinite')

const Indicator = require('./indicator')
const _max = require('lodash/max')

const ATR = require('./atr')
const STDDEV = require('./stddev')

class DamianiVolatmeter extends Indicator{
    constructor(args = []) {
        const [InpViscosity, InpSedimentation, InpThreshold, InpLagSuppressor] = args

        super({
            args,
            id: DamianiVolatmeter.id,
            name: `DamianiVolatmeter(${InpViscosity}, ${InpSedimentation}, ${InpThreshold})`,
            seedPeriod: 20
        })


        //Buffer Arrays
        this._BufferP = []
        this._BufferM = []
        this._BufferATRV = []
        this._BufferATRS = []
        this._BufferDevV = []
        this._BufferDevS = []

        //viscosity=int(InpViscosity<1 ? 1 : InpViscosity);
        if(InpViscosity < 1)
            this._viscosity = 1
        else
            this._viscosity = InpViscosity

        //sedimentation=int(InpSedimentation<2 ? 2 : InpSedimentation);
        if(InpSedimentation < 2)
            this._sedimentation = 2     
        else
            this._sedimentation = InpSedimentation  
   
        this._period_max = _max([this._viscosity, this._sedimentation])
      
        this._threshold = InpThreshold
        this._inpLagSuppressor = InpLagSuppressor
        this._handle_atrv = new ATR([this._viscosity])
        this._handle_atrs = new ATR([this._sedimentation])
        this._handle_devv = new STDDEV([this._viscosity])
        this._handle_devs = new STDDEV([this._sedimentation])
    }

    reset () {
        super.reset()
    
        this._BufferP = []
        this._BufferM = []
        this._BufferATRV = []
        this._BufferATRS = []
        this._BufferDevV = []
        this._BufferDevS = []

        if(this._handle_atrv) this._handle_atrv.reset()
        if(this._handle_atrs) this._handle_atrs.reset()
        if(this._handle_devv) this._handle_devv.reset()
        if(this._handle_devs) this._handle_devs.reset()
      }

    static unserialize (args = []) {
        return new DamianiVolatmeter(args)
      }

    update(value){
        this._handle_atrv.update(value)
        this._handle_atrs.update(value)
        this._handle_devv.update(value.close)
        this._handle_devs.update(value.close)

        this._BufferATRV.push(this._handle_atrv.v())    
        this._BufferATRS.push(this._handle_atrs.v())
        this._BufferDevV.push(this._handle_devv.v())
        this._BufferDevS.push(this._handle_devs.v())

        const atr_v = this._BufferATRV.slice(-1).pop()
        const atr_s = this._BufferATRS.slice(-1).pop()
        const std_dev_v = this._BufferDevV.slice(-1).pop()
        const std_dev_s = this._BufferDevS.slice(-1).pop()      

        if(_isFinite(atr_v) && _isFinite(atr_s) && _isFinite(std_dev_v) &&_isFinite(std_dev_s) && atr_s !=0 && std_dev_s != 0){
            let s1 = this._BufferP[this._BufferP.length - 1]
            let s3 = this._BufferP[this._BufferP.length - 3]

            if(this._inpLagSuppressor && _isFinite(s1) && _isFinite(s3))
                this._BufferP.push(atr_v/atr_s + (s1 - s3)/2)
            else
                this._BufferP.push(atr_v/atr_s)
            
            this._BufferM.push(this._threshold - std_dev_v/std_dev_s)
        }
                
        return super.add({
            dv_m: this._BufferM[this._BufferM.length - 1],
            dv_p: this._BufferP[this._BufferP.length - 1]
        })
    }

    add(value){
        this._handle_atrv.add(value)
        this._handle_atrs.add(value)
        this._handle_devv.add(value.close)
        this._handle_devs.add(value.close)

        this._BufferATRV.push(this._handle_atrv.v())    
        this._BufferATRS.push(this._handle_atrs.v())
        this._BufferDevV.push(this._handle_devv.v())
        this._BufferDevS.push(this._handle_devs.v())

        const atr_v = this._BufferATRV.slice(-1).pop()
        const atr_s = this._BufferATRS.slice(-1).pop()
        const std_dev_v = this._BufferDevV.slice(-1).pop()
        const std_dev_s = this._BufferDevS.slice(-1).pop()      

        if(_isFinite(atr_v) && _isFinite(atr_s) && _isFinite(std_dev_v) &&_isFinite(std_dev_s) && atr_s !=0 && std_dev_s != 0){
            let s1 = this._BufferP[this._BufferP.length - 1]
            let s3 = this._BufferP[this._BufferP.length - 3]

            if(this._inpLagSuppressor && _isFinite(s1) && _isFinite(s3))
                this._BufferP.push(atr_v/atr_s + (s1 - s3)/2)
            else
                this._BufferP.push(atr_v/atr_s)
            
            this._BufferM.push(this._threshold - std_dev_v/std_dev_s)
        }
                
        return super.add({
            dv_m: this._BufferM[this._BufferM.length - 1],
            dv_p: this._BufferP[this._BufferP.length - 1]
        })
    }

    ready() {
        return _isObject(this.v())
    }
}

DamianiVolatmeter.id = 'Damiani'
DamianiVolatmeter.label = 'DamianiVolatmeter'
DamianiVolatmeter.humanLabel = 'Damiani Volatmeter'

DamianiVolatmeter.ui = {
    position: 'external',
    type: 'DamianiVolatmeter'
}

DamianiVolatmeter.args = [{
    label: 'InpViscosity',
    default: 7
}, {
    label: 'InpSedimentation',
    default: 50
}, {
    label: 'InpThreshold',
    default: 1.1
},{
    label: 'InpLagSuppressor',
    default: true
}]

module.exports = DamianiVolatmeter