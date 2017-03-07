var appEnvironment = process.env.NODE_ENV || 'development';
var express = require('express'),
    config = require('../config/config.js')(appEnvironment),
    glob = require('glob'),
    _ = require('underscore'),
    mongoose = require('mongoose');
events = require('events'),
    helper = require('../config/helper.js'),
    serverEmitter = new events.EventEmitter();

//Loading constants
require(config.root + '/config/constants');

//Loading Models
var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
    require(model)(serverEmitter);
    console.log(model);
});

//MongoDB Connection
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var loadModels = function () {
    var User = mongoose.model('User');
    var Survey = mongoose.model('Survey');
    var Submission = mongoose.model('Submission');
    var Notification = mongoose.model('Notification');
    var SurveyRaters = mongoose.model('SurveyRaters');
    var SelectedRaters = mongoose.model('SelectedRaters');
    var SubmissionRaters = mongoose.model('SubmissionRaters');
    };

var createSurvey = function (name) {
  console.log('Create Survey...');
    var User = mongoose.model('User');
    var Survey = mongoose.model('Survey');
  User.find({}, function (err, users) {
    var newSurvey = new Survey;

    newSurvey.availableRaters = users;
    newSurvey.raters = users;
    newSurvey.assignees = users;
    newSurvey.state = 'started';
    newSurvey.expiry_date = new Date();
    newSurvey.archive = false;
    newSurvey.name = name;
    newSurvey = newSurvey.generateEmptyUserStats();

    newSurvey.save(function (err, survey) {
      if (err) {
        console.log('Error deploying Survey');
        throw 'Survey Deployment Error';
      }

      console.log('Deployed Surveys');

      _.each(users, function(user){
        if(user.role == 'Manager'){
          user.updateManagerProgress(survey);
        }
      });

      seedAssessment(survey);
      survey.sendNotifications(survey.assignees);
//        Notification.remove().exec();
    });
  })
};

//var surveyNames = ['2016 mid year populo survey', '2016 end year populo survey', '2015 mid year populo survey'];
var surveyNames = ['2016 mid year populo survey'];

_.each(surveyNames, function(name){
  createSurvey(name);
});

var seedAssessment = function (survey) {
  console.log('Generate Assessments ...');
  var Survey = mongoose.model('Survey');
  var Question = mongoose.model('Question');
  var Assessment = mongoose.model('Assessment');

  var availableAssessmentForRaters = [];

  function getAssessments(role){
    var tag_names = constants[role+'tag_names'];

    var assessments = _.map(tag_names, function (tag) {
      var newAssessment = new Assessment();
      newAssessment.tag = tag;
      newAssessment.survey = survey;
      var questions = seedQuestions(newAssessment);

      if(role == 'manager_'){
        newAssessment.questions = questions['managerQuestions'];
      }else if(role == 'team_leader_'){
        newAssessment.questions = questions['teamLeaderQuestions'];
      }else {
        newAssessment.questions = questions['question'];
      }

      newAssessment.comment_questions = seedComments(newAssessment);
      newAssessment.save();

      if(role == '' && (newAssessment.tag == 'BEHAVIORS' || newAssessment.tag == 'SKILLS')) {
        availableAssessmentForRaters.push(newAssessment);
      }

      return newAssessment;
    });

    return assessments;
 }

  survey.team_leader_assessments = getAssessments('team_leader_');
  survey.manager_assessments = getAssessments('manager_');
  survey.assessments = getAssessments('');

  survey.availableAssessmentForRaters = availableAssessmentForRaters;
  
  survey.save();
};

