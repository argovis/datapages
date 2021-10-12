const got = require('got');
const moment = require('moment')
const mutates = require('../public/javascripts/mutates')

// const GJV = require('geojson-validation')
// const helper = require('../public/javascripts/controllers/profileHelperFunctions')
// const HELPER_CONST = require('../public/javascripts/controllers/profileHelperConstants')
// const util = require('util');
// // Display list of Profiles in a list of _ids
// exports.profile_list = function(req, res, next) {
//     req.checkQuery('ids', 'ids should be specified.').notEmpty()
//     //req.sanitize('ids').escape()
//     req.sanitize('ids').trim()
//     req.sanitize('presRange').escape()
//     req.sanitize('presRange').trim()

//     const errors = req.validationErrors()
//     if (errors) {
//       res.send('There have been validation errors: ' + util.inspect(errors), 400);
//       return;
//     }

//     const _ids = JSON.parse(req.query.ids.replace(/'/g, '"'))

//     let presRange = null
//     let maxPres = null
//     let minPres = null
//     if (req.query.presRange) {
//         presRange = JSON.parse(req.query.presRange)
//         maxPres = Number(presRange[1])
//         minPres = Number(presRange[0])
//     }

//     idMatch = {$match: {_id: { $in: _ids}}}
//     let idAgg = []
//     idAgg.push(idMatch)
//     if (presRange){
//         idAgg.push(helper.make_pres_project(minPres, maxPres, 'measurements'))
//     }
//     idAgg.push({$project: HELPER_CONST.PROF_PROJECT_WITH_PRES_RANGE_COUNT})
//     idAgg.push({$match: { count: {$gt: 0}}})
//     idAgg.push({$sort: { date: -1}})
//     const query = Profile.aggregate(idAgg)

//     query.exec( function (err, profiles) {
//         if (err) { 
//             // console.log('an error:', err)
//             return next(err)
//         }
//         // console.log('len prof: ', profiles.length)
//         res.json(profiles)
//     })
// }

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

// exports.select_profile_2d = function(req, res , next) {
//     req.checkQuery('startDate', 'startDate should be specified.').notEmpty()
//     req.checkQuery('endDate', 'endDate should be specified.').notEmpty()
//     req.checkQuery('llCorner', 'shape should be specified.').notEmpty()
//     req.checkQuery('urCorner', 'shape should be specified.').notEmpty()
//     req.sanitize('presRange').escape()
//     req.sanitize('presRange').trim()
//     req.sanitize('_id').escape()
//     req.sanitize('startDate').toDate()
//     req.sanitize('endDate').toDate()

//     const errors = req.validationErrors()
//     if (errors) {
//         res.send('There have been validation errors: ' + util.inspect(errors), 400)
//         return
//     }

//     const llCorner = JSON.parse(req.query.llCorner)
//     const urCorner = JSON.parse(req.query.urCorner)
//     const box = [llCorner, urCorner]
//     shapeBool = false

//     let presRange = null
//     let maxPres = null
//     let minPres = null
//     let deepOnly = null
//     let bgcOnly = null

//     if (req.query.presRange) {
//         presRange = JSON.parse(req.query.presRange)
//         maxPres = Number(presRange[1])
//         minPres = Number(presRange[0])
//     }


//     if (req.query.bgcOnly) {
//         bgcOnly = true
//     }

//     if (req.query.deepOnly) {
//         deepOnly = true
//     }

//     const startDate = moment.utc(req.query.startDate, 'YYYY-MM-DD')
//     const endDate = moment.utc(req.query.endDate, 'YYYY-MM-DD')
//     const dateDiff = endDate.diff(startDate)
//     const monthDiff = Math.floor(moment.duration(dateDiff).asMonths())
//     if (monthDiff > 3) {
//         throw new Error('time range exceeds 3 months. consider making query smaller')
//     }

//     req.getValidationResult().then(function (result) {
//     if (!result.isEmpty()) {
//         const errors = result.array().map(function (elem) {
//             return elem.msg
//         })
//         res.render('error', { errors: errors })
//     }
//     else {
//         let agg = []
//         if (req.params.format === 'map' && presRange) {
//             agg = helper.make_map_pres_agg(minPres, maxPres, box, startDate, endDate, shapeBool)
//         }
//         else if (req.params.format === 'map' && !presRange) {
//             agg = [ {$match: {geoLocation: {$geoWithin: {$box: box}}}},
//                     {$match:  {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}}},
//                     {$project: HELPER_CONST.MAP_PROJ},
//                     {$limit: 1001}
//             ]
//         }
//         else if (req.params.format !== 'map' && presRange) {
//             agg = helper.make_pres_agg(minPres, maxPres, box, startDate, endDate, shapeBool)
//         }
//         else {
//             agg = [ {$match: {geoLocation: {$geoWithin: {$box: box}}}},
//                     {$match:  {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}}}
//             ]
//         }
//         if (deepOnly) {
//             agg.push({$match: {isDeep: true}})
//         }
//         if (bgcOnly) {
//             agg.push({$match: {containsBGC: true}})
//         }
//         agg.push({$sort: { date: -1}}) // TODO: test if this causes slowdown)
//         const query = Profile.aggregate(agg)
//         const promise = query.exec()
//         promise
//         .then(function (profiles) {
//             //create virtural fields.
//             profiles = helper.make_virtural_fields(profiles)

//             //render page
//             if (req.params.format==='page'){
//                 if (profiles === null) { res.send('profile not found') }
//                 else {
//                     res.render('selected_profile_page', {title:'Custom box selection', profiles: JSON.stringify(profiles), moment: moment, url: req.originalUrl })
//                 }
//             }
//             else {
//                 res.json(profiles)
//             }
//         })
//         .catch(function(err) { return next(err)})
//     }})
// }

