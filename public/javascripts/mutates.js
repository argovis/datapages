// functions to mutate schema by adding extra keys,
// intended for use before passing objects to templates
// largely replaces mongoose virtuals

module.exports = {}

module.exports.profile_mutate = function(prof){

    p = JSON.parse(JSON.stringify(prof))

    // core_data_mode
    if (p.DATA_MODE) {
      p.core_data_mode = p.DATA_MODE
    }
    else if (p.PARAMETER_DATA_MODE.length > 0) {
      p.core_data_mode = p.PARAMETER_DATA_MODE[0]
    }
    else {
      p.core_data_mode = 'Unknown'
    }

    //strlat/lon
    if (p.geoLocation.coordinates[0] > 0) p.strLon = Math.abs(p.geoLocation.coordinates[0] ).toFixed(3).toString() + ' E';
    else p.strLon = Math.abs(p.geoLocation.coordinates[0] ).toFixed(3).toString() + ' W';
    if (p.geoLocation.coordinates[1] > 0) p.strLat = Math.abs(p.geoLocation.coordinates[1] ).toFixed(3).toString() + ' N';
    else p.strLat = Math.abs(p.geoLocation.coordinates[1] ).toFixed(3).toString() + ' S';

    // formatted_station_parameters
    p.formatted_station_parameters = p.station_parameters.map(par => ' '+par)

    return p
}