/*global it, describe*/
'use strict';

var notif = require('./notifications');

var chai= require('chai');
var expect = chai.expect;

describe('notifications module', function(){
	it('should push and pull notifications', function(){
		notif.pushNotification('hello');
		notif.pushNotification('world');
		var returned = notif.getNotificationsFromIdx(0);
		expect(returned).to.be.deep.equal(['hello','world']);
	});
});
