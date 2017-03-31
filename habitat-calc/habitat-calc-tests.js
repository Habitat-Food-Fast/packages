// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by habitat-calc.js.
import { name as packageName } from "meteor/habitat-calc";

// Write your tests here!
// Here is an example.
Tinytest.add('habitat-calc - example', function (test) {
  test.equal(packageName, "habitat-calc");
});
