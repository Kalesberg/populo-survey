// culcture Chart
function culctureChart(culctureQA, bubble1Div, bubble2Div) {
    var culcture_bubble1Data = bubble1DataPreparation(culctureQA);
    var culcture_bubble2Data = [];
    
    ChartRenderer._renderBubbleHBarChart(culcture_bubble1Data, culcture_bubble2Data, bubble1Div, bubble2Div);
}

// Team Effectiveness Chart
function teamEffectivenessChart(teamEffectivenessQA, employeeTeamEffectiveness, divId) {
    var teamEffectivenessChartData = [];
    var avgEmployeeTeamEffectiveness = [];
    
    if(employeeTeamEffectiveness)
        avgEmployeeTeamEffectiveness = prepareAvg(employeeTeamEffectiveness);
    
    if(teamEffectivenessQA) {
        teamEffectivenessQA['questions'].forEach(function (question, index) {
            teamEffectivenessChartData.push({
                State: question.split(':')[0],
                You: teamEffectivenessQA['answers'][index],
                "Your team": avgEmployeeTeamEffectiveness[index] != undefined ? avgEmployeeTeamEffectiveness[index] : "0"
            })
        });
    }
    teamEffectivenessChartYAxisOption = {
        "0": "Not at all",
        "1": "Not really",
        "2": "Neutral",
        "3": "Yes",
        "4": "Enthusiastic yes"
    };
    teamEffectivenessChartColorRange = ["#1C4594", "#12AEA9"];
    teamEffectivenessChartBarWidth = 30;
    ChartRenderer._renderVBarChart(teamEffectivenessChartData, divId, 
                                    teamEffectivenessChartYAxisOption, teamEffectivenessChartColorRange, 
                                    teamEffectivenessChartBarWidth);
}

// Manager Self Effectiveness Chart
function managerSelfEffectivenessChart(selfEffectivenessQA, employeeManagerEffectiveness, divId) {
    var managerSelfEffectivenessChartData = [];
    var avgEmployeeManagerEffectiveness = [];
    
    if(employeeManagerEffectiveness)
        avgEmployeeManagerEffectiveness = prepareAvg(employeeManagerEffectiveness);
    
    if(selfEffectivenessQA) {
        selfEffectivenessQA['questions'].forEach(function (question, index) {
            managerSelfEffectivenessChartData.push({
                State: question.split(':')[0],
                You: selfEffectivenessQA['answers'][index],
                "Your team": avgEmployeeManagerEffectiveness[index] != undefined ? avgEmployeeManagerEffectiveness[index] : "0"
            })
        });
    }
  
    managerSelfEffectivenessChartYAxisOption = {
        "0": "Not at all",
        "1": "Not really",
        "2": "Neutral",
        "3": "Yes",
        "4": "Enthusiastic yes"
    };
    managerSelfEffectivenessChartColorRange = ["#1C4594", "#12AEA9"];
    managerSelfEffectivenessChartBarWidth = 30;
    ChartRenderer._renderVBarChart(managerSelfEffectivenessChartData, divId, 
                                    managerSelfEffectivenessChartYAxisOption, managerSelfEffectivenessChartColorRange, 
                                    managerSelfEffectivenessChartBarWidth);
}

// Manager Effectiveness Chart
function managerEffectivenessChart(managerEffectivenessQA, bubble1Div, bubble2Div) {
    var manager_effectiveness_bubble1Data = bubble1DataPreparation(managerEffectivenessQA);
    var manager_effectiveness_bubble2Data = [];

    ChartRenderer._renderBubbleHBarChart(manager_effectiveness_bubble1Data, manager_effectiveness_bubble2Data, 
                                            bubble1Div, bubble2Div);
}

