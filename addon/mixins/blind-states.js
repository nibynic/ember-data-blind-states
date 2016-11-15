export default {
  deleteRecord(internalModel) {
    internalModel.transitionTo(this.stateName + ".scheduledForDeletion");
  },

  scheduledForDeletion: {
    isScheduledForDeletion: true
  }
};
