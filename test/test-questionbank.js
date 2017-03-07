var request = require('supertest'),
    express = require('express');

process.env.NODE_ENV = 'test';

var app = require('../app.js');
var _id = '';


describe('POST New Questionbank', function(){
  it('creates new questionbank and responds with json success message', function(done){
    request(app)
        .post('/api/questionbank')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({"questionbank": {}})
    .expect(201)
    .end(function(err, res) {
      if (err) {
        throw err;
      }
      _id = res.body._id;
      done();
    });
});
});

describe('GET List of Questionbanks', function(){
  it('responds with a list of questionbank items in JSON', function(done){
    request(app)
        .get('/api/questionbanks')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
  });
});

describe('GET Questionbank by ID', function(){
  it('responds with a single questionbank item in JSON', function(done){
    request(app)
        .get('/api/questionbank/'+ _id )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
  });
});


describe('PUT Questionbank by ID', function(){
  it('updates questionbank item in return JSON', function(done){
    request(app)
        .put('/api/questionbank/'+ _id )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({ "questionbank": { "title": "Hell Is Where There Are No Robots" } })
        .expect(200, done);
  });
});

describe('DELETE Questionbank by ID', function(){
  it('should delete questionbank and return 200 status code', function(done){
    request(app)
        .del('/api/questionbank/'+ _id)
        .expect(204, done);
  });
});