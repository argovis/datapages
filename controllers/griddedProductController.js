const Grid = require('../models/grid');
const GridParameter = Grid.ksTempParams;
const moment = require('moment');
const helper = require('../public/javascripts/controllers/griddedHelperFunctions')

const presLayersGrouping = {   _id: '$gridName', presLevels: {$push: '$pres'}}

exports.get_pressure_layers = function(req, res, next) {
    req.sanitize('gridName').escape();
    req.sanitize('gridName').trim();
    const gridName = req.query.gridName
    const GridModel = helper.get_grid_model(Grid, gridName)
    console.log(gridName, GridModel)
    let query = GridModel.aggregate( [
        {$match: {gridName: gridName}},
        {$group: presLayersGrouping},
        {$unwind: "$presLevels" } ,
        {$group: { _id: gridName, presLevels: {"$addToSet": "$presLevels" }}},
    ])

    query.exec( function (err, grid) {
        if (err) { return next(err); }
        res.json(grid);
    });
}

exports.find_grid_param = function(req, res , next) {
    req.sanitize('gridName').escape();
    req.sanitize('gridName').trim();
    req.sanitize('presLevel').escape();
    req.sanitize('presLevel').trim();
    req.sanitize('param').escape();
    req.sanitize('param').trim();

    req.checkParams('presLevel', 'pres should be numeric.').isNumeric();
    req.checkParams('param', 'param should be string.').isAlpha();
    req.checkParams('grid', 'grid should be string.').isAlphanumeric();
    const pres = JSON.parse(req.query.presLevel)
    const gridName = req.query.gridName
    const param = req.query.param
    
    const query = GridParameter.find({pres: pres, gridName: gridName, param: param}, {model: 1, param:1, measurement: 1, trend: 1, pres: 1});
    query.limit(1)
    query.exec( function (err, grid) {
        if (err) { return next(err); }
        res.json(grid);
    });
}

exports.find_grid = function(req, res , next) {
    req.sanitize('gridName').escape();
    req.sanitize('gridName').trim();
    req.sanitize('trend').escape();
    req.sanitize('trend').trim();
    const gridName = req.query.gridName
    const GridModel = helper.get_grid_model(Grid, gridName)
    const query = GridModel.aggregate([
        {$match: {gridName: gridName}},
        {$limit: 1}
    ])
    query.exec( function (err, grid) {
        if (err) { return next(err); }
        res.json(grid);
    });
}

exports.get_grid_window = function(req, res , next) {
    req.sanitize('gridName').escape();
    req.sanitize('gridName').trim();
    req.sanitize('presLevel').escape();
    req.sanitize('presLevel').trim();
    req.sanitize('latRange').escape();
    req.sanitize('latRange').trim();
    req.sanitize('lonRange').escape();
    req.sanitize('lonRange').trim();
    req.sanitize('param').escape();
    req.sanitize('param').trim();
    req.sanitize('monthYear').escape();
    req.sanitize('monthYear').trim();

    req.checkParams('presLevel', 'presLevel should be numeric.').isNumeric();
    req.checkParams('param', 'param should be string.').isAlpha();
    req.checkParams('grid', 'grid should be string.').isAlphanumeric();
    const pres = JSON.parse(req.query.presLevel)
    const gridName = req.query.gridName
    const latRange = JSON.parse(req.query.latRange)
    const lonRange = JSON.parse(req.query.lonRange)
    const monthYear = moment.utc(req.query.monthYear, 'MM-YYYY').startOf('D')

    const GridModel = helper.get_grid_model(Grid, gridName)

    let agg = []
    agg.push({$match: {pres: pres, date: monthYear.toDate(), gridName: gridName }})
    agg = helper.add_grid_projection(agg, latRange, lonRange)
    console.log(agg, agg[1]['$project'].data['$filter']['cond']['$and'])
    const query = GridModel.aggregate(agg)
    query.exec( function (err, grid) {
        if (err) { return next(err); }
        res.json(grid);
    });
}

exports.get_param_window = function(req, res , next) {
    req.sanitize('gridName').escape();
    req.sanitize('gridName').trim();
    req.sanitize('presLevel').escape();
    req.sanitize('presLevel').trim();
    req.sanitize('latRange').escape();
    req.sanitize('latRange').trim();
    req.sanitize('lonRange').escape();
    req.sanitize('lonRange').trim();
    req.sanitize('param').escape();
    req.sanitize('param').trim();

    req.checkParams('presLevel', 'presLevel should be numeric.').isNumeric();
    req.checkParams('param', 'param should be string.').isAlpha();
    req.checkParams('gridName', 'gridName should be string.').isAlphanumeric();
    const pres = JSON.parse(req.query.presLevel)
    const gridName = req.query.gridName
    const param = req.query.param

    const latRange = JSON.parse(req.query.latRange)
    const lonRange = JSON.parse(req.query.lonRange)

    let agg = []
    agg.push({$match: {pres: pres, gridName: gridName, param: param}})
    console.log(agg)
    agg = helper.add_param_projection(agg, latRange, lonRange)
    console.log(agg)

    const query = GridParameter.aggregate(agg);
    
    query.exec( function (err, grid) {
        if (err) { return next(err); }
        res.json(grid);
    });
}
