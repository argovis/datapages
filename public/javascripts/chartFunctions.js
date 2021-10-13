function latSorter(a, b) {
    aNS = a.slice(-1);
    bNS = b.slice(-1);
    aNum = Number(a.slice(0, -2));
    bNum = Number(b.slice(0, -2));
    if (aNS == 'S') { aNum = -1*Number(aNum) }
    if (bNS == 'S') { bNum = -1*Number(bNum) }
    if (aNum < bNum) return -1;
    if (aNum > bNum) return 1;
    return 0;
}

function lonSorter(a, b) {
    aNS = a.slice(-1);
    bNS = b.slice(-1);
    aNum = Number(a.slice(0, -2));
    bNum = Number(b.slice(0, -2));
    if (aNS == 'E') { aNum = -1*Number(aNum) }
    if (bNS == 'E') { bNum = -1*Number(bNum) }
    if (aNum < bNum) return -1;
    if (aNum > bNum) return 1;
    return 0;
}

const linkToProfilePage = function(data) {
    let xidx = data.points[0].pointNumber
    let profile_id = data.points[0].data.profile_ids[xidx];
    let url = '/catalog/profiles/' + profile_id + '/page'
    window.open(url,'_blank');
};

const mapLinkToProfilePage = function(data) {
    const xidx = data.points[0].pointNumber
    const profile_id = data.points[0].data.text[xidx];
    const url = '/catalog/profiles/' + profile_id + '/page';
    window.open(url,'_blank');
}

const collateProfileMeasurements = function(profile) {
    var collatedProfiles = {};
    let num_measurements = profile.length;
    collatedProfiles.pres = new Array(num_measurements);
    collatedProfiles.temp = new Array(num_measurements);
    collatedProfiles.psal = new Array(num_measurements);

    for (var i = 0; i < num_measurements; ++i) {
        collatedProfiles.pres[i] = profile[i].pres;
        collatedProfiles.temp[i] = profile[i].temp;
        collatedProfiles.psal[i] = profile[i].psal;
    }
    return collatedProfiles;
}

const reduceGPSMeasurements = function(profile, maxLength) {
    if (profile.POSITIONING_SYSTEM === 'GPS') {
        mLen = profile.measurements.length;
        if (mLen > maxLength) {
            //reduce array length to so that only every delta element is plotted
            var delta = Math.floor( mLen / maxLength );
            var reducedMeasurements = [];
            for (var j = 0; j < mLen; j=j+delta) {
                reducedMeasurements.push(profile.measurements[j]);
            }
            return reducedMeasurements;
        }
        else {
            return profile.measurements;
        }
    }
    else {
        return profile.measurements;
    }
}

const roundArray = function (value){ return(Number(value).toFixed(3)) };

const getMaskForPair = function(arrayOne, arrayTwo) {
    let mask = [];
    const element = null; // fill value
    for(let idx=0; idx < arrayOne.length; idx++){
        if (arrayOne[idx] === element || arrayTwo[idx] === element){
            mask.push(false);
        }
        else {
            mask.push(true)
        }
    }
    return(mask);
}

//Used to for pres vs psal. if temp reporting nan, psal should be zero too.
const getMaskForTrio = function(arrayOne, arrayTwo, arrayThree) {
    let mask = [];
    const element = null; // fill value
    for(let idx=0; idx < arrayOne.length; idx++){
        if (arrayOne[idx] === element || arrayTwo[idx] === element || arrayThree[idx] === element){
            mask.push(false);
        }
        else {
            mask.push(true)
        }
    }
    return(mask);
}

const makeHistogram = function(x, xtitle) {
    const data = [{
        type: 'histogram',
        x: x,
    }]

    const layout = {
        title: 'Histogram of: ' + xtitle,
        width: 500,
        titlefont: {
            size: 16
        },
        xaxis: {
            autorange: true,
            title: xtitle
        },
        yaxis: {
            autorange: true,
            title: 'frequency'
        },
    }

    return ({data: data, layout: layout})
}

const makeMap = function(lats, longs, ids) {
    const minLong = Math.min(...longs)
    const maxLong = Math.max(...longs)
    const longRange = [minLong-5, maxLong+5]
    const latRange = [Math.min(...lats)-5, Math.max(...lats)+5]

    let midLong =  minLong + 5 //just make sure some of the points are in range
    if (longs.length === 1) {
        midLong = longs[0]
    }
    const midLat = (latRange[1] + latRange[0])/2
    const data = [{
        type: 'scattergeo',
        mode: 'markers',
        text: ids,
        lon: longs,
        lat: lats,
        marker: {
            size: 7,
                width: 1
            }
        
    }];

    const layout = {
        title: "Profile location",
        width:500,
        titlefont: {
            size: 16
        },
        geo: {
        projection: {
            type: 'orthographic',
            rotation: {
                lon: midLong,
                lat: midLat
            },
        },
            resolution: 50,
            lonaxis: {
                'range': longRange
            },
            lataxis: {
                'range': latRange
            },
            showland: true,
            landcolor: '#EAEAAE',
            countrycolor: '#d3d3d3',
            countrywidth: 1.5,
            subunitcolor: '#d3d3d3'
        }
    };

    return ({data: data, layout: layout})
}


