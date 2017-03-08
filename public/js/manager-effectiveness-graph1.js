$(document).ready(function () {
  window.ChartRenderer = {};
  var module = {
    init: function () {
//            $(window).on("resize", module._resizeBubbleChart);
      window.t = module;
      module._renderBubbleHBarChart(chart1Data, chart2Data);
      module._renderSkillVBarChart();
      module._renderBehaviourHChart(behaviorData);
      module._renderTeamEffectivenessVBarChart();
    },
    /**
     * Renders the bubble Chart
     * There are two sets of data needed to render this [ They follow a tree struct]
     * chart1Data - As given, helps in rendering the main chart
     * chart2Data - Helps to render the bubble that stays at corner
     * Assuming that data in the required format will be passed, and then this function can be made argumented
     * @returns {undefined}
     */
    _renderBubbleHBarChart: function (chart1Data, chart2Data) {

      // Reset the chart that might have been created early
      $("#manager-effectiveness").html("");
      $("#manager-effectiveness-support").html("");

      console.log(chart1Data);
      console.log(chart2Data);
      var r = 960, r2 = 200;
      var format = d3.format(",d"),
          fill = d3.scale.category20c();

      var bubble = d3.layout.pack()
          .sort(null)
          .size([r, r])
          .padding(1.5);

      var bubble2 = d3.layout.pack()
          .sort(null)
          .size([r2, r])
          .padding(1.5);

      var vis = d3.select("#manager-effectiveness").append("svg")
          .attr("viewBox", "0 0 960 960")
          .attr("perserveAspectRatio", "xMinYMid")
          .attr("width", r)
          .attr("height", r)
          .attr("class", "bubble bubble1");

      var vis2 = d3.select("#manager-effectiveness-support").append("svg")
          .attr("viewBox", "0 0 100 960")
          .attr("perserveAspectRatio", "xMinYMid")
          .attr("width", r2)
          .attr("height", r)
          .attr("class", "bubble bubble2");

      var _chartRenderer = function (data, vis) {
        var node = vis.selectAll("g.node")
            .data(bubble.nodes(classes(data))
                .filter(function (d) {
                  return !d.children;
                }))
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
              if (d.type !== undefined && d.type === 0) {
                return "translate(" + (0) + "," + (d.y - 70) + ")";
              }
              return "translate(" + d.x + "," + d.y + ")";
            });

        //node.append("title")
        //    .text(function (d) {
        //        console.log(d.value)
        //      return d.className + ": " + format(d.value);
        //    });

        node.append("circle")
            .attr("r", function (d) {
              if (d.type !== undefined && d.type === 0) {
                return 40;
              } else {
                return d.r;
              }

            })
            .style("fill", function (d) {
              return d.color;
            });

        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .style({
              "fill": "white",
              "font-family": "Open Sans', sans-serif",
              "font-weight": "normal",
              "font-size": function (d) {
                return d.scaleFont + "px";
              }
            })
            .each(function (d, i) {
              try {
                var labelName = d.className;
                arrayL = labelName.split("<br>"),
                    arrlength = (arrayL.length > 5) ? 8 : arrayL.length;
                d3.select(this).attr('y', "-" + (((arrlength * 1.2) / 2)) + "em")
                for (var i = 0; i < arrayL.length; i++) {
                  var labelR = d3.select(this).append('tspan').attr("x", "0").attr("dy", "1.2em").attr("data-classname", labelName);
                  labelR.text(arrayL[i]);
                }
              } catch (e) {
                console.log(e);
              }
            });

      };

      _chartRenderer(chart1Data, vis);
      _chartRenderer(chart2Data, vis2);


      // Returns a flattened hierarchy containing all leaf nodes under the root.
      function classes(root) {
        var classes = [];

        function recurse(name, node) {
          if (node.children) {
            node.children.forEach(function (child) {
              recurse(node.name, child);
            });
          } else {
            var data =
            {
              packageName: name,
              type: node.type,
              className: node.name,
              value: node.size,
              color: node.color,
              scaleFont: node.scaleFont
            };

            if (node.x !== undefined) {
              data.x = node.x;
              data.y = node.y;
              data.r = node.r;
            }
            classes.push(data);
          }

        }

        recurse(null, root);
        return {
          children: classes
        };
      }

      module._resizeBubbleChart();
    },
    _resizeBubbleChart: function () {
      var chart = $(".bubble1");
      var aspect = chart.width() / chart.height(),
          container = chart.parent(),
          targetWidth = container.width();
      chart.attr("width", targetWidth);
      chart.attr("height", Math.round(targetWidth / aspect));

      chart = $(".bubble2");
      aspect = chart.width() / chart.height(),
          container = chart.parent(),
          targetWidth = container.width();
      chart.attr("width", targetWidth);
      chart.attr("height", Math.round(targetWidth / aspect));
    },

    /*
     * Renders the Grouped Vertical chart for Skills
     * The sample data is taken to render this
     * Parameters can be set to make it render accordingly
     */

    _renderSkillVBarChart: function () {
      // Remove the previous element
      //
      $(".skills__chart-wrapper").html("");


      // The values for bar should be in range of 0-40
      var rangeValuesDomain = [0, 1, 2, 3, 4];
      var rangeMap = {
        "0": "Significant growth needed",
        "1": "Some growth needed",
        "2": "Adequately exhibits this skill",
        "3": "Exemplifies",
        "4": "Exemplifies and successfully grows it in others"
      };

      var margin = {
            top: 20,
            right: 20,
            bottom: 80,
            left: 180
          },
          width = 700 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var barWidth = 15;
      var chartRenderer = function (data) {
        // The values should be withthing this range only


        var x0 = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var x1 = d3.scale.ordinal();

        var y = d3.scale.linear()
            .range([height, 0]);

        var color = d3.scale.ordinal()
            .range(["#1C4594", "#12AEA9", "#C2C3C4", "#1274BB"]);

        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(function (d, i) {
              return rangeMap[d];
            })
            .tickValues(rangeValuesDomain);

        var svg = d3.select(".skills__chart-wrapper").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var ratingNames = d3.keys(data[0]).filter(function (key) {
          return key !== "State";
        });

        // Push the ratings and update the prev array
        data.forEach(function (d) {
          d.ratings = ratingNames.map(function (name) {
            return {
              name: name,
              value: +d[name]
            };
          });
        });

        //                x0.domain(data.map(function(d) {
        //                    return d.State;
        //                }));
        x1.domain(ratingNames).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(data, function (d) {
          return d3.max(d.ratings, function (d) {
            return d.value;
          });
        })]);

        svg.append("g")
            .attr("class", "x axis ")
            .attr("transform", "translate(0," + 0 + ")")
            .append("svg:path")
            .attr("d", "M 0 " + height + " L " + width + " " + height + " Z")
            .style("stroke-width", 1)
            .style("stroke", "#E0E0E0")
            .style("fill", "none")

        ;

        //                svg.selectAll('path').

        svg.append("g").attr("class", "y axis skills__yaxis")
            .attr("transform", "translate(-10,0)")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // Wrap the text for Yaxis
        svg.selectAll(".skills__yaxis .tick text")
            .call(module._wrapText, 150, false, true);


        var currentX = 0;
        var state = svg.selectAll(".state")
            .data(data)
            .enter().append("g")
            .attr("class", "state")
            .attr("transform", function (d, i) {
              if (i !== 0)
                currentX = currentX + (barWidth * 4);
              return "translate(" + currentX + ",0)";
            });

        currentX = 0;
        svg.selectAll(".x-axis")
            .data(data)
            .enter().append("g")
            .attr("class", "x-axis")
            .attr("transform", function (d, i) {
              if (i !== 0)
                currentX = currentX + (barWidth * 7);
              return "translate(" + currentX + "," + (height + 20) + ")";
            })
            .append("text").text(function (d) {
              return d.State;
            })
            .attr("dy", ".1em");


        // Wrap the x-axis labels
        svg.selectAll(".x-axis text")
            .call(module._wrapText, 100, true);


        var valX = 0
        state.selectAll("rect")
            .data(function (d) {
              return d.ratings;
            })
            .enter().append("rect")
            .attr("width", barWidth)
            .attr("x", function (d, i) {
              if (i !== 0) {
                valX = valX + barWidth;
              }
              if ((1 + 1) % 4 == 0) {
                valX = 0;
              }

              var calX = x1(d.name) - ((16) * i);
              return valX;
            })
            .attr("y", function (d) {
              return y(d.value);
            })
            .attr("height", function (d) {
              return height - y(d.value);
            })
            .style("fill", function (d) {
              return color(d.name);
            });
      };

      while (verticalChartData.length) {
        chartRenderer((verticalChartData.splice(0, 5)));
      }

    },


    _renderTeamEffectivenessVBarChart: function () {
      // Remove the previous element
      //
      $(".team-effectiveness__chart-wrapper").html("");


      // The values for bar should be in range of 0-4
      var rangeValuesDomain = [0, 1, 2, 3, 4];
      var rangeMap = {
        "0": "Not at all",
        "1": "Not really",
        "2": "Neutral",
        "3": "Yes",
        "4": "Enthusiastic yes"
      };


      var margin = {
            top: 20,
            right: 20,
            bottom: 80,
            left: 180
          },
          width = 700 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var barWidth = 15;
      var chartRenderer = function (data) {
        // The values should be withthing this range only


        var x0 = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var x1 = d3.scale.ordinal();

        var y = d3.scale.linear()
            .range([height, 0]);

        var color = d3.scale.ordinal()
            .range(["#1C4594", "#12AEA9", "#C2C3C4", "#1274BB"]);

        var xAxis = d3.svg.axis()
            .scale(x0)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickFormat(function (d, i) {
              return rangeMap[d];
            })
            .tickValues(rangeValuesDomain);

        var svg = d3.select(".team-effectiveness__chart-wrapper").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        var ratingNames = d3.keys(data[0]).filter(function (key) {
          return key !== "State";
        });

        // Push the ratings and update the prev array
        data.forEach(function (d) {
          d.ratings = ratingNames.map(function (name) {
            return {
              name: name,
              value: +d[name]
            };
          });
        });

        //                x0.domain(data.map(function(d) {
        //                    return d.State;
        //                }));
        x1.domain(ratingNames).rangeRoundBands([0, x0.rangeBand()]);
        y.domain([0, d3.max(data, function (d) {
          return d3.max(d.ratings, function (d) {
            return d.value;
          });
        })]);

        svg.append("g")
            .attr("class", "x axis ")
            .attr("transform", "translate(0," + 0 + ")")
            .append("svg:path")
            .attr("d", "M 0 " + height + " L " + width + " " + height + " Z")
            .style("stroke-width", 1)
            .style("stroke", "#E0E0E0")
            .style("fill", "none")

        ;

        //                svg.selectAll('path').

        svg.append("g").attr("class", "y axis skills__yaxis")
            .attr("transform", "translate(-10,0)")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        // Wrap the text for Yaxis
        svg.selectAll(".skills__yaxis .tick text")
            .call(module._wrapText, 150, false, true);


        var currentX = 0;
        var state = svg.selectAll(".state")
            .data(data)
            .enter().append("g")
            .attr("class", "state")
            .attr("transform", function (d, i) {
              if (i !== 0)
                currentX = currentX + (barWidth * 4);
              return "translate(" + currentX + ",0)";
            });

        currentX = 0;
        svg.selectAll(".x-axis")
            .data(data)
            .enter().append("g")
            .attr("class", "x-axis")
            .attr("transform", function (d, i) {
              if (i !== 0)
                currentX = currentX + (barWidth * 7);
              return "translate(" + currentX + "," + (height + 20) + ")";
            })
            .append("text").text(function (d) {
              return d.State;
            })
            .attr("dy", ".1em");


        // Wrap the x-axis labels
        svg.selectAll(".x-axis text")
            .call(module._wrapText, 100, true);


        var valX = 0
        state.selectAll("rect")
            .data(function (d) {
              return d.ratings;
            })
            .enter().append("rect")
            .attr("width", barWidth)
            .attr("x", function (d, i) {
              if (i !== 0) {
                valX = valX + barWidth;
              }
              if ((1 + 1) % 4 == 0) {
                valX = 0;
              }

              var calX = x1(d.name) - ((16) * i);
              return valX;
            })
            .attr("y", function (d) {
              return y(d.value);
            })
            .attr("height", function (d) {
              return height - y(d.value);
            })
            .style("fill", function (d) {
              return color(d.name);
            });
      };


      while (teamEffectivenessChartData.length) {
        chartRenderer((teamEffectivenessChartData.splice(0, 5)));
      }

    },


    _renderBehaviourHChart: function (behaviourData) {
      $(".behaviours__chart-wrapper").html("");
      var margin = {
            top: 60,
            right: 20,
            bottom: 80,
            left: 180
          },
          width = 770 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

      var rangeValuesDomain = [0, 10, 20, 30, 40];
      var rangeMap = {
        "0": "Significant growth needed",
        "10": "Some growth needed",
        "20": "Adequately exhibits",
        "30": "Exemplifies",
        "40": "Exemplifies & grows in others"
      };


      var count = 0;
      var chartRenderer = function (data) {

        var width = 300,
            barHeight = 15,
            groupHeight = barHeight * data.series.length,
            gapBetweenGroups = 10,
            spaceForLabels = 120,
            spaceForLegend = 150;


        // Zip the series data together (first values, second values, etc.)
        var zippedData = [];
        for (var i = 0; i < data.labels.length; i++) {
          for (var j = 0; j < data.series.length; j++) {
            zippedData.push(data.series[i].values[j]);
          }
        }

        // Color scale
        var color = d3.scale.category20().range(["#1C4594", "#12AEA9", "#C2C3C4"]);
        var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;

        var chart = d3.select(".behaviours__chart-wrapper").append("div").attr("class", "behaviours__chart-item").append("svg")
            .attr("width", spaceForLabels  + spaceForLegend + width + margin.left + margin.right)
            .attr("height", chartHeight + margin.top)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var jChartParent = $(chart[0]).closest(".behaviours__chart-item");
        jChartParent.append("<div class='behaviours__chart-title'>" + data.title + " </div>");
        var y = d3.scale.linear()
            .range([chartHeight + gapBetweenGroups, 0]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .tickFormat('')
            .tickSize(0)
            .orient("left");

        // Create bars
        var bars = chart.selectAll("g")
            .data(zippedData)
            .enter().append("g")
            .attr("transform", function (d, i) {
              var y = (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i / data.series.length)));
              return "translate(" + spaceForLabels + "," + y + ")";
            });

        var x = d3.scale.linear()
            .domain([0, d3.max(zippedData)])
            .range([0, width]);


        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .tickFormat(function (d, i) {
              return rangeMap[d];
            })
            .tickValues([0, 10, 20, 30, 40, 50]);


        if (count === 0) {
          chart.append("g").attr("class", "x axis behaviours__xaxis")
              .attr("transform", "translate(" + spaceForLabels + ",-40)")
              .call(xAxis);
        }


        chart.selectAll(".behaviours__xaxis .tick text")
            .call(module._wrapText, 70, false);

        // Create rectangles of the correct width
        bars.append("rect")
            .attr("fill", function (d, i) {
              var currColor = color(i % data.series.length);
              return currColor;
            })
            .attr("class", "bar")
            .attr("width", x)
            .attr("height", barHeight);

        // Draw labels
        bars.append("text")
            .attr("class", "label behaviours__ylabel")
            .attr("x", function (d) {
              return -spaceForLabels;
            })
            .attr("y", groupHeight / 2)
            .attr("dy", ".35em")
            .text(function (d, i) {
              var txt = "";
              if (i % data.series.length === 0)
                txt = data.labels[Math.floor(i / data.series.length)];
              else
                txt = "";

              return txt;
            });

        // Wrap the text for Yaxis
        chart.selectAll(".behaviours__ylabel")
            .call(module._wrapText, 150, false, true);
        chart.selectAll(".behaviours__ylabel tspan").attr("x", -spaceForLabels);

        chart.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups / 2 + ")")
            .call(yAxis);

        count++;
      };

      for (var i = 0; i < behaviourData.length; i++) {
        chartRenderer(behaviourData[i]);
      }

    },
    _wrapText: function (text, width, bSkipDyCalc, bIsVertical) {
      text.each(function () {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeightReducer = bIsVertical && words.length > 0 ? 0 : 0,
            lineHeight = 1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")) - lineHeightReducer,
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            if (bSkipDyCalc) {
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", lineHeight + "em").text(word);
            } else {
              tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }

          }
        }
      });
    }
  };

  ChartRenderer = module;
  module.init();
});

