// Copyright 2010 Google Inc. All Rights Reserved.
// Author: jacobsa@google.com (Aaron Jacobs)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Helper functions for registering gjstest test cases. Use it as follows:
//
//     /** @constructor */
//     function MyTestFixture() {
//       // This constructor will be called for each test. Do per-test setup
//       // here.
//       this.objectUnderTest_ = ...;
//     }
//     registerTestSuite(MyTestFixture);
//
//     // Add a test case named ReturnsFalse to the fixture. The full name of
//     // test, as reported in the test output, is MyTestFixture.ReturnsFalse.
//     addTest(MyTestFixture, function ReturnsFalse() {
//       expectFalse(this.objectUnderTest_.bar());
//     });
//

/**
 * Register a test constructor to be executed by the test runner.
 *
 * Any enumerable property of ctor.prototype will be treated as a test function,
 * unless:
 *
 *  *  The property's value is not a function.
 *
 *  *  The property's name ends with an underscore. Use this to create private
 *     helper functions.
 *
 *  *  The property's name is 'tearDown'.
 *
 * If you use the addTest function below to add test functions, you do not need
 * to worry about these constraints.
 *
 * @param {!Function} ctor
 *     A constructor for the test suite class.
 */
gjstest.registerTestSuite = function(ctor) {
  if (!(ctor instanceof Function)) {
    throw new TypeError('registerTestSuite() requires a function');
  }

  // Make sure this constructor hasn't already been registered.
  if (gjstest.internal.testSuites.indexOf(ctor) != -1) {
    throw new Error('Test suite already registered: ' + ctor.name);
  }

  gjstest.internal.testSuites.push(ctor);
};

/**
 * Add a test function to the supplied test suite. The function's name is used
 * to decide on the test name, so it should have one (see the top of the file
 * for an example). The name may be any legal identifier, including 'tearDown'
 * and magic properties like 'constructor'.
 *
 * @param {!Function} testSuite
 *     The test suite class, which must have previously been registered with
 *     registerTestSuite.
 *
 * @param {!Function} testFunc
 *     The test function.
 */
gjstest.addTest = function(testSuite, testFunc) {
  // TODO
};

////////////////////////////////////////////////////////////////////////
// Implementation details
////////////////////////////////////////////////////////////////////////

/**
 * A list of test suites that have been registered.
 * @type {!Array.<!Function>}
 */
gjstest.internal.testSuites = [];

/**
 * Given a constructor and the name of a test method on that contructor, return
 * a function that will execute the test.
 *
 * @param {!Function} ctor
 * @param {string} propertyName
 * @return {function()}
 *
 * @private
 */
gjstest.internal.makeTestFunction_ = function(ctor, propertyName) {
  return function() {
    // Run the test, making sure we run the tearDown method, if any, regardless
    // of whether an error is thrown.
    try {
      var instance = new ctor();
      instance[propertyName]();
    } finally {
      // NOTE(jacobsa): We quote 'tearDown' to stop the complaining the JS
      // compiler does as of 2011-01-19.
      var tearDown = instance && instance['tearDown'];
      tearDown && tearDown.apply(instance);
    }
  };
};

/**
 * Given a constructor registered with registerTestSuite, return a map from full
 * test names (e.g. FooTest.doesBar) to functions that can be executed to run
 * the particular test.
 *
 * @param {!Function} ctor
 * @return {!Object.<function()>}
 */
gjstest.internal.getTestFunctions = function(ctor) {
  var result = {};

  function addTestFunction(name) {
    // Compute the full name for the test, and create a function that performs
    // the appropriate test.
    var fullName = ctor.name + '.' + name;
    result[fullName] = gjstest.internal.makeTestFunction_(ctor, name);
  }

  for (var name in ctor.prototype) {
    // Skip this property if it's private or the tearDown method.
    if (/_$/.test(name) || name == 'tearDown') continue;

    // Skip this property if it's inherited or not a function.
    if (!ctor.prototype.hasOwnProperty(name) ||
        !(ctor.prototype[name] instanceof Function)) {
      continue;
    }

    addTestFunction(name);
  }

  // A test case called 'constructor' is not picked up in the for loop above
  // because 'constructor' is a property automatically defined on ctor.prototype
  // that is not enumerable. See http://b/4992467.
  if (ctor.prototype['constructor'] != ctor &&
      ctor.prototype.hasOwnProperty('constructor') &&
      ctor.prototype['constructor'] instanceof Function) {
    addTestFunction('constructor');
  }

  return result;
};
