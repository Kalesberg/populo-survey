var request = require('supertest'),
    express = require('express');

process.env.NODE_ENV = 'test';

var app = require('../app.js');
var _id = '';


describe('POST New Template', function(){
  it('creates new template and responds with json success message', function(done){
    request(app)
        .post('/api/template')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({"template": {}})
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

describe('GET List of Templates', function(){
  it('responds with a list of template items in JSON', function(done){
    request(app)
        .get('/api/templates')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
  });
});

describe('GET Template by ID', function(){
  it('responds with a single template item in JSON', function(done){
    request(app)
        .get('/api/template/'+ _id )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200, done);
  });
});


describe('PUT Template by ID', function(){
  it('updates template item in return JSON', function(done){
    request(app)
        .put('/api/template/'+ _id )
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .send({ "template": { "title": "Hell Is Where There Are No Robots" } })
        .expect(200, done);
  });
});

describe('DELETE Template by ID', function(){
  it('should delete template and return 200 status code', function(done){
    request(app)
        .del('/api/template/'+ _id)
        .expect(204, done);
  });
});