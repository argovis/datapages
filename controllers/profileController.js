const got = require('got');
const moment = require('moment')
const mutates = require('../public/javascripts/mutates')

exports.profile_detail = function (req, res, next) {
    req.checkParams('_id', 'Profile id should be specified.').notEmpty()
    req.sanitize('_id').escape()
    const errors = req.validationErrors();
    if (errors) {
      res.send('There have been validation errors: ' + util.inspect(errors), 400);
      return;
    }
    else {
        let endpoint = 'http://api:8080/profiles?ids='.concat(req.params._id)
        if (req.params.format==='page') {
            endpoint = endpoint.concat('&coreMeasurements=all')
        }
        if (req.params.format==='bgcPage') {
            endpoint = endpoint.concat('&bgcMeasurements=all')
        }

        got(endpoint).then(
            (resdata) => {
                profile = mutates.profile_mutate(JSON.parse(resdata.body)[0])
                if (req.params.format==='page'){
                    if (profile === null) { res.send('profile not found') }
                    else {
                        profileDate = moment.utc(profile.date).format('YYYY-MM-DD HH:mm')
                        res.render('profile_page', {title: req.params._id, profile: profile,
                                                           measurements: JSON.stringify(profile.measurements),
                                                           platform_number: profile.platform_number,
                                                           profileDate: profileDate})
                    }
                }
                else if (req.params.format==='bgcPage'){
                    if (profile === null) { res.send('profile not found') }
                    if (profile.bgcMeas === null) { res.send('profile does not have bgc') }
                    else {
                        profileDate = moment.utc(profile.date).format('YYYY-MM-DD HH:mm')
                        res.render('bgc_profile_page', {title: req.params._id, profile: profile,
                                                        platform_number: profile.platform_number,
                                                        paramKeys: profile.bgcMeasKeys, profileDate: profileDate})
                    }
                }
            },
            (rej) => {
                return next(err)
            }
        ) 
    }
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
        },
        (rej) => {
            return next(err)
        }
    )
}

