var appEnvironment = process.env.NODE_ENV || 'development';
var express = require('express'),
    config = require('../config/config.js')(appEnvironment),
    glob = require('glob'),
    _ = require('underscore'),
    fs = require('fs'),
    mongoose = require('mongoose');
    events = require('events'),
    serverEmitter = new events.EventEmitter();

//Loading constants
require(config.root + '/config/constants');

//Loading Models
var models = glob.sync(config.root + '/app/models/*.js');
models.forEach(function (model) {
  require(model)(serverEmitter);
});

//MongoDB Connection
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', function () {
  throw new Error('unable to connect to database at ' + config.db);
});

var Questionbank = mongoose.model('Questionbank');
var Template = mongoose.model('Template');
var Assessment = mongoose.model('Assessment');

var templatesData = [
  {name: 'Employee Survey Template', dimensions: '', role: 'employee', id: 1},
  {name: 'Leader Survey Template', dimensions: '', role: 'leader', id: 2},
  {name: 'Manager Survey Template', dimensions: '', role: 'manager', id: 3}
];

var createTemplate = function createTemplate(name, dimensionsList, id, survey_type){
  console.log('Create Template...');

  var newTemplate = new Template();
  newTemplate.title = name;
  newTemplate.survey_type = survey_type;
  newTemplate.selected_dimensions = dimensionsList;
  newTemplate.created_at = new Date();
  newTemplate.updated_at = new Date();

  createQuestionBank(newTemplate, id);
};

var createQuestionBank = function createQuestionBank(template, id) {
  console.log('Create QuestionBank...');

  var newQuestionBank = new Questionbank();

  newQuestionBank.questions = questionsList(id);
  newQuestionBank.created_at = new Date();
  newQuestionBank.updated_at = new Date();

  template.question_bank = newQuestionBank;

  template.save(function(err, doc){
    seedAssessment(template);

    newQuestionBank.save(function (err, questionBank) {
      if (err) {
        console.log('Error deploying QuestionBank');
        throw 'QuestionBank Deployment Error';
      }

      console.log('Deployed QuestionBank');
    });
  })
};

var questionsList = function questionsList(id) {
  var Question = mongoose.model('Question');

  var skill_questions = [];

  var createdQuestions = _.map(skill_questions, function(question){
    var newQuestion = new Question();
    newQuestion.title = question['big_text'];
    newQuestion.small_title = question['small_text'];
    newQuestion.options = constants.skill_question_options;
    newQuestion.created_at = new Date();
    newQuestion.updated_at = new Date();
    newQuestion.save(function(err, doc){
      console.log('successfully created question');
    });

    return newQuestion;
  });

  return createdQuestions;
};

var seedAssessment = function (template) {
  console.log('Generate Assessments ...');
  var Template = mongoose.model('Template');
  var Question = mongoose.model('Question');
  var Assessment = mongoose.model('Assessment');

  assessments = [];
  arrObj = arrQAssessments;
  
  for(i = 0; i < arrObj.length; i++) {
    var newAssessment = new Assessment();
    newAssessment.tag = arrObj[i].tag;
    newAssessment.index = i;
    newAssessment.instruction_text = arrObj[i].instruction_text;
    newAssessment.skill = arrObj[i].skill;  

    console.log('Generate Questions...');
    var Question = mongoose.model('Question');

    var questions = arrObj[i].ques;
    var options = arrObj[i].opt; 

    var questionList = _.map(questions, function (question) {
      var newQuestion = new Question();
      newQuestion.title = question.q;
      newQuestion.small_title = question.q;
      newQuestion.hint = question.h;
      newQuestion.not_able_to_judgement = false;
      newQuestion.options = options;

      newQuestion.save();
      return newQuestion;
    });

    newAssessment.questions = questionList;
    //newAssessment.comment_questions = seedComments(newAssessment);

    newAssessment.save();
    assessments.push(newAssessment);
  }

  template.team_leader_assessments = assessments;
  template.manager_assessments = assessments;
  template.assessments = assessments;

  template.save();
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

  var Question = mongoose.model('Question');
  var comments = [];
  comments = general_comment_questions;
      
  var commentsList = _.map(comments, function (comment) {
    var newQuestion = new Question();
    newQuestion.title = comment;

    newQuestion.save();
    return newQuestion;
  });

  return commentsList;
};

