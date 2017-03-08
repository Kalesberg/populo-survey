$(document).ready(function() {
    // culcture Chart
    culctureChart(culctureQA, '#culcture', '#culcture-support');
    
    // culcture Chart Avg
    for(ii=0; ii<managerList.length; ii++) {
        var divId = 'culcture-avg-'+managerList[ii];
        var divSupportId = 'culcture-support-avg-'+managerList[ii];
        $('.dynamic-culcture').append('<p class="blue-color text-left m-l-30"><strong class="blue-color">'+ managerNameList[ii] + '\'s Team</strong></p><div id="culcture-avg" class="'+divId+'"></div><div id="culcture-support-avg" class="'+divSupportId+'"></div><br /><br />');
        
        var avgEmployeeculcture = {};
        avgEmployeeculcture.questions = employeeculcture[managerList[ii]].length > 0 ? employeeculcture[managerList[ii]][0].questions : [];
        if(employeeculcture[managerList[ii]])
            avgEmployeeculcture.answers = prepareAvg(employeeculcture[managerList[ii]]);
        
        if(employeeculcture[managerList[ii]].length > 0)
            culctureChart(avgEmployeeculcture, '.'+divId, '.'+divSupportId);
        else
            $('.'+divId).html('<strong class="blue-color">No Data</strong><br /><br /><br />');
    } 
  
    // Team Effectiveness Chart
    for(ii=0; ii<managerList.length; ii++) {
        var divId = 'team-effectiveness-'+managerList[ii];
        $('.dynamic-teameffectiveness').append('<p class="blue-color text-left m-l-30"><strong class="blue-color">'+ managerNameList[ii] + '\'s Team</strong></p><div class="col-md-12 g-cleared chart-wrapper p-50 team-effectiveness__chart-wrapper" id="'+divId+'"></div><div class="skill__item"></div><br /><br />');
        
        if (managerTeamEffectiveness[managerList[ii]][0])
            teamEffectivenessChart(managerTeamEffectiveness[managerList[ii]][0], employeeTeamEffectiveness[managerList[ii]], '#'+divId);
        else 
            $('#'+divId).html('<strong class="blue-color">No Data</strong><br /><br /><br />');
    } 

    // Manager Effectiveness Chart
    managerEffectivenessChart(managerEffectivenessQA, '#manager-effectiveness', '#manager-effectiveness-support');
    
    // Manager Effectiveness MyTeam
    var avgMyTeamManagerEffectiveness = {};
    avgMyTeamManagerEffectiveness.questions = myTeamManagerEffectiveness.length > 0 ? myTeamManagerEffectiveness[0].questions : [];
    if(myTeamManagerEffectiveness)
        avgMyTeamManagerEffectiveness.answers = prepareAvg(myTeamManagerEffectiveness);
    
    if(myTeamManagerEffectiveness)
        managerEffectivenessChart(avgMyTeamManagerEffectiveness, '.manager-effectiveness-myteam', '.manager-effectiveness-support-myteam');
    else 
        $('.manager-effectiveness-myteam').html('<strong class="blue-color">No Data</strong><br /><br /><br />');
    
    // Manager Effectiveness Chart Avg
    for(ii=0; ii<managerList.length; ii++) {
        var divId = 'manager-effectiveness-avg-'+managerList[ii];
        var divSupportId = 'manager-effectiveness-support-avg-'+managerList[ii];
        $('.dynamic-manager-effectiveness').append('<p class="blue-color text-left m-l-30"><strong class="blue-color">'+ managerNameList[ii] + '\'s Team</strong></p><div id="manager-effectiveness-avg" class="'+divId+'"></div><div id="manager-effectiveness-support-avg" class="'+divSupportId+'"></div><br /><br />');
        
        var avgEmployeeManagerEffectiveness = {};
        avgEmployeeManagerEffectiveness.questions = employeeManagerEffectiveness[managerList[ii]].length > 0 ? employeeManagerEffectiveness[managerList[ii]][0].questions : [];
        if(employeeManagerEffectiveness[managerList[ii]])
            avgEmployeeManagerEffectiveness.answers = prepareAvg(employeeManagerEffectiveness[managerList[ii]]);
        
        if(employeeManagerEffectiveness[managerList[ii]].length > 0)
            managerEffectivenessChart(avgEmployeeManagerEffectiveness, '.'+divId, '.'+divSupportId);
        else
            $('.'+divId).html('<strong class="blue-color">No Data</strong><br /><br /><br />');
    } 
  
    // Behaviour Chart
    var expandView = true;
    behaviourChart(behaviors, multiRatersBehaviours, employeeTeamRatingBehaviours, employeeManagerRatingBehaviours, '.behaviours__chart-wrapper', expandView);
  
    // Behaviour Chart Avg
    var avgManagerBehaviour = [];
    var avgEmployeeBehaviour = [];
    
    for(ii=0; ii<managerList.length; ii++) {
        arrManagerObj = managerBehaviour[managerList[ii]];
        for(jj=0; jj<arrManagerObj.length; jj++) {
            avgManagerBehaviour.push(arrManagerObj[jj]);
        }
        
        arrEmployeeObj = employeeBehaviour[managerList[ii]];
        for(jj=0; jj<arrEmployeeObj.length; jj++) {
            avgEmployeeBehaviour.push(arrEmployeeObj[jj]);
        }
    }
    specialCase = true;
    behaviourChart(behaviors, avgManagerBehaviour, avgEmployeeBehaviour, [], '.behaviours__chart-wrapper-avg', expandView, specialCase);

    // Skill Chart
    arrEmployeeSkills = [];
    for(ii=0; ii<managerList.length; ii++) {
        arrEmployeeObj = employeeSkills[managerList[ii]];
        for(jj=0; jj<arrEmployeeObj.length; jj++) {
            arrEmployeeSkills.push(arrEmployeeObj[jj]);
        }
    }
    
    var avgEmployeeSkills = {};
    avgEmployeeSkills.questions = arrEmployeeSkills.length > 0 ? arrEmployeeSkills[0].questions : [];
    if(arrEmployeeSkills)
        avgEmployeeSkills.answers = prepareAvg(arrEmployeeSkills);
        
    skillChart(avgEmployeeSkills, [], [], [], '.skills__chart-wrapper');
});