var verticalChartData = [];
var teamEffectivenessChartData = [];

function skillsBarData(skills) {
  skills['questions'].forEach(function (question, index) {
    verticalChartData.push({
      State: question,
      You: skills['answers'][index],
      "Your Manager": "0",
      "Your team": "0",
      "Your multi-raters": "0"
    })
  });
}

skillsBarData(skillsQA);


function teamEffectivenessBarData(teamEffectiveness) {
  teamEffectiveness['questions'].forEach(function (question, index) {
    teamEffectivenessChartData.push({
      State: question.split(':')[0],
      You: teamEffectiveness['answers'][index],
      "Your Manager": "0",
      "Your team": "0",
      "Your multi-raters": "0"
    })
  });
}

teamEffectivenessBarData(teamEffectivenessQA);

function generateBehaviorData(behaviors) {
  var questions = behaviors['questions'];
  var answers = behaviors['answers'];

  var question_titles = _.map(questions, function (question) {
    return (question.split('-')[0])
  });

  question_titles = _.sortedUniq(question_titles);

  var behaviourMapData = _.map(question_titles, function (title) {
    var answersList = [];
    var questionsList = [];

    for (var index = 0; index < questions.length; index++) {
      var currentQuestion = questions[index];
      var currentAnswer = answers[index];

      if (title == currentQuestion.split('-')[0]) {
        answersList.push(currentAnswer);
        questionsList.push(currentQuestion);
      }
    }

    var labels = _.map(questionsList, function (question) {
      return question.split('-')[1].trim();
    });

    var series = _.map(questionsList, function (question, index) {
      return {label: question.split('-')[1], values: [answersList[index] * 10, 0, 0]}
    });

    return {title: title, labels: labels, series: series}
  });
  return behaviourMapData;
}

