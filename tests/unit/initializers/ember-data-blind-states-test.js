import Ember from 'ember';
import { initialize as runInitializer } from 'dummy/initializers/ember-data-blind-states';
import { module, test } from 'qunit';
import { setupStore } from '../../helpers/store';
import DS from "ember-data";

var Person, store, env;

module('Unit | Initializer | ember data blind states', {
  beforeEach() {
    runInitializer();

    Person = DS.Model.extend({
      firstName: DS.attr('string'),
      lastName:  DS.attr('string'),
      fullName: Ember.computed("firstName", "lastName", function() {
        return this.get("firstName") + " " + this.get("lastName");
      })
    });

    env = setupStore({
      person: Person
    });
    store = env.store;
  },

  afterEach() {
    Ember.run(function() {
      store.destroy();
    });
    Person = null;
    store = null;
  }
});

test('it allows to destroy record while in loaded.created.inFlight state', function(assert) {
  let subject, finishSave, didCallDelete;

  env.adapter.createRecord = function() {
    return new Ember.RSVP.Promise(function(resolve) {
      finishSave = resolve;
    });
  };

  env.adapter.deleteRecord = function() {
    didCallDelete = true;
    return Ember.RSVP.resolve();
  };

  Ember.run(function() {
    subject = store.createRecord("person");
    subject.save();
    subject.blindlyDeleteRecord();
  });

  assert.ok(true, "should not throw error when deleting record");
  assert.equal(subject.get("isDeleted"), false, "record should not be marked as deleted");
  assert.equal(subject.get("isBlindlyDeleted"), true, "record should be marked as blindlyDeleted");
  assert.equal(subject.get("isVirtuallyDeleted"), true, "record should be marked as virtuallyDeleted");

  Ember.run(function() {
    finishSave({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          firstName: "John",
          lastName: "Smith"
        }
      }
    });
  });

  assert.equal(subject.get("isDeleted"), true, "after save record should be marked as deleted");
  assert.equal(subject.get("isBlindlyDeleted"), false, "after save record should not be marked as blindlyDeleted");
  assert.equal(subject.get("isVirtuallyDeleted"), true, "after save record should be marked as virtuallyDeleted");

  Ember.run(function() {
    subject.save();
  });

  assert.ok(didCallDelete, "second save should call deleteRecord");

});

test('it allows to destroy record while in loaded.updated.inFlight state', function(assert) {
  let subject, finishSave, didCallDelete;

  env.adapter.updateRecord = function() {
    return new Ember.RSVP.Promise(function(resolve) {
      finishSave = resolve;
    });
  };

  env.adapter.deleteRecord = function() {
    didCallDelete = true;
    return Ember.RSVP.resolve();
  };

  Ember.run(function() {
    store.push({
      data: {
        type: 'person',
        id: '1',
        attributes: {
          firstName: "John",
          lastName: "Smith"
        }
      }
    });
    subject = store.peekRecord("person", 1);
    subject.save();
    subject.blindlyDeleteRecord();
  });

  assert.ok(true, "should not throw error when deleting record");
  assert.equal(subject.get("isDeleted"), false, "record should not be marked as deleted");
  assert.equal(subject.get("isBlindlyDeleted"), true, "record should be marked as blindlyDeleted");
  assert.equal(subject.get("isVirtuallyDeleted"), true, "record should be marked as virtuallyDeleted");

  Ember.run(function() {
    finishSave();
  });

  assert.equal(subject.get("isDeleted"), true, "after save record should be marked as deleted");
  assert.equal(subject.get("isBlindlyDeleted"), false, "after save record should not be marked as blindlyDeleted");
  assert.equal(subject.get("isVirtuallyDeleted"), true, "after save record should be marked as virtuallyDeleted");

  Ember.run(function() {
    subject.save();
  });

  assert.ok(didCallDelete, "second save should call deleteRecord");

});
