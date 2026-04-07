const fs = require('fs');

// Simple mock for browser
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};
global.document = {
  getElementById: (id) => ({ 
    style: {}, 
    classList: { add: ()=>{}, remove: ()=>{}, replace: ()=>{} }, 
    innerText: '', 
    value: '', 
    addEventListener: ()=>{},
    onclick: () => {},
    options: []
  }),
  querySelectorAll: () => [],
  createElement: () => ({ classList: { add: ()=>{} }, style: {}, appendChild: () => {} }),
  querySelector: () => ({ innerHTML: '' })
};
global.window = { innerWidth: 1024, onload: null };
global.Chart = class { constructor() {} destroy() {} };

const code = fs.readFileSync('build/app.js', 'utf8');
eval(code);

console.log("App loaded. Running init()...");
App.init();

console.log("Testing Login...");
const submitEvent = { preventDefault: () => {} };
document.getElementById('login-user').value = 'admin';
document.getElementById('login-pass').value = 'gym@2024';
document.getElementById('login-remember').checked = true;

document.getElementById('login-form').onsubmit(submitEvent);
console.log("Login submitted.");
