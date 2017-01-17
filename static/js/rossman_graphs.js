d3.queue()
    .defer(d3.json, "/Rossman/data/sample")
    .await(makeGraphs)

function makeGraphs(error, recordsJson) {
    // console.log(error);
    var records = recordsJson;
    var dateFormat = d3.time.format("%Y-%m-%d")

    records.forEach(function(d){
        d["Date"] = dateFormat.parse(d["Date"]);
    });

    //Dimensions
    var ndx = crossfilter(records);

    var dateDim = ndx.dimension(function(d){
        return d["Date"];
    });

    var storeDim = ndx.dimension(function(d){
        return d["StoreName"];
    });

    var storeDim2 = ndx.dimension(function(d){
        return d["Store"];
    });

    var weekdayDim = ndx.dimension(function(d){
        return d["DayOfWeek"];
    });

    var openDim = ndx.dimension(function(d){
        return d["Open"];
    });

    var promoDim = ndx.dimension(function(d){
        return d["Promo"];
    });

    var stateHolidayDim = ndx.dimension(function(d){
        return d["StateHoliday"];
    });

    var schoolHolidayDim = ndx.dimension(function(d){
        return d["SchoolHoliday"];
    });

    var typeDim = ndx.dimension(function(d){
        return d["StoreType"];
    });

    var assortmentDim = ndx.dimension(function(d){
        return d["Assortment"];
    });

    var promo2Dim = ndx.dimension(function(d){
        return d["Promo2"];
    });

    var allDim = ndx.dimension(function(d){
        return d;
    });

    //Groups
    var recordsByDate = dateDim.group().reduceSum(function(d){
        return d["Sales"];
    });
    var typeGroup = typeDim.group();
    var assortmentGroup = assortmentDim.group();
    var openGroup = openDim.group().reduceSum(function(d){
        return d["Sales"];
    });
    var storeGroup = storeDim.group().reduceSum(function(d){
        return d["Sales"];
    });
    var customersByStoreGroup = storeDim.group().reduceSum(function(d){
        return d["Customers"];
    });
    var weekdayGroup = weekdayDim.group().reduceSum(function(d){
        return d["Sales"];
    });
    var allSales = ndx.groupAll().reduceSum(function(d){
        return d["Sales"];
    });
    var allCustomers = ndx.groupAll().reduceSum(function(d){
        return d["Customers"];
    });
    var aveSales = ndx.groupAll().reduce(
        function(p, v){
            ++p.count;
            p.total += v["Sales"]
            return p;
        },
        function(p, v){
            --p.count;
            p.total -= v["Sales"];
            return p;
        },
        function(p, v){
            return {count: 0, total:0}
        }
    );
    var minDate = dateDim.bottom(1)[0]["Date"];
    var maxDate = dateDim.top(1)[0]["Date"];

    //Charts
    var timeChart = dc.barChart("#time-chart");
    var typeChart = dc.rowChart("#gender-row-chart");
    var assortmentChart = dc.rowChart("#age-segment-row-chart");
    var top5Chart = dc.rowChart("#location-row-chart");
    var top5ByCustomers = dc.rowChart("#top-stores-customers");
    var totalSales = dc.numberDisplay("#number-records-nd");
    var totalCustomers = dc.numberDisplay("#number-customers-nd");
    var dayOfWeekChart = dc.rowChart("#ave-sales");

    totalSales
        .formatNumber(function(d){
            return "$" + d3.format(",")(d)
        })
        .valueAccessor(function(d){
            return d;
        })
        .group(allSales)

    totalCustomers
        .formatNumber(d3.format(","))
        .valueAccessor(function(d){
            return d;
        })
        .group(allCustomers)

    timeChart
        .width(850)
        .height(162)
        .margins({top: 10, right: 50, bottom: 20, left: 50})
        .dimension(dateDim)
        .group(recordsByDate)
        .mouseZoomable(true)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .yAxis().ticks(4);

    typeChart
        .width(300)
        .height(150)
        .dimension(typeDim)
        .group(typeGroup)
        .elasticX(true)
        .xAxis().ticks(4);

    assortmentChart
        .width(300)
        .height(150)
        .dimension(assortmentDim)
        .group(assortmentGroup)
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4);

    dayOfWeekChart
        .width(555)
        .height(150)
        .dimension(weekdayDim)
        .group(weekdayGroup)
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4);

    top5Chart
        .width(555)
        .height(150)
        .dimension(storeDim)
        .group(storeGroup)
        .ordering(function(d) { return -d.value })
        .rowsCap(5)
        .othersGrouper(0)
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4);

    top5ByCustomers
        .width(555)
        .height(150)
        .dimension(storeDim)
        .group(customersByStoreGroup)
        .ordering(function(d) { return -d.value })
        .rowsCap(5)
        .othersGrouper(0)
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4);

    dc.renderAll();
    console.log("End!");
}
