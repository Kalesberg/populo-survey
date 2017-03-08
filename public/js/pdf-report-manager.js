$(document).ready(function() {
  // culcture Chart
  culctureChart(culctureQA, '#culcture', '#culcture-support');
  
  // culcture Chart Avg
  var avgEmployeeculcture = {};
  avgEmployeeculcture.questions = employeeculcture.length > 0 ? employeeculcture[0].questions : [];
  if(employeeculcture)
    avgEmployeeculcture.answers = prepareAvg(employeeculcture);
  culctureChart(avgEmployeeculcture, '#culcture-avg', '#culcture-support-avg');

  // Team Effectiveness Chart
  teamEffectivenessChart(teamEffectivenessQA, employeeTeamEffectiveness, '.team-effectiveness__chart-wrapper');

  // Manager Effectiveness Chart
  managerEffectivenessChart(managerEffectivenessQA, '#manager-effectiveness', '#manager-effectiveness-support');
  
  // Manager Effectiveness Chart Avg
  var avgEmployeeManagerEffectiveness = {};
  avgEmployeeManagerEffectiveness.questions = employeeManagerEffectiveness.length > 0 ? employeeManagerEffectiveness[0].questions : [];
  if(employeeManagerEffectiveness)
    avgEmployeeManagerEffectiveness.answers = prepareAvg(employeeManagerEffectiveness);
  managerEffectivenessChart(avgEmployeeManagerEffectiveness, '#manager-effectiveness-avg', '#manager-effectiveness-support-avg');

  // Behaviour Chart
  var expandView = true;
  behaviourChart(behaviors, multiRatersBehaviours, employeeTeamRatingBehaviours, employeeManagerRatingBehaviours, '.behaviours__chart-wrapper', expandView);
  // Behaviour Chart Avg
  behaviourChart(behaviors, employeeMultiratersBehaviour, employeeBehaviour, [], '.behaviours__chart-wrapper-avg', expandView);

  // Skill Chart
  skillChart(skillsQA, multiRatersSkills, employeeTeamRatingSkills, employeeManagerRatingSkills, '.skills__chart-wrapper');
});