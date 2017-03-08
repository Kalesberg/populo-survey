$(document).ready(function() {
  // culcture Chart
  culctureChart(culctureQA, '#culcture', '#culcture-support');

  // Team Effectiveness Chart
  teamEffectivenessChart(teamEffectivenessQA, employeeTeamEffectiveness, '.team-effectiveness__chart-wrapper');

  // Manager Effectiveness Chart
  managerEffectivenessChart(managerEffectivenessQA, '#manager-effectiveness', '#manager-effectiveness-support');

  // Behaviour Chart
  var expandView = true;
  behaviourChart(behaviors, multiRatersBehaviours, employeeTeamRatingBehaviours, employeeManagerRatingBehaviours, '.behaviours__chart-wrapper', expandView);

  // Skill Chart
  skillChart(skillsQA, multiRatersSkills, employeeTeamRatingSkills, employeeManagerRatingSkills, '.skills__chart-wrapper');
});