// Behaviour Chart
function behaviourChart(behaviors, multiRatersBehaviours, employeeTeamRating, employeeManagerRating, divId, expandView, specialCase) {
    var behaviourMapData = []
    var questions = behaviors['questions'];
    var your_answers = behaviors['answers'];
    var your_manager_answers = employeeManagerRating && employeeManagerRating[0] && employeeManagerRating[0]['answers'] ? employeeManagerRating[0]['answers'] : [];
    var your_team_answers = prepareAvg(employeeTeamRating);
    var your_raters_answers = prepareAvg(multiRatersBehaviours);
    var multi_raters_sample_size = multiRatersBehaviours.length > 0 ? ' (N=' + multiRatersBehaviours.length + ')' : '';
    var scorelabel = ['Significant growth needed', 'Some growth needed', 'Adequately demonstrates this behavior', 'Exemplifies', 'Exemplifies and successfully grows it in others'];

    var question_titles = _.map(questions, function (question) {
        return (question.split('-')[0])
    });

    question_titles = _.sortedUniq(question_titles);

    var behaviourMapData = _.map(question_titles, function (title) {
        var arrObj = [];

        for (var index = 0; index < questions.length; index++) {
            var currentQuestion = questions[index];
      
            if (title == currentQuestion.split('-')[0]) {
                var currentObj = {};
                var avgPercentage = 0;
                var divisor = 0;
                currentObj.children = [];
                
                if(typeof your_answers[index] != 'undefined' && !specialCase) {
                    var obj = {};
                    var point = your_answers[index]; 
                    
                    obj.name = 'You';
                    obj.score = point * 25;
                    //obj.score = obj.score < 3 ? 3 : obj.score > 97 ? 97 : obj.score;
                    obj.tooltip = sliderScoreLabel(obj.score, scorelabel);
                    obj.scorelabel = '';
                    
                    avgPercentage += point * 25;
                    divisor++;
                    
                    currentObj.children.push(obj);
                }
                
                if(typeof your_manager_answers[index] != 'undefined') {
                    var obj = {};
                    var point = your_manager_answers[index]; 
                    
                    obj.name = 'Your Manager';
                    obj.score = point * 25;
                    //obj.score = obj.score < 3 ? 3 : obj.score > 97 ? 97 : obj.score;
                    obj.tooltip = sliderScoreLabel(obj.score, scorelabel);
                    obj.scorelabel = '';
                    
                    avgPercentage += point * 25;
                    divisor++;
                    
                    currentObj.children.push(obj);
                }
                
                if(typeof your_team_answers[index] != 'undefined') {
                    var obj = {};
                    var point = your_team_answers[index]; 
                    
                    obj.name = specialCase ? 'Avg. Team Members' : 'Your team';
                    obj.score = point * 25;
                    //obj.score = obj.score < 3 ? 3 : obj.score > 97 ? 97 : obj.score;
                    obj.tooltip = sliderScoreLabel(obj.score, scorelabel);
                    obj.scorelabel = '';
                    
                    avgPercentage += point * 25;
                    divisor++;
                    
                    currentObj.children.push(obj);
                }
                
                if(typeof your_raters_answers[index] != 'undefined') {
                    var obj = {};
                    var point = your_raters_answers[index]; 
                    
                    obj.name = specialCase ? 'Avg. Managers' : 'Your multi-raters' + multi_raters_sample_size;
                    obj.score = point * 25;
                    //obj.score = obj.score < 3 ? 3 : obj.score > 95 ? 95 : obj.score;
                    obj.tooltip = sliderScoreLabel(obj.score, scorelabel);
                    obj.scorelabel = '';
                    
                    avgPercentage += point * 25;
                    divisor++;
                    
                    currentObj.children.push(obj);
                }
        
                avgPercentage = divisor == 0 ? 0 : (avgPercentage/divisor);
        
                currentObj.name = currentQuestion.split('-')[1].trim();
                currentObj.score = avgPercentage;
                //currentObj.score = avgPercentage < 3 ? 3 : avgPercentage > 95 ? 95 : avgPercentage;
                currentObj.scorelabel = '';
                currentObj.tooltip = sliderScoreLabel(currentObj.score, scorelabel);
                
                arrObj.push(currentObj);
            }
        }

        return {title: title.trim(), arrObj: arrObj}
    });
    
    for(tt=0; tt < behaviourMapData.length; tt++) {
        
        var childDivId = 'behaviorsDiv' + (tt+1);
        var wrapperDivId = divId + ' .' + childDivId;

        $(divId).append('<div class="output-stats-column col-md-4"> <div class="' + childDivId + ' output-stats-column--traits"></div></div>');

        ChartRenderer._renderSlider(behaviourMapData[tt].arrObj, wrapperDivId, behaviourMapData[tt].title, expandView);
    }
}