function addNewlines(str) {
  var result = '';
  while (str.length > 0) {
    result += str.substring(0, 10) + '<br>';
    str = str.substring(10);
  }
  return result;
}

function dataPreparation(chartType, submission) {
  //console.log(managerEffectivenessQA['questions']);
  var dataSet = [];
  var colors = ['#3c3467', '#486ca0', '#40a498', '#88c7bc', '#d5d0ca'];

  submission['answers'].forEach(function (answer, index) {

        var question = submission['questions'][index];
        var breakQuestion = addNewlines(question);

        if (chartType == 'chart1') {
          if (answer != 0) {
            var template = {
              name: breakQuestion, size: (answer + 3) * 600,
              color: colors[answer], scaleFont: (answer * 3) + 23
            };
          }
        } else {
          if (answer == 0) {
            var template = {
              name: breakQuestion, size: (answer + 3) * 600,
              color: colors[answer], scaleFont: (answer * 3) + 23,
              "type": 0,
              "x": 700,
              "y": 700,
              "r": 50
            };
          }
        }

        if (template) {
          dataSet.push(template);
        }
      }
  )
  ;

  return dataSet;
}

// This is to identify, so the smaller bubble can be created.
function chart2DataPreparation(submission) {
  var chart2Data = {
    "name": "flare2",
    "children": [
      {
        "name": "graph",
        "children": dataPreparation('chart2', submission)
      }
    ]
  };
  return chart2Data;
}

function chart1DataPreparation(submission) {
  var chart1Data = {
    "name": "flare",
    "children": [
      {
        "name": "graph",
        "children": dataPreparation('chart1', submission)
      }
    ]
  };
  return chart1Data;
}

try{
  var behaviorData = generateBehaviorData(behaviors);
  ChartRenderer._renderBehaviourHChart(behaviorData);
}catch(e){
  console.log(e);
}

var chart1Data = chart1DataPreparation(managerEffectivenessQA);
var chart2Data = chart2DataPreparation(managerEffectivenessQA);


ChartRenderer._renderBubbleHBarChart(chart1Data, chart2Data);
ChartRenderer._renderTeamEffectivenessVBarChart();

