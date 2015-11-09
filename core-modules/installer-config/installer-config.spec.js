/*global it, describe*/
'use strict';

var ic = require('./installer-config');

var chai= require('chai');
var expect = chai.expect;

describe('installerConfig_expandTemplate', function(){
	it('should exapand a simple tample', function(){

		var returned = ic._expandTemplate('hello <%= user %>!',{user:'sami kabai'});
		expect(returned).to.be.equal('hello sami kabai!');
	});

	it('should exapand a nested template', function(){
		var returned = ic._expandTemplate('hello <%= user %>!',{user:'<%= secret %>',secret:'sami kabai2'});
		expect(returned).to.be.equal('hello sami kabai2!');
	});

	it('should work with prototyped heirarchy', function(){
		var prot={secret:'sami kabai3'};
		var child=Object.create(prot);
		prot.user='<%= secret %>';
		var returned = ic._expandTemplate('hello <%= user %>!',child);
		expect(returned).to.be.equal('hello sami kabai3!');
	});
});

describe('installerConfig_setUserSettings and Get', function(){
	it('should get what we set', function(){
		var someval={dani:{is:'a',good:['boy']}};
		ic.setUserSettings({userkey:someval});
		someval.bob='not';
		ic.setUserSettings({userkey:{bob:'not'}});
		var returned=ic.getUnexpandedValue('user.userkey');
		expect(returned).to.deep.equal(someval);
	})
});
