
/*
 Copyright 2013 Simon Paulger <spaulger@codezen.co.uk>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var localStorageSpace = (localStorageSpace) ? localStorageSpace : {};

describe('A check to confirm models', function() {
    // Reset local storage space
    localStorageSpace = {};

    var Model = Backbone.Model.extend({
        success: false,
        failure: false,

        initialize: function() {
            this.chromeStorage = new Backbone.ChromeStorageAdapter('testNamespace', Backbone.ChromeStorageAdapter.StorageArea.LOCAL);
        },

        sync: function(method, model, options) {
            return this.chromeStorage.sync(method, model, options);
        }
    });
    var modelInstance = new Model();

    function successCallback()
    {
        modelInstance.success = true;
    }

    function errorCallback()
    {
        modelInstance.failure = true;
    }

    it('can be added to local storage', function() {
        runs(function() {
            modelInstance.save({test: 'added'}, {success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            // Confirm the model data is in the chrome storage space object
            expect(localStorageSpace[modelInstance.id]).not.toBe(null);
            expect(localStorageSpace[modelInstance.id]['test']).toBe('added');

            // Reset flag
            modelInstance.success = false;
        });
    });

    it('can be updated to local storage', function() {
        runs(function() {
            modelInstance.save({test: 'updated'}, {success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            // Confirm the model data is in the chrome storage space object
            expect(localStorageSpace[modelInstance.id]).not.toBe(null);
            expect(localStorageSpace[modelInstance.id]['test']).toBe('updated');

            // Reset flag
            modelInstance.success = false;
        });
    });

    it('can be retrieved from local storage', function() {
        runs(function() {
            localStorageSpace[modelInstance.id]['test'] = 'updated again';
            modelInstance.fetch({success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            // Confirm the model data is in the chrome storage space object
            expect(localStorageSpace[modelInstance.id]).not.toBe(null);
            expect(localStorageSpace[modelInstance.id]['test']).toBe('updated again');

            // Reset flag
            modelInstance.success = false;
        });
    });

    it('can be removed from local storage', function() {
        runs(function() {
            modelInstance.destroy({success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            expect(localStorageSpace[modelInstance.id]).toBe(undefined);

            // Reset flag
            modelInstance.success = false;
        });
    });
});

describe('A check to confirm models', function() {
    // Reset local storage space
    localStorageSpace = {};

    var Model = Backbone.Model.extend({
        success: false,
        failure: false,

        initialize: function() {
            this.chromeStorage = new Backbone.ChromeStorageAdapter('testNamespace', Backbone.ChromeStorageAdapter.StorageArea.LOCAL);
        },

        sync: function(method, model, options) {
            return this.chromeStorage.sync(method, model, options);
        }
    });
    var modelInstance = new Model();

    function successCallback()
    {
        modelInstance.success = true;
    }

    function errorCallback()
    {
        modelInstance.failure = true;
    }

    it('can be added to sync storage', function() {
        runs(function() {
            modelInstance.save({test: 'added'}, {success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            // Confirm the model data is in the chrome storage space object
            expect(localStorageSpace[modelInstance.id]).not.toBe(null);
            expect(localStorageSpace[modelInstance.id]['test']).toBe('added');

            // Reset flag
            modelInstance.success = false;
        });
    });

    it('can be updated to sync storage', function() {
        runs(function() {
            modelInstance.save({test: 'updated'}, {success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            // Confirm the model data is in the chrome storage space object
            expect(localStorageSpace[modelInstance.id]).not.toBe(null);
            expect(localStorageSpace[modelInstance.id]['test']).toBe('updated');

            // Reset flag
            modelInstance.success = false;
        });
    });

    it('can be retrieved from sync storage', function() {
        runs(function() {
            localStorageSpace[modelInstance.id]['test'] = 'updated again';
            modelInstance.fetch({success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            // Confirm the model data is in the chrome storage space object
            expect(localStorageSpace[modelInstance.id]).not.toBe(null);
            expect(localStorageSpace[modelInstance.id]['test']).toBe('updated again');

            // Reset flag
            modelInstance.success = false;
        });
    });

    it('can be removed from sync storage', function() {
        runs(function() {
            modelInstance.destroy({success: successCallback, error: errorCallback});
        });

        waitsFor(function() {
            return modelInstance.success;
        }, 'model instance success callback not executed', 1000);

        runs(function() {
            // In addition to a the successful call being made, expect no failures to have occurred
            // and that an id has been assigned to the model
            expect(modelInstance.failure).toBe(false);
            expect(modelInstance.id).not.toBe(null);

            expect(localStorageSpace[modelInstance.id]).toBe(undefined);

            // Reset flag
            modelInstance.success = false;
        });
    });
});