var seedQuestions = function (assessment) {

  var culcture_questions = [
    {'big_text': 'I feel I can make a difference here.', 'small_text': 'Make a difference here'}, 
	{'big_text': 'When I look at what we accomplish, I feel a sense of pride.', 'small_text': 'Sense of pride'}, 
	{'big_text': 'I am looking forward to what each new day brings.', 'small_text': 'What each new day brings'}, 
	{'big_text': 'I see myself continuously learning and improving.', 'small_text': 'Learning and improving'}, 
	{'big_text': 'I can aspire to be my best self at work.', 'small_text': 'My best self at work'}, 
	{'big_text': 'I am satisfied with the balance between work and personal life.', 'small_text': 'Satisfied with balanced work and personal life'}
  ];
  
  var team_effectiveness_questions = [
    {'big_text': 'Trust: My team is able to be vulnerable with one another, willing to admit their mistakes, acknowledge their weaknesses, and ask for help without hesitation.', 'small_text': 'Trust'}, 
	{'big_text': 'Healthy Conflict: My team challenges each other and understands that questioning the status quo is important to come to the best outcome.', 'small_text': 'Healthy Conflict'}, 
	{'big_text': 'Commitment: My team is clear on objectives, aligned on priorities, and supports decisions made and plans of action even if there was initial disagreement.', 'small_text': 'Commitment'}, 
	{'big_text': 'Accountability: My team consistently follows through on promises and commitments.', 'small_text': 'Accountability'}, 
	{'big_text': 'Results: My team consistently achieves its objectives and has a reputation for high performance.', 'small_text': 'Results'}
  ];
  
  var manager_effectiveness_questions = [
    {'big_text': 'My manager informs the team about important issues and changes.', 'small_text': 'Informs the team'}, 
	{'big_text': 'My manager communicates clear goals for our team.', 'small_text': 'Communicates clear goal'}, 
	{'big_text': 'My manager keeps the team focused on our priority results/deliverables.', 'small_text': 'Keep team focused'}, 
	{'big_text': 'My manager shows consideration for me as a person.', 'small_text': 'Shows consideration for me'}, 
	{'big_text': 'My manager gives me actionable feedback that helps me improve my performance.', 'small_text': 'Gives me actionable feedback'}, 
	{'big_text': 'My manager has positively influenced my growth and development.', 'small_text': 'Has positively influenced my growth'}, 
	{'big_text': 'My manager shows appreciation for good work and extra effort.', 'small_text': 'Shows appreciation'}
  ];
  
  var behavior_questions = [
    {'big_text': 'You make things happen - initiate', 'small_text': 'You make things happen - initiate'}, 
	{'big_text': 'You make things happen - own it', 'small_text': 'You make things happen - own it'}, 
	{'big_text': 'You make things happen - deliver', 'small_text': 'You make things happen - deliver'}, 
	{'big_text': 'You work smart - learn', 'small_text': 'You work smart - learn'}, 
	{'big_text': 'You work smart - be thorough', 'small_text': 'You work smart - be thorough'}, 
	{'big_text': 'You work smart - use your judgement', 'small_text': 'You work smart - use your judgement'}, 
	{'big_text': 'People want you on their team - collaborate', 'small_text': 'People want you on their team - collaborate'}, 
	{'big_text': 'People want you on their team - communicate', 'small_text': 'People want you on their team - communicate'}, 
	{'big_text': 'People want you on their team - be optimistic', 'small_text': 'People want you on their team - be optimistic'}
  ];
 
  var skill_questions = [
    {'big_text': 'Attracting, identifying, and evaluating talent', 'small_text': 'Attracting, identifying, & evaluating talent'}, 
	{'big_text': 'Coaching', 'small_text': 'Coaching'},
    {'big_text': 'Training design and facilitation', 'small_text': 'Training design & facilitation'},
    {'big_text': 'Relationship building (internal and external)', 'small_text': 'Relationship building'}, 
	{'big_text': 'Service oriented mentality', 'small_text': 'Service oriented mentality'}, 
    {'big_text': 'Business partner', 'small_text': 'Business partner'}, 
    {'big_text': 'Understanding of IMC business', 'small_text': 'Understanding of IMC business'}, 
    {'big_text': 'External market/competitor knowledge', 'small_text': 'External market/ competitor knowledge'}, 
	{'big_text': 'Knowledge of psychology and its application', 'small_text': 'Knowledge of psychology & its application'}, 
    {'big_text': 'Using data/metrics to drive change', 'small_text': 'Using data / metrics to drive change'}, 
    {'big_text': 'Knowledge of HR systems (workday/recsolu)', 'small_text': 'Knowledge of HR systems'}, 
	{'big_text': 'Knowledge of employment law (cobra, FLMA, SOX)', 'small_text': 'Knowledge of employment law'}
  ];
  
  //Manager Questions
  var manager_culcture_questions = [
    {'big_text': 'I feel I can make a difference here.', 'small_text': 'Make a difference here'}, 
	{'big_text': 'When I look at what we accomplish, I feel a sense of pride.', 'small_text': 'Sense of pride'}, 
	{'big_text': 'I am looking forward to what each new day brings.', 'small_text': 'What each new day brings'}, 
	{'big_text': 'I see myself continuously learning and improving.', 'small_text': 'Learning and improving'}, 
	{'big_text': 'I can aspire to be my best self at work.', 'small_text': 'My best self at work'}, 
	{'big_text': 'I am satisfied with the balance between work and personal life.', 'small_text': 'Satisfied with balanced work and personal life'}
  ];
  
  var manager_team_effectiveness_questions = [
    {'big_text': 'Trust: My team is able to be vulnerable with one another, willing to admit their mistakes, acknowledge their weaknesses, and ask for help without hesitation.', 'small_text': 'Trust'}, 
	{'big_text': 'Healthy Conflict: My team challenges each other and understands that questioning the status quo is important to come to the best outcome.', 'small_text': 'Healthy Conflict'}, 
	{'big_text': 'Commitment: My team is clear on objectives, aligned on priorities, and supports decisions made and plans of action even if there was initial disagreement.', 'small_text': 'Commitment'}, 
	{'big_text': 'Accountability: My team consistently follows through on promises and commitments.', 'small_text': 'Accountability'}, 
	{'big_text': 'Results: My team consistently achieves its objectives and has a reputation for high performance.', 'small_text': 'Results'}
  ];

  var manager_manager_effectiveness_questions = [
    {'big_text': 'My manager informs the team about important issues and changes.', 'small_text': 'Informs the team'}, 
	{'big_text': 'My manager communicates clear goals for our team.', 'small_text': 'Communicates clear goal'}, 
	{'big_text': 'My manager keeps the team focused on our priority results/deliverables.', 'small_text': 'Keep team focused'}, 
	{'big_text': 'My manager shows consideration for me as a person.', 'small_text': 'Shows consideration for me'}, 
	{'big_text': 'My manager gives me actionable feedback that helps me improve my performance.', 'small_text': 'Gives me actionable feedback'}, 
	{'big_text': 'My manager has positively influenced my growth and development.', 'small_text': 'Has positively influenced my growth'}, 
	{'big_text': 'My manager shows appreciation for good work and extra effort.', 'small_text': 'Shows appreciation'}
  ];

  var manager_manager_self_effectiveness_questions = [
    {'big_text': 'I inform the team about important issues and changes.', 'small_text': 'Informs the team'}, 
	{'big_text': 'I communicate clear goals for our team.', 'small_text': 'Communicates clear goal'}, 
	{'big_text': 'I keep the team focused on our priority results/deliverables.', 'small_text': 'Keep team focused'}, 
	{'big_text': 'I show consideration for my team members.', 'small_text': 'Shows consideration for team member'}, 
	{'big_text': 'I give actionable feedback that helps team members improve their performance.', 'small_text': 'Gives them actionable feedback'}, 
	{'big_text': 'I have positively influenced the growth and development of my team members.', 'small_text': 'Has positively influenced team growth'}, 
	{'big_text': 'I show appreciation for good work and extra effort.', 'small_text': 'Shows appreciation'}
  ];

  var manager_behavior_questions = [
    {'big_text': 'You make things happen - initiate', 'small_text': 'You make things happen - initiate'}, 
	{'big_text': 'You make things happen - own it', 'small_text': 'You make things happen - own it'}, 
	{'big_text': 'You make things happen - deliver', 'small_text': 'You make things happen - deliver'}, 
	{'big_text': 'You work smart - learn', 'small_text': 'You work smart - learn'}, 
	{'big_text': 'You work smart - be thorough', 'small_text': 'You work smart - be thorough'}, 
	{'big_text': 'You work smart - use your judgement', 'small_text': 'You work smart - use your judgement'}, 
	{'big_text': 'People want you on their team - collaborate', 'small_text': 'People want you on their team - collaborate'}, 
	{'big_text': 'People want you on their team - communicate', 'small_text': 'People want you on their team - communicate'}, 
	{'big_text': 'People want you on their team - be optimistic', 'small_text': 'People want you on their team - be optimistic'}
  ];

  var manager_skill_questions = [
    {'big_text': 'Business partner', 'small_text': 'Business partner'}, 
	{'big_text': 'Coaching', 'small_text': 'Coaching'},
    {'big_text': 'Relationship building (internal and external)', 'small_text': 'Relationship building'}, 
	{'big_text': 'Service oriented mentality', 'small_text': 'Service oriented mentality'}, 
    {'big_text': 'Talent attraction', 'small_text': 'Talent attraction'}, 
    {'big_text': 'Talent evaluation', 'small_text': 'Talent evaluation'}, 
    {'big_text': 'Talent identification', 'small_text': 'Talent identification'}, 
    {'big_text': 'Training design and facilitation', 'small_text': 'Training design & facilitation'},
    {'big_text': 'Use of data and metrics to drive change', 'small_text': 'Drive change'}, 
    {'big_text': 'Knowledge of IMC business', 'small_text': 'Knowledge of IMC business'}, 
    {'big_text': 'Knowledge of psychology and its application', 'small_text': 'Knowledge of psychology & its application'}, 
    {'big_text': 'Knowledge of Workday system', 'small_text': 'Knowledge of Workday system'}, 
    {'big_text': 'Knowledge of Recsolu system', 'small_text': 'Knowledge of Recsolu system'}, 
	{'big_text': 'Knowledge of employment law (cobra, FLMA, SOX)', 'small_text': 'Knowledge of employment law'}, 
    {'big_text': 'Knowledge of market/competitor', 'small_text': 'Knowledge of market/competitor'}
  ];

  //Team Leader Questions
  var team_leader_culcture_questions = [
    {'big_text': 'I feel I can make a difference here.', 'small_text': 'Make a difference here'}, 
	{'big_text': 'When I look at what we accomplish, I feel a sense of pride.', 'small_text': 'Sense of pride'}, 
	{'big_text': 'I am looking forward to what each new day brings.', 'small_text': 'What each new day brings'}, 
	{'big_text': 'I see myself continuously learning and improving.', 'small_text': 'Learning and improving'}, 
	{'big_text': 'I can aspire to be my best self at work.', 'small_text': 'My best self at work'}, 
	{'big_text': 'I am satisfied with the balance between work and personal life.', 'small_text': 'Satisfied with balanced work and personal life'}
  ];
  
  var team_leader_team_effectiveness_questions = [
    {'big_text': 'Trust: My team is able to be vulnerable with one another, willing to admit their mistakes, acknowledge their weaknesses, and ask for help without hesitation.', 'small_text': 'Trust'}, 
	{'big_text': 'Healthy Conflict: My team challenges each other and understands that questioning the status quo is important to come to the best outcome.', 'small_text': 'Healthy Conflict'}, 
	{'big_text': 'Commitment: My team is clear on objectives, aligned on priorities, and supports decisions made and plans of action even if there was initial disagreement.', 'small_text': 'Commitment'}, 
	{'big_text': 'Accountability: My team consistently follows through on promises and commitments.', 'small_text': 'Accountability'}, 
	{'big_text': 'Results: My team consistently achieves its objectives and has a reputation for high performance.', 'small_text': 'Results'}
  ];

  var team_leader_manager_effectiveness_questions = [
    {'big_text': 'My manager informs the team about important issues and changes.', 'small_text': 'Informs the team'}, 
	{'big_text': 'My manager communicates clear goals for our team.', 'small_text': 'Communicates clear goal'}, 
	{'big_text': 'My manager keeps the team focused on our priority results/deliverables.', 'small_text': 'Keep team focused'}, 
	{'big_text': 'My manager shows consideration for me as a person.', 'small_text': 'Shows consideration for me'}, 
	{'big_text': 'My manager gives me actionable feedback that helps me improve my performance.', 'small_text': 'Gives me actionable feedback'}, 
	{'big_text': 'My manager has positively influenced my growth and development.', 'small_text': 'Has positively influenced my growth'}, 
	{'big_text': 'My manager shows appreciation for good work and extra effort.', 'small_text': 'Shows appreciation'}
  ];
  var team_leader_self_effectiveness_questions = [
    {'big_text': 'I inform the team about important issues and changes.', 'small_text': 'Informs the team'}, 
	{'big_text': 'I communicate clear goals for our team.', 'small_text': 'Communicates clear goal'}, 
	{'big_text': 'I keep the team focused on our priority results/deliverables.', 'small_text': 'Keep team focused'}, 
	{'big_text': 'I show consideration for my team members.', 'small_text': 'Shows consideration for team member'}, 
	{'big_text': 'I give actionable feedback that helps team members improve their performance.', 'small_text': 'Gives them actionable feedback'}, 
	{'big_text': 'I have positively influenced the growth and development of my team members.', 'small_text': 'Has positively influenced team growth'}, 
	{'big_text': 'I show appreciation for good work and extra effort.', 'small_text': 'Shows appreciation'}
  ];

  var team_leader_behavior_questions = [
    {'big_text': 'You make things happen - initiate', 'small_text': 'You make things happen - initiate'}, 
	{'big_text': 'You make things happen - own it', 'small_text': 'You make things happen - own it'}, 
	{'big_text': 'You make things happen - deliver', 'small_text': 'You make things happen - deliver'}, 
	{'big_text': 'You work smart - learn', 'small_text': 'You work smart - learn'}, 
	{'big_text': 'You work smart - be thorough', 'small_text': 'You work smart - be thorough'}, 
	{'big_text': 'You work smart - use your judgement', 'small_text': 'You work smart - use your judgement'}, 
	{'big_text': 'People want you on their team - collaborate', 'small_text': 'People want you on their team - collaborate'}, 
	{'big_text': 'People want you on their team - communicate', 'small_text': 'People want you on their team - communicate'}, 
	{'big_text': 'People want you on their team - be optimistic', 'small_text': 'People want you on their team - be optimistic'}
  ];

  var team_leader_skill_questions = [
    {'big_text': 'Attracting, identifying, and evaluating talent', 'small_text': 'Attracting, identifying, & evaluating talent'}, 
	{'big_text': 'Coaching', 'small_text': 'Coaching'},
    {'big_text': 'Training design and facilitation', 'small_text': 'Training design & facilitation'},
    {'big_text': 'Relationship building (internal and external)', 'small_text': 'Relationship building'}, 
	{'big_text': 'Service oriented mentality', 'small_text': 'Service oriented mentality'}, 
    {'big_text': 'Business partner', 'small_text': 'Business partner'}, 
    {'big_text': 'Understanding of IMC business', 'small_text': 'Understanding of IMC business'}, 
    {'big_text': 'External market/competitor knowledge', 'small_text': 'External market/ competitor knowledge'}, 
	{'big_text': 'Knowledge of psychology and its application', 'small_text': 'Knowledge of psychology & its application'}, 
    {'big_text': 'Using data/metrics to drive change', 'small_text': 'Using data / metrics to drive change'}, 
    {'big_text': 'Knowledge of HR systems (workday/recsolu)', 'small_text': 'Knowledge of HR systems'}, 
	{'big_text': 'Knowledge of employment law (cobra, FLMA, SOX)', 'small_text': 'Knowledge of employment law'}
  ];

  var general_comment_questions = ['List 1-2 things you’d like your manager to continue doing', 'List 1-2 things you’d like your manager to start/stop doing'];

  var manager_effectiveness_comment_questions = general_comment_questions.push('Please provide comments or examples here. These comments are valuable as they make the feedback more actionable.');

  console.log('Generate Questions...');
  var Question = mongoose.model('Question');

  var questions = [];
  var team_leader_questions = [];
  var manager_questions = [];
  var options = [];

  switch (assessment.tag) {
    case 'BEHAVIORS':
      questions = behavior_questions;
      team_leader_questions = team_leader_behavior_questions;
      manager_questions = manager_behavior_questions;
      options = constants['behaviors_question_options'];
      break;
    case 'SKILLS':
      questions = skill_questions;
      team_leader_questions = team_leader_skill_questions;
      manager_questions = manager_skill_questions;
      options = constants['skill_question_options'];
      break;
    //case 'SKILLS1':
    //  questions = skill_questions;
    //  options = constants['skill_question_options'];
    //  break;
    case 'MANAGER EFFECTIVENESS':
      questions = manager_effectiveness_questions;
      team_leader_questions = team_leader_manager_effectiveness_questions;
      manager_questions = manager_manager_effectiveness_questions;
      options = constants['question_options'];
      break;
    case 'SELF EFFECTIVENESS':
      team_leader_questions = team_leader_self_effectiveness_questions;
      manager_questions = manager_manager_self_effectiveness_questions;
      options = constants['question_options'];
      break;
    case 'culcture':
      questions = culcture_questions;
      team_leader_questions = team_leader_culcture_questions;
      manager_questions = manager_culcture_questions;
      options = constants['question_options'];
      break;
    case 'TEAM EFFECTIVENESS':
      questions = team_effectiveness_questions;
      team_leader_questions = team_leader_team_effectiveness_questions;
      manager_questions = manager_team_effectiveness_questions;
      options = constants['question_options'];
      break;
  }

  var employeeQuestionsList = _.map(questions, function (question) {
    var newQuestion = new Question();
    newQuestion.title = question.big_text;
    newQuestion.small_title = question.small_text;
    newQuestion.not_able_to_judgement = false;
    newQuestion.options = options;

    newQuestion.save();
    return newQuestion;
  });


  var managerQuestionsList = _.map(manager_questions, function (question) {
    var newQuestion = new Question();
    newQuestion.title = question.big_text;
    newQuestion.small_title = question.small_text;
    newQuestion.not_able_to_judgement = false;
    newQuestion.options = options;

    newQuestion.save();
    return newQuestion;
  });


  var teamLeaderQuestionsList = _.map(team_leader_questions, function (question) {
    var newQuestion = new Question();
    newQuestion.title = question.big_text;
    newQuestion.small_title = question.small_text;
    newQuestion.not_able_to_judgement = false;
    newQuestion.options = options;

    newQuestion.save();
    return newQuestion;
  });

  return {question: employeeQuestionsList, managerQuestions: managerQuestionsList, teamLeaderQuestions: teamLeaderQuestionsList};
};

