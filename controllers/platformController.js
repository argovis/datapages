const moment = require('moment')
const got = require('got');
const mutates = require('../public/javascripts/mutates')

// Display platform detail form on GET
exports.platform_detail = function (req, res, next) {
    req.sanitize('platform_number').escape()
    req.sanitize('platform_number').trim()
    req.checkQuery('platform_number', 'platform_number should be numeric.').isNumeric()
    const platform_number = JSON.parse(req.params.platform_number)
    
    got('http://api:8080/profiles?platforms='+platform_number+'&coreMeasurements=all').then(
        (resdata) => {
            profiles = JSON.parse(resdata.body).map(p => mutates.profile_mutate(p))

            if (req.params.format==='page'){
                if (profiles.length === 0) { res.send('platform not found') }
                else {
                    res.render('platform_page', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
                }
            }
            else if (req.params.format==='page2'){
                if (profiles.length === 0) { res.send('platform not found') }
                else {
                    res.render('platform_page_2', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
                }
            }
            // else if (req.params.format==='bgcPage'){
            //     if (profiles.length === 0) { res.send('platform not found') }
            //     else {
            //         res.render('bgc_platform_page', {title:req.params.platform_number, profiles: JSON.stringify(profiles), moment: moment })
            //     }
            // }
            else{
                if (profiles.length === 0) { res.send('platform not found') }
                else {
                    res.json(profiles)
                }
            }
        },
        (rej) => {
            return next(err)
        }
    )    
}