var arrQAssessments = [
  {   
      tag:'Culture', 
      instruction_text: '', 
      ques:[
              {q:'I experience that communications are open and accessible.',h:''}, 
              {q:'I am confident in management’s competence in coordinating human and material resources.',h:''}, 
              {q:'I am confident in management’s Integrity in carrying out vision with consistency.',h:''},
              {q:'I am grateful for management’s support of my professional development and showing recognition',h:''},
              {q:'I appreciate management’s attempts to collaborate with employees in relevant decisions.',h:''},
              {q:'I appreciate that there is caring for employees as individuals with personal lives.',h:''},       
              {q:'I am satisfied with the balanced treatment for all in terms of rewards.',h:''},
              {q:'I experience absence of favoritism in hiring and promotions.',h:''},
              {q:'I experience a lack of discrimination and process for appeals.',h:''},
              {q:'I am certain that people take pride in personal job, individual contributions.',h:''},
              {q:'I am proud of the work performed by the team.',h:''},
              {q:'I am proud of organizations products/services and branding in the industry.',h:''},
              {q:'I have the ability to be oneself.',h:''},
              {q:'I find the environment socially friendly and welcoming atmosphere.',h:''},
              {q:'I get a sense of "family" or "team".',h:''}
           ], 
      opt:['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      skill:false
  },  
  {
      tag:'Team Dynamics', 
      instruction_text: '', 
      ques:[
              {q:'My team is able to be vulnerable with one another, willing to admit their mistakes, acknowledge their weaknesses, and ask for help without hesitation.',h:''},
              {q:'My team challenges each other and understands that questioning the status quo is important to come to the best outcome.',h:''},
              {q:'My team is clear on objectives, aligned on priorities, and supports decisions made and plans of action even if there was initial disagreement.',h:''},
              {q:'My team consistently follows through on promises and commitments.',h:''},
              {q:'My team consistently achieves its objectives and has a reputation for high performance.',h:''}
           ], 
      opt:['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      skill:false
  },  
  {
      tag:'Management Experience', 
      instruction_text: '', 
      ques:[
              {q:'My manager informs the team about important issues and changes.',h:''},
              {q:'My manager communicates clear goals for our team.',h:''},
              {q:'My manager keeps the team focused on our priority results/deliverables.',h:''},
              {q:'My manager shows consideration for me as a person.',h:''},
              {q:'My manager gives me actionable feedback that helps me improve my performance.',h:''},
              {q:'My manager has positively influenced my growth and development.',h:''},
              {q:'My manager shows appreciation for good work and extra effort.',h:''}
           ], 
      opt:['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      skill:false
  },  
  {
      tag:'Behaviors', 
      instruction_text: '', 
      ques:[
              {q:'Positive “can-do” attitude',h:''},
              {q:'Courteous and Friendly',h:''},
              {q:'Meets Deadlines',h:''},
              {q:'Takes responsibility',h:''},
              {q:'Good attendance and Punctuality',h:''},
              {q:'Focus',h:''},
              {q:'Teamwork',h:''},
              {q:'Interpersonal Communication',h:''}
           ], 
      opt:['Significant growth needed', 'Some growth needed', 'Adequately demonstrates this behavior', 'Exemplifies', 'Exemplifies and successfully grows it in others'],
      skill:false
  },  
  {
      tag:'Skills', 
      instruction_text: '', 
      ques:[
              {q:'Software Engineering',h:''},
              {q:'Software Architecture',h:''},  
              {q:'Coding',h:''},  
              {q:'Test Driven Development',h:''},  
              {q:'Open Source Usage',h:''}
           ], 
      opt:['Significant growth needed', 'Some growth needed', 'Adequately exhibits this skill', 'Exemplifies', 'Exemplifies and successfully grows it in others'],
      skill:false
  }  
];

function getTagName(arrQAssessments) {
  var arrTagNames = [];

  for(i=0; i<arrQAssessments.length; i++) {
    arrTagNames.push(arrQAssessments[i].tag);
  }

  return arrTagNames;
}
_.each(templatesData, function(template){
  var name = template['name'];
  var dimensionList = getTagName(arrQAssessments); //template['dimensions'];
  var id = template['id'];
  var survey_type = template['role'];

  createTemplate(name, dimensionList, id, survey_type);
});