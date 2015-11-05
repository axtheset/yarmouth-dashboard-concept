/**************************************************************************
|  Initialize Connect
**************************************************************************/

var connect = new Connect({
    projectId: '55d361ce1f2ddd0bcccb8219',
    apiKey: 'F74167F644CEF740B2A8DBD2C641B562-0B5B16826B417526958C51C645909A4BA35601B63E20594180C02E51670F9D8501AFEF305CD6B134A25DB2B290D76D84'
  });
 
var timeFrame = "this_week";
var collection = "YARMOUTH-SUPP"
/*var timeFrame = {};
timeFrame.start = "2015-08-23T00:00:00.000Z";
timeFrame.end = "2015-08-26T00:00:00.000Z";*/

var timeZone = "America/New_York";
/**************************************************************************
|  Queries for top row
**************************************************************************/
var dollarsFormatter = function (value){
    return numeral(value).format('$0.00a');
};

var numberFormatter = function (value){
    return numeral(value).format('0a');
};

var totalApps = connect.query(collection)
  .select({
    totalApps: "count"
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'ApplicationSubmitAfter'}
  })
  .timeframe(timeFrame)
  .timezone(timeZone);

var feeTotal = connect.query(collection)
  .select({
    feeTotal: { sum: "feeTotal" }
  })
  .filter({
    type: { neq: 'test' }, 
    eventName: { eq: 'ApplicationSubmitAfter'}
  })
  .timeframe(timeFrame)
  .timezone(timeZone);

var constrTotal = connect.query(collection)
  .select({
    constrValue: { sum: "constrValue" }
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'ApplicationSubmitAfter'}
  })
  .timeframe(timeFrame)
  .timezone(timeZone);

var totalWF = connect.query(collection)
  .select({
    totalTasks: "count"
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'WorkflowTaskUpdateAfter'}
  })
  .timeframe(timeFrame)
  .timezone(timeZone);

var totalInsp = connect.query(collection)
  .select({
    totalInspections: "count"
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'V360InspectionResultSubmitAfter'}
  })
  .timeframe(timeFrame)
  .timezone(timeZone);

/**************************************************************************
|  Visualizations for top row
**************************************************************************/

connect.text(totalApps, '#thisWeekApps', {
    title: 'Applications Submitted',
    fields: {
        totalApps: {
            valueFormatter: numberFormatter
        }
    }
});

connect.text(feeTotal, '#thisWeekFees', {
    title: 'Fees collected ($)',
    fields: {
        feeTotal: {
            valueFormatter: dollarsFormatter
        }
    }
});

connect.text(constrTotal, '#thisWeekConstrValue', {
    title: 'Job value of applications($)',
    fields: {
        constrValue: {
            valueFormatter: dollarsFormatter
        }
    }
});

connect.text(totalWF, '#thisWeekWF', {
    title: 'Workflow Tasks Processed',
    fields: {
        totalTasks: {
            valueFormatter: numberFormatter
        }
    }
});

connect.text(totalInsp, '#thisWeekInsp', {
    title: 'Inspections Completed',
    fields: {
        totalInspections: {
            valueFormatter: numberFormatter
        }
    }
});

/**************************************************************************
|  Queries for left column
**************************************************************************/

var submittedQuery = connect.query(collection)
  .select({
    Applications: "count"
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'ApplicationSubmitAfter'}
  })
  .timeframe(timeFrame)
  .groupBy('type')
  .timezone(timeZone);

var submittedByDayQuery = connect.query(collection)
  .select({
    Applications: "count"
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'ApplicationSubmitAfter'}
  })
  .interval('daily')
  .timeframe(timeFrame)
  .groupBy('type')
  .timezone(timeZone);

var submittedByHourQuery = connect.query(collection)
  .select({
    Applications: "count"
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'ApplicationSubmitAfter'}
  })
  .interval('hourly')
  .timeframe('today')
  .groupBy('type')
  .timezone(timeZone);

var palette = {
    Commercial: '#1ABC9C',
    Electrical: '#3498DB',
    Mechanical: '#E74C3C',
    "Multi-Family": '#F39C12', 
    Plumbing: '#1ABC9C', 
    PoolSpa: '#3498DB',
    Residential: '#E74C3C',
    Sign: '#F39C12'
}

/**************************************************************************
|  Visualizations for left column
**************************************************************************/

connect.chart(submittedQuery, '#openByType', {
    chart: {
      type: 'bar',
      colorModifier: function(currentcolor, charDataContext){
            var groupByValue = charDataContext.groupByValues[0];
            
            return palette[groupByValue];
        },
        showLegend: false
    }
});

var intervalOptions = {
    formats: {
        daily: 'MM/DD'
    }
}

connect.chart(submittedByDayQuery, '#appsByDay', {
    chart: {
        type: 'line'
    },
    intervals: intervalOptions
});

connect.chart(submittedByHourQuery, '#appsByHour', {
    chart: {
        type: 'spline'
    }
});

/**************************************************************************
|  Queries for right column
**************************************************************************/

var tableQuery = connect.query(collection)
  .select({
    Applications: "count",  
    feeTotal: { sum: 'feeTotal'}, 
    constrValue: { sum: 'constrValue'}
  })
  .filter({
    type: { neq: 'test' },
    eventName: { eq: 'ApplicationSubmitAfter'}
  })
  .groupBy(['type','subType'])
  .timeframe(timeFrame)
  .timezone(timeZone);


var fieldOptions = {
     Count: {
        label: 'Applications',
        valueFormatter: function(value){
          return value;
        }
    }   
}


//execute the query to get the total number of sales
var promise = totalApps.execute();

promise.then(function(results) {
    //After we have the total number of sales, we want to get the number of sales made by toyota alone
    var resQuery = connect.query(collection)
                .select({
                    Count: 'count',
                })
                .filter({subType: 'Residential', eventName: 'ApplicationSubmitAfter'})
                .timeframe(timeFrame)
                .timezone(timeZone);

    var comQuery = connect.query(collection)
                .select({
                    Count: 'count',
                })
                .filter({subType: 'Commercial', eventName: 'ApplicationSubmitAfter'})
                .timeframe(timeFrame)
                .timezone(timeZone);
    
    //and build the graph    
    connect.gauge(comQuery, '#commercial', {
        fields: fieldOptions,
        title: 'Commercial Percentage',
        gauge: {
            min:0,
            max: results.results[0].totalApps,
            color: "#1ABC9C"
        }
    });

    connect.gauge(resQuery, '#residential', {
        fields: fieldOptions,
        title: 'Residential Percentage',
        gauge: {
            min:0,
            max: results.results[0].totalApps,
            color: "#9C56B8"
        }
    });
});



/**************************************************************************
|  Visualizations for right column
**************************************************************************/
/*
var tableQuery = connect.query('ApplicationSubmitAfter')
  .select({
    Applications: "count",  
    feeTotal: { sum: 'feeTotal'}, 
    constrValue: { sum: 'constrValue'}
  })
  .filter({
    type: { neq: 'test' }
  })
  .groupBy(['type','subType'])
  .timeframe(timeFrame)
  .timezone(timeZone);

connect.table(tableQuery, '#tableViz', {
    title: 'Summary Table',
    fields: {
        'type': {
            label: 'Permit Type'
        },
        'subType': {
            label: 'Permit Type 2'
        },
        'Applications': {
            label: 'Count'
        },
        'feeTotal': {
            label: 'Fees ($)'
        },
        'constrValue': {
            label: 'Job Value ($)'
        }
    }
});*/
