import DS from "ember-data";
import Ember from "ember";

var blindlyDeleted = {
  isBlindlyDeleted: true,

  didCommit(internalModel) {
    this.parentState.didCommit(internalModel);
    internalModel.send("deleteRecord");
  }
};

var inFlight = {
  blindlyDeleteRecord(internalModel) {
    internalModel.transitionTo(this.stateName.replace(/root\./, "") + ".blindlyDeleted");
  }
};

function mixin(original, ...hashes) {
  for (var hash of hashes) {
    for (var prop in hash) {
      original[prop] = hash[prop];
    }
  }
  return original;
}


function extendState(parent) {
  mixin(parent, inFlight, {
    blindlyDeleted: mixin({}, parent, blindlyDeleted, {
      parentState: parent,
      stateName: parent.stateName + ".blindlyDeleted"
    })
  });
}

var modelMixin = {
  blindlyDeleteRecord() {
    this._internalModel.blindlyDeleteRecord();
  },

  isBlindlyDeleted: Ember.computed('currentState', function(key) {
    return Ember.get(this._internalModel.currentState, key);
  }).readOnly(),

  isVirtuallyDeleted: Ember.computed.or("isDeleted", "isBlindlyDeleted").readOnly()
};

var internalModelMixin = {
  blindlyDeleteRecord() {
    try {
      this.send("deleteRecord");
    } catch (e) {
      this.send("blindlyDeleteRecord");
    }
  }
};


export function initialize(/* application */) {
  DS.Model.reopen(modelMixin);
  mixin(DS.InternalModel.prototype, internalModelMixin);
  extendState(DS.RootState.loaded.created.inFlight);
  extendState(DS.RootState.loaded.updated.inFlight);
  DS.RootState.isBlindlyDeleted = false;
}

export default {
  name: 'ember-data-blind-states',
  initialize
};
