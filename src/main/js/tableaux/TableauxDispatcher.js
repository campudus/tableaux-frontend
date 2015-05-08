var eventCallbacksStore = {};
var callbackIds = 0;

function nextId() {
  return callbackIds++;
}

function register(event, callback) {
  var id = nextId();

  eventCallbacksStore[event] = eventCallbacksStore[event] || [];
  eventCallbacksStore[event].push({id : id, fn : callback});

  return {id : id, event : event};
}

function unregister(token) {
  var i;
  for (i = 0; i < eventCallbacksStore[token.event].length; i++) {
    if (eventCallbacksStore[token.event][i].id === token.id) {
      eventCallbacksStore[token.event].splice(i, 1);
    }
  }
}

function emit(event, payload) {
  var i;
  var cbStore = eventCallbacksStore[event] || [];
  for (i = 0; i < cbStore.length; i++) {
    cbStore[i].fn(payload);
  }
}

module.exports = {
  register : register,
  unregister : unregister,
  emit : emit
};