var seedComments = function (assessment) {
  var general_comment_questions = ['Please provide comments or examples here. These comments are valuable as they ' +
      'make the feedback more actionable.'];
  var manager_effectiveness_comment_questions = ['List 1-2 things you’d like your manager to continue doing',
    'List 1-2 things you’d like your manager to start/stop doing',
    'Please provide comments or examples here. These comments are valuable as they ' +
        'make the feedback more actionable.'];
  //var manager_self_effectiveness_comment_questions = ['List 1-2 things I’d like to continue doing',
  //  'List 1-2 things I’d like to start/stop doing',
  //  'Please provide comments or examples here. These comments are valuable as they ' +
  //  'make the feedback more actionable.'];

  console.log('Generate Questions...');
  var Question = mongoose.model('Question');

  var comments = [];

  switch (assessment.tag) {
    case 'BEHAVIORS':
      comments = general_comment_questions;
      break;
    case 'SKILLS':
      comments = general_comment_questions;
      break;
    case 'SKILLS1':
      comments = general_comment_questions;
      break;
    case 'MANAGER EFFECTIVENESS':
      comments = manager_effectiveness_comment_questions;
      break;
    case 'SELF EFFECTIVENESS':
      comments = general_comment_questions;
      break;
    case 'culcture':
      comments = general_comment_questions;
      break;
    case 'TEAM EFFECTIVENESS':
      comments = general_comment_questions;
      break;
  }

  var commentsList = _.map(comments, function (comment) {
    var newQuestion = new Question();
    newQuestion.title = comment;

    newQuestion.save();
    return newQuestion;
  });

  return commentsList;
};
