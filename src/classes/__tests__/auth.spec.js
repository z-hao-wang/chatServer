"use strict"
jest.dontMock('../auth');
jest.dontMock('mongoose');
var Auth = require('../auth');
var User = require('../../models/user');

var user1 = {
  username: "user1",
  password: "abc112"
};

beforeEach(function(done) {
   
});
    
var auth = new Auth();
describe('auth class', function () {

  it('auth genToken success', function () {
    var res = auth.genToken(user1.username);
    expect(res.token).toBeTruthy();
    expect(res.expires).toBeTruthy();
  });
  
  it('auth decodeToken success', function () {
    var res = auth.genToken(user1.username);
    var decoded = auth.decodeToken(res.token);
    expect(decoded.iss).toEqual(user1.username);
    expect(decoded.exp).toBeTruthy();
  });
  
  it('register success', function () {
    //mock exists
    auth.userExists = jest.genMockFunction().mockImplementation(function(data, cb) {
      cb(0); // assume user does not exist
    });
    var cb = jest.genMockFunction();
    var res = auth.register(user1, cb);
    expect(cb).toBeCalled();
  });
  
  it('register fail if user exists', function () {
    //mock exists
    auth.userExists = jest.genMockFunction().mockImplementation(function(data, cb) {
      cb(1); // assume user does not exist
    });
    var cb = jest.genMockFunction();
    var res = auth.register(user1, cb);
    expect(cb).toBeCalledWith({err: 1});
  });
  
});