function sliderScoreLabel(score, scorelabel) {
    var label = '';
        
    if (score >= 0 && score <= 12.5)
        label = scorelabel[0];
    else if (score > 12.5 && score <= 37.5)
        label = scorelabel[1];
    else if (score > 37.5 && score <= 62.5)
        label = scorelabel[2];
    else if (score > 62.5 && score <= 87.5)
        label = scorelabel[3];
    else if (score > 87.5)
        label = scorelabel[4];
        
    return label;
}

// Skill Chart
function skillChart(skillsQA, multiRatersSkills, employeeTeamRating, employeeManagerRating, divId) {
    var avgMultiRatersSkills = [];
    var avgEmployeeTeamEffectiveness = [];
    var skillChartData = [];
    
    if(multiRatersSkills)
        avgMultiRatersSkills = prepareAvg(multiRatersSkills);
        
    if(employeeTeamRating)
        avgEmployeeTeamEffectiveness = prepareAvg(employeeTeamRating);
    
    if(skillsQA['questions']) {
        skillsQA['questions'].forEach(function (question, index) {
            skillChartData.push({
                State: question,
                You: skillsQA['answers'][index],
                "Your Manager": employeeManagerRating && employeeManagerRating[0] && employeeManagerRating[0]['answers'] != undefined && employeeManagerRating[0]['answers'][index] != undefined ? employeeManagerRating[0]['answers'][index] : "0", 
                "Your team": avgEmployeeTeamEffectiveness[index] != undefined ? avgEmployeeTeamEffectiveness[index] : "0",
                "Your multi-raters": avgMultiRatersSkills[index] != undefined ? avgMultiRatersSkills[index] : "0"
            })
        });
    }
    
    skillChartYAxisOption = {
        "0": "Significant growth needed",
        "1": "Some growth needed",
        "2": "Adequately exhibits this skill",
        "3": "Exemplifies",
        "4": "Exemplifies and successfully grows it in others"
    };
    skillChartColorRange = ["#1C4594", "#12AEA9", "#C2C3C4", "#DFE045"];
    skillChartBarWidth = 15;
    ChartRenderer._renderVBarChart(skillChartData, divId, skillChartYAxisOption, 
                                    skillChartColorRange, skillChartBarWidth);
}

// Helper Functions Bubble Chart
function bubble1DataPreparation(submission) {
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

// This is to identify, so the smaller bubble can be created.
function bubble2DataPreparation(submission) {
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

function dataPreparation(chartType, submission) {
    //console.log(managerEffectivenessQA['questions']);
    var dataSet = [];
    var colors = ['#d5d0ca', '#E3E672', '#40a498', '#1A72B9', '#3c3467'];
    var text_colors = ['#0F73B9', '#0F73B9', '#ffffff', '#ffffff', '#ffffff'];

    if(submission['answers']) {
        submission['answers'].forEach(function (answer, index) {
            answer = Math.round(answer);
            var question = submission['questions'][index];
            var breakQuestion = addNewlines(question, 15);
            
            if (chartType == 'chart1') {
                //if (answer != 0) {
                    var template = {
                        name: breakQuestion, size: (answer + 3) * 700,
                        color: colors[answer], text_color: text_colors[answer], scaleFont: (answer * 3) + 26
                    };
                // }
            } else {
                if (answer == 0) {
                    var template = {
                        name: breakQuestion, size: (answer + 3) * 600,
                        color: colors[answer], scaleFont: (answer * 3) + 25,
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
        });
    }
    return dataSet;
}

function addNewlines(str, width) {
    var result = '';
    var line = [];
    var words = str.split(/\s+/).reverse();
    while (word = words.pop()) {
        line.push(word);
        var joinedLine = line.join(" ");
        if (joinedLine.length > width) {
            line.pop();
            result += line.join(" ") + '<br>';
            line = [word];
        }
    }
    result += line.join(" ") + '<br>';
    return result;
}

// Helper function - others
function prepareAvg(arr) {
    var avgArr = [];
    
    for(i=0; i<arr.length; i++) {
        obj = arr[i];
        for(j=0; j<obj.answers.length; j++) {
            if(i==0)
                avgArr[j] = 0;
                
            avgArr[j] += obj.answers[j];
        }
    }
    
    for(k=0; k<avgArr.length; k++) {
        avgArr[k] = Math.round(((avgArr[k]/i) * 100) / 100);
    }
    return avgArr;
}