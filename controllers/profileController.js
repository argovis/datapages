const got = require('got');
const moment = require('moment')
const mutates = require('../public/javascripts/mutates')

exports.profile_detail = function (req, res, next) {

    let endpoint = 'http://api:8080/profiles?ids='.concat(req.params._id)
    if (req.params.format==='page') {
        endpoint = endpoint.concat('&coreMeasurements=all')
    } else if (req.params.format==='bgcPage') {
        endpoint = endpoint.concat('&bgcMeasurements=all')
    } else {
        res.render('error', {message: 'Path not found; should end in <profile ID>/page or <profile ID>/bgcPage.'}) 
    }

    got(endpoint).then(
        (resdata) => {
            profile = mutates.profile_mutate(JSON.parse(resdata.body)[0])
            if (req.params.format==='page'){
                profileDate = moment.utc(profile.date).format('YYYY-MM-DD HH:mm')
                res.render('profile_page', {title: req.params._id, profile: profile,
                                                   measurements: JSON.stringify(profile.measurements),
                                                   platform_number: profile.platform_number,
                                                   profileDate: profileDate})
            }
            else if (req.params.format==='bgcPage'){
                profileDate = moment.utc(profile.date).format('YYYY-MM-DD HH:mm')
                res.render('bgc_profile_page', {title: req.params._id, profile: profile,
                                                platform_number: profile.platform_number,
                                                paramKeys: profile.bgcMeasKeys, profileDate: profileDate})
            }
        }
    ).catch(
        (err) => res.render('error', {message: JSON.parse(err.response.body).message})
    )  
}

exports.selected_profile_list = function(req, res , next) {

    let endpoint = 'http://api:8080/profiles?'.concat(req._parsedUrl.query);
    got(endpoint).then(
        (resdata) => {
            profiles = JSON.parse(resdata.body).map(p => mutates.profile_mutate(p))
            console.log(profiles.length)
            if (profiles.length === 0 ) res.send('profile not found')
            else {
                res.render('selected_profile_page', {title:'Custom selection', profiles: JSON.stringify(profiles), moment: moment, url: req.originalUrl })
            }
        }
    ).catch(
        (err) => res.render('error', {message: JSON.parse(err.response.body).message})
    )  
}