const makeColorChartDataArrays = function(profiles) {
    let psal = []
    let pres = []
    let temp = []
    let time = []
    let cycles = []
    let ids = []
    let lats = []
    let longs = []
    let _ids = []
    let data_modes = []

    for(let idx=0; idx < profiles.length; idx++) {
        const profile = profiles[idx]
        let profileMeas = reduceGPSMeasurements(profile, 200)
        profileMeas = collateProfileMeasurements(profileMeas)
        psal = psal.concat(profileMeas.psal)
        pres = pres.concat(profileMeas.pres)
        temp = temp.concat(profileMeas.temp)
        const _id = profile._id
        const data_mode = profile.core_data_mode
        const timeStr = moment.utc(profile.date).format('YYYY-MM-DD HH:mm')
        const cycle = profile.cycle_number
        ids.push(_id)
        lats.push(profile.lat)
        longs.push(profile.lon)
        const id_array = Array.apply(null, Array(profileMeas.pres.length)).map(String.prototype.valueOf,_id)
        const data_mode_array = Array.apply(null, Array(profileMeas.pres.length)).map(String.prototype.valueOf,data_mode)
        const time_array = Array.apply(null, Array(profileMeas.pres.length)).map(String.prototype.valueOf,timeStr)
        const cycle_array = Array.apply(null, Array(profileMeas.pres.length)).map(Number.prototype.valueOf,cycle)
        data_modes = data_modes.concat(data_mode_array)
        _ids = _ids.concat(id_array)
        time = time.concat(time_array)
        cycles = cycles.concat(cycle_array)

    }
    let dataArrays  = {}
    dataArrays.temp = temp
    dataArrays.psal = psal
    dataArrays.pres = pres
    dataArrays.ids = ids
    dataArrays.lats = lats
    dataArrays.longs = longs
    dataArrays._ids = _ids
    dataArrays.data_modes = data_modes
    dataArrays.cycle = cycles
    dataArrays.time = time
    return (dataArrays)
}

const filterColorChartDataArrays = function(dataArrays) {

    presVsTempMask = getMaskForPair(dataArrays.temp, dataArrays.pres)
    presVsPsalMask = getMaskForTrio(dataArrays.psal, dataArrays.pres, dataArrays.temp)

    presForTemp = dataArrays.pres.filter((item, i) => presVsTempMask[i])
    tempForPres = dataArrays.temp.filter((item, i) => presVsTempMask[i])
    cycleForTemp = dataArrays.cycle.filter((item, i) => presVsTempMask[i])
    timeForTemp = dataArrays.time.filter((item, i) => presVsTempMask[i])
    idForTemp = dataArrays._ids.filter((item, i) => presVsTempMask[i])
    data_modesForTemp =  dataArrays.data_modes.filter((item, i) => presVsTempMask[i])

    presForPsal = dataArrays.pres.filter((item, i) => presVsPsalMask[i])
    psalForPres = dataArrays.psal.filter((item, i) => presVsPsalMask[i])
    cycleForPsal = dataArrays.cycle.filter((item, i) => presVsPsalMask[i])
    timeForPsal = dataArrays.time.filter((item, i) => presVsPsalMask[i])
    idForPsal = dataArrays._ids.filter((item, i) => presVsPsalMask[i])
    data_modesForPsal =  dataArrays.data_modes.filter((item, i) => presVsPsalMask[i])

    let chartData = {}
    chartData.presForTemp = presForTemp
    chartData.tempForPres = tempForPres
    chartData.cycleForTemp = cycleForTemp
    chartData.timeForTemp = timeForTemp
    chartData.idForTemp = idForTemp
    chartData.data_modesForTemp = data_modesForTemp

    chartData.presForPsal = presForPsal
    chartData.psalForPres = psalForPres
    chartData.cycleForPsal = cycleForPsal
    chartData.timeForPsal = timeForPsal
    chartData.idForPsal = idForPsal
    chartData.data_modesForPsal = data_modesForPsal

    return (chartData)
}

const makeColorChartText = function(pres, data_mode, date, text, value, units, cycle) {
    return("<br>" + text + value.toString() + " " + units
         + "<br>data mode: " + data_mode
         + "<br>date: " + date.toString()
         + "<br>pressure: " + pres.toString() + " dbar"
         + "<br>cycle: " + cycle.toString()
         + "<br>click to see profile page"
    )
}

