const HELPER_CONST = require('./profileHelperConstants')


const presSliceProject = function(minPres, maxPres) {
    const psp = {$project: { //need to include all fields that you wish to keep.
        nc_url: 1,
        position_qc: 1,
        date_qc: 1,
        BASIN: 1,
        cycle_number: 1,
        dac: 1,
        date:1,
        lat: 1,
        lon: 1,
        platform_number: 1,
        geoLocation: 1,
        station_parameters: 1,
        maximum_pressure: 1,
        POSITIONING_SYSTEM: 1,
        DATA_MODE: 1,
        PLATFORM_TYPE: 1,
        measurements: {
            $filter: {
                input: '$measurements',
                as: 'item',
                cond: { 
                    $and: [
                        {$gt: ['$$item.pres', minPres]},
                        {$lt: ['$$item.pres', maxPres]}
                    ]},
            },
        },
    }}
    return(psp)
}


const reduceIntpMeas = function(intPres) {
    console.log('inside reduceIntpMeas')
    const rim = [{$project: { // create lower and upper measurements
        position_qc: 1,
        date_qc: 1,
        BASIN: 1,
        cycle_number: 1,
        dac: 1,
        date:1,
        lat: 1,
        lon: 1,
        platform_number: 1,
        DATA_MODE: 1,
        measurements: 1,
        count: 1,
        upperMeas: {
            $filter: {
                input: '$measurements',
                as: 'item',
                cond: { $lt: ['$$item.pres', intPres]}      
            },
        },
        lowerMeas: {
            $filter: {
                input: '$measurements',
                as: 'item',
                cond: { $gte: ['$$item.pres', intPres]}      
            },
        },
    }},
    {$project: { // slice lower and upper measurements
        position_qc: 1,
        date_qc: 1,
        BASIN: 1,
        cycle_number: 1,
        dac: 1,
        date:1,
        lat: 1,
        lon: 1,
        platform_number: 1,
        DATA_MODE: 1,
        lowerMeas: { $slice: [ '$lowerMeas', 2 ] },
        upperMeas: { $slice: [ '$upperMeas', 2 ] },
    }},
    {$project: { //combine upper and lower measurements into one array
        position_qc: 1,
        date_qc: 1,
        BASIN: 1,
        cycle_number: 1,
        dac: 1,
        date:1,
        lat: 1,
        lon: 1,
        platform_number: 1,
        DATA_MODE: 1,
        measurements: { $concatArrays: [ "$upperMeas", "$lowerMeas" ] }  
    }},
    ]
    return rim
}

const make_match = function(startDate, endDate, basin) {
    let match
    if (basin) {
        match = {$match:  {$and: [ {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}},
                        {BASIN: basin}]}
                }
    }
    else{
        match = { $match: {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}} }
    }
    return match

}

const make_map_pres_agg = function(minPres, maxPres, shapeJson, startDate, endDate) {
    let agg = [{$project: { // this projection has to be defined here
            platform_number: -1,
            date: -1,
            geoLocation: 1,
            cycle_number: -1,
            containsBGC: 1,
            isDeep: 1,
            DIRECTION: 1,
            measurements: {
                $filter: {
                    input: '$measurements',
                    as: 'item',
                    cond: {
                        $and: [
                            {$gt: ['$$item.pres', minPres]},
                            {$lt: ['$$item.pres', maxPres]}
                        ]},
                },
            },
            DATA_MODE: -1,
            core_data_mode: 1,
        }},
        { $match: { $and: [ {geoLocation: {$geoWithin: {$geometry: shapeJson}}},
                            {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}} ] } },
        {$project: HELPER_CONST.MAP_PROJ_WITH_COUNT},
        {$match: {count: {$gt: 0}}},
        {$project: HELPER_CONST.MAP_PROJ},
        {$limit: 1001},
        ]
    return agg
}
    
const make_pres_agg = function(minPres, maxPres, shapeJson, startDate, endDate) {

    let presProj = make_pres_project(minPres, maxPres)
    console.log(presProj)
    const pres_agg = [
        {$match: {geoLocation: {$geoWithin: {$geometry: shapeJson}}}},
        {$match:  {date: {$lte: endDate.toDate(), $gte: startDate.toDate()}}},
        presProj,
        {$project: HELPER_CONST.PROF_PROJECT_WITH_PRES_RANGE_COUNT},
        {$match: {count: {$gt: 0}}},
        {$sort: { date: -1}},
    ]
    return pres_agg
}

const make_pres_project = function(minPres, maxPres) {
    let presProjectItems = HELPER_CONST.PROF_PROJ_PARAMS_BASE
    presProjectItems.measurements = {
        $filter: {
            input: '$measurements',
            as: 'item',
            cond: { 
                $and: [
                    {$gt: ['$$item.pres', minPres]},
                    {$lt: ['$$item.pres', maxPres]}
                ]},
        },
    }
    const presProj = {$project: presProjectItems}
    return presProj
}

const make_virtural_fields = function(profiles){
    for(let idx=0; idx < profiles.length; idx++){
        let core_data_mode
        if (profiles[idx].DATA_MODE) {
            core_data_mode = profiles[idx].DATA_MODE
        }
        else if (profiles[idx].PARAMETER_DATA_MODE) {
            core_data_mode = profiles[idx].PARAMETER_DATA_MODE[0]
        }
        else {
            core_data_mode = 'Unknown'
        }
        profiles[idx].core_data_mode = core_data_mode

        let lat = profiles[idx].lat
        let lon = profiles[idx].lon
        profiles[idx].roundLat = Number(lat).toFixed(3)
        profiles[idx].roundLon = Number(lon).toFixed(3)

        if (lat > 0) {
            profiles[idx].strLat = Math.abs(lat).toFixed(3).toString() + ' N'
        }
        else {
            profiles[idx].strLat = Math.abs(lat).toFixed(3).toString() + ' S'
        }
        if (lon > 0) {
            profiles[idx].strLon = Math.abs(lon).toFixed(3).toString() + ' E'
        }
        else {
            profiles[idx].strLon = Math.abs(lon).toFixed(3).toString() + ' W'
        }
        if (profiles[idx].station_parameters) {
            let station_parameters = profiles[idx].station_parameters
            profiles[idx].formatted_station_parameters = station_parameters.map(param => ' '+param)
        }
    }
    return profiles
}

const reduce_gps_measurements = function(profiles, maxLength) {

    pos_sys = profiles[0].POSITIONING_SYSTEM;
    if (pos_sys === 'GPS'){
        for(let idx = 0; idx < profiles.length; idx++){
            let profile = profiles[idx]
            mLen = profile.measurements.length;
            if (mLen > maxLength) {
                //reduce array length to so that only every delta element is plotted
                const delta = Math.floor( mLen / maxLength );
                let reducedMeasurements = [];
                for (let jdx = 0; jdx < mLen; jdx=jdx + delta) {
                    reducedMeasurements.push(profile.measurements[jdx]);
                }
                profiles[idx].measurements = reducedMeasurements
            }
        }
    }
        
    return profiles
}


module.exports = {}
module.exports.reduceIntpMeas = reduceIntpMeas
module.exports.presSliceProject = presSliceProject
module.exports.make_match = make_match
module.exports.make_pres_project = make_pres_project
module.exports.make_map_pres_agg = make_map_pres_agg
module.exports.make_pres_agg = make_pres_agg
module.exports.make_virtural_fields = make_virtural_fields
module.exports.reduce_gps_measurements = reduce_gps_measurements