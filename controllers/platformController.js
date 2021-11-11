const moment = require('moment')
const got = require('got');
const mutates = require('../public/javascripts/mutates')
const helpers = require('./helpers')

// Display platform detail form on GET
exports.platform_detail = function (req, res, next) {
    //const platform_number = JSON.parse(req.params.platform_number)
    const platform_number = req.params.platform_number
    
    got('http://api:8080/profiles?platforms='+platform_number+'&coreMeasurements=all', helpers.headers).then(
        (resdata) => {
            profiles = JSON.parse(resdata.body).map(p => mutates.profile_mutate(p))

            if (req.params.format==='page'){
                res.render('platform_page', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
            }
            else if (req.params.format==='page2'){
                res.render('platform_page_2', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
            }
            else if (req.params.format==='bgcPage'){
                res.render('bgc_platform_page', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
            }
            else{
                res.render('error', {message: 'Path not found; should end in <platform_number>/page or <platform_number>/page2 or <platform_number>/bgcPage.'})    
            }
        }
    ).catch(
        (err) => res.render('error', err)
    )    
}