const makeColorChartTrace = function(meas, key) {
    let hovorText = []
    for(let idx=0; idx < meas.cvalues.length; idx++){
        let pointText = makeColorChartText(meas.yvalues[idx], meas.data_modes[idx], meas.xvalues[idx], meas.text, meas.cvalues[idx], meas.units, meas.cycle[idx])
        hovorText.push(pointText)
    }
    scatterTrace = {
        y: meas.yvalues,
        x: meas.xvalues,
        text: hovorText,
        hoverinfo: 'text',
        showlegend: false,
        type: 'scattergl',
        mode: 'markers',
        cycle: meas.cycle,
        profile_ids: meas.id,
        marker: { color: meas.cvalues,
                    size: 5,
                    symbol: 'dot',
                    opacity: 1,
                    reversescale: false,
                    colorscale: meas.colorscale,
                    colorbar: meas.colorbar,
                },
        name: key, 
    }
    return [scatterTrace]
}

const makeColorChartMeasurements = function(chartData) {
    const tempScl = [[0.0, 'rgb(3, 35, 51)'],
                    [0.125, 'rgb(24, 51, 124)'],
                    [0.25, 'rgb(86, 59, 156)'],
                    [0.375, 'rgb(130, 79, 142)'],
                    [0.5, 'rgb(176, 95, 129)'],
                    [0.625, 'rgb(222, 112, 100)'],
                    [0.75, 'rgb(249, 147, 65)'],
                    [0.875, 'rgb(249, 198, 65)'],
                    [1.0, 'rgb(231, 250, 90)']]

    const psalScl = [[0.0, 'rgb(41, 24, 107)'],
                    [0.125, 'rgb(31, 51, 161)'],
                    [0.25, 'rgb(15, 91, 144)'],
                    [0.375, 'rgb(40, 119, 137)'],
                    [0.5, 'rgb(59, 147, 135)'],
                    [0.625, 'rgb(79, 176, 125)'],
                    [0.75, 'rgb(122, 203, 102)'],
                    [0.875, 'rgb(195, 221, 100)'],
                    [1.0, 'rgb(253, 238, 153)']]

    const measurements = {'pres_v_temp': {
        'xvalues': chartData.timeForTemp,
        'yvalues': chartData.presForTemp.map(roundArray),
        'cvalues': chartData.tempForPres.map(roundArray),
        'text': 'temperature: ',
        'yaxis': 'y2',
        'xaxis': 'x1',
        'units': 'C',
        'cycle': chartData.cycleForTemp,
        'colorscale': tempScl,
        'id': idForTemp,
        'data_modes': chartData.data_modesForTemp,
        'colorbar': {
                title: "Temp. [Celsius]", 
                len: 1, 
                yanchor: "middle",
                titleside: "right",
                xpad: 10,
                }
        },
        'pres_v_psal': {
            'xvalues': chartData.timeForPsal,
            'yvalues': chartData.presForPsal.map(roundArray),
            'cvalues': chartData.psalForPres.map(roundArray),
            'text': 'salinity: ',
            'yaxis': 'y1',
            'xaxis': 'x1',
            'units': 'psu',
            'cycle': chartData.cycleForPsal,
            'colorscale': psalScl,
            'id': chartData.idForPsal,
            'data_modes': chartData.data_modesForPsal,
            'colorbar': {
                title: "Salinity [psu]", 
                len: 1, 
                yanchor: "middle",
                titleside: "right",
                xpad: 5,
                }
            }
        }

return measurements
}

const makeScatterChartDataArrays = function(profiles) {

    let temp = []
    let pres = []
    let psal = []
    let _ids = []

    let lats = []
    let longs = []
    let ids = []
    let data_modes = []

    let cvalues = []

    for(let i=0; i<profiles.length; i++) {
        const profile = profiles[i]
        let profileMeas = reduceGPSMeasurements(profile, 200)
        profileMeas = collateProfileMeasurements(profileMeas) // collect points into arrays
        const _id = profile._id
        const data_mode = profile.core_data_mode
        lats.push(profile.lat)
        longs.push(profile.lon)
        ids.push(_id)

        const color_array = Array.apply(null, Array(profileMeas.pres.length)).map(Number.prototype.valueOf, i)
        const id_array = Array.apply(null, Array(profileMeas.pres.length)).map(String.prototype.valueOf,_id)
        const data_mode_array = Array.apply(null, Array(profileMeas.pres.length)).map(String.prototype.valueOf,data_mode)
        temp = temp.concat(profileMeas.temp)
        pres = pres.concat(profileMeas.pres)
        psal = psal.concat(profileMeas.psal)
        cvalues = cvalues.concat(color_array)
        _ids = _ids.concat(id_array)
        data_modes = data_modes.concat(data_mode_array)
    }

    let dataArrays  = {}
    dataArrays.temp = temp
    dataArrays.psal = psal
    dataArrays.pres = pres
    dataArrays.lats = lats
    dataArrays.longs = longs
    dataArrays.ids = ids
    dataArrays._ids = _ids
    dataArrays.cvalues = cvalues
    dataArrays.data_modes = data_modes
    return (dataArrays)
    }

const filterScatterChartDataArrays = function(dataArrays) {
    presVsTempMask = getMaskForPair(dataArrays.temp, dataArrays.pres)
    presVsPsalMask = getMaskForTrio(dataArrays.psal, dataArrays.pres, dataArrays.temp)
    tempVsPsalMask = getMaskForPair(dataArrays.psal, dataArrays.temp)

    presForTemp = dataArrays.pres.filter((item, i) => presVsTempMask[i])
    tempForPres = dataArrays.temp.filter((item, i) => presVsTempMask[i])
    cvaluesForTempVsPres = dataArrays.cvalues.filter((item, i) => presVsTempMask[i])
    _idsForTempVsPres =  dataArrays._ids.filter((item, i) => presVsTempMask[i])
    data_modesForTempVsPres =  dataArrays.data_modes.filter((item, i) => presVsTempMask[i])

    presForPsal = dataArrays.pres.filter((item, i) => presVsPsalMask[i])
    psalForPres = dataArrays.psal.filter((item, i) => presVsPsalMask[i])
    cvaluesForPsalVsPres = dataArrays.cvalues.filter((item, i) => presVsPsalMask[i])
    _idsForPsalVsPres =  dataArrays._ids.filter((item, i) => presVsPsalMask[i])
    data_modesForPsalVsPres =  dataArrays.data_modes.filter((item, i) => presVsPsalMask[i])

    psalForTemp = dataArrays.psal.filter((item, i) => tempVsPsalMask[i])
    tempForPsal = dataArrays.temp.filter((item, i) => tempVsPsalMask[i])
    cvaluesForTempVsPsal = dataArrays.cvalues.filter((item, i) => tempVsPsalMask[i])
    _idsForTempVsPsal =  dataArrays._ids.filter((item, i) => tempVsPsalMask[i])
    data_modesForTempVsPsal =  dataArrays.data_modes.filter((item, i) => tempVsPsalMask[i])

    let chartData = {}
    chartData.presForTemp = presForTemp
    chartData.tempForPres = tempForPres
    chartData.cvaluesForTempVsPres = cvaluesForTempVsPres
    chartData._idsForTempVsPres = _idsForTempVsPres
    chartData.data_modesForTempVsPres = data_modesForTempVsPres

    chartData.presForPsal = presForPsal
    chartData.psalForPres = psalForPres
    chartData.cvaluesForPsalVsPres = cvaluesForPsalVsPres
    chartData._idsForPsalVsPres = _idsForPsalVsPres
    chartData.data_modesForPsalVsPres = data_modesForPsalVsPres

    chartData.psalForTemp = psalForTemp
    chartData.tempForPsal = tempForPsal
    chartData.cvaluesForTempVsPsal = cvaluesForTempVsPsal
    chartData._idsForTempVsPsal = _idsForTempVsPsal
    chartData.data_modesForTempVsPsal = data_modesForTempVsPsal

    return (chartData)
}


const makeScatterChartText = function(profile_id, data_mode, ylabel, yunits, yvalue, xlabel, xunits, xvalue) {
    text = "<br>profile id: " + profile_id
         + "<br>data mode: " + data_mode
         + "<br>" + ylabel + yvalue.toString() + yunits
         + "<br>" + xlabel + xvalue.toString() + xunits
         + "<br>click to see profile page"
    return (text)
}

const makeScatterChartTrace = function(xvalues,
                                        yvalues,
                                        cvalues,
                                        profile_ids,
                                        data_modes,
                                        plot_name,
                                        colorscale,
                                        ylabel,
                                        xlabel,
                                        yunits,
                                        xunits) {
    let hovorText = []
    for(let idx=0; idx < yvalues.length; idx++){
        let pointText = makeScatterChartText(profile_ids[idx],
                                 data_modes[idx],
                                 ylabel,
                                 yunits,
                                 yvalues[idx],
                                 xlabel,
                                 xunits,
                                 xvalues[idx])
        hovorText.push(pointText)
    }
    scatterGlTrace = {
        y: yvalues,
        x: xvalues,
        //text: profile_ids.map(makeText),
        text: hovorText,
        hoverinfo: 'text',
        showlegend: false,
        type: 'scattergl',
        mode: 'markers',
        profile_ids: profile_ids,
        marker: { color: cvalues,
                    size: 5,
                    symbol: 'dot',
                    opacity: 1,
                    colorscale: colorscale
                },
        name: plot_name, 
        
    }
    return [scatterGlTrace]
}