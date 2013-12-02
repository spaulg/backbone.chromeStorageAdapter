
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

(function() {
    'use strict';

    /**
     * jQuery inArray alternative
     *
     * @param key Array key to be found
     * @param list Array to search
     * @returns {number} Position within array or -1 if not found
     */
    function inArray(key, list) {
        for (var i = 0; i < list.length; i++) {
            if (i in list && list[i] === key) {
                return i;
            }
        }

        return -1;
    }

    /**
     * chrome.storage Backbone storage adapter
     *
     * @param keyNamespace storage namespace prefix
     * @param {string=} storageArea Storage area to use
     * @constructor
     */
    Backbone.ChromeStorageAdapter = function(keyNamespace, storageArea)
    {
        if (typeof keyNamespace == 'string' && keyNamespace != '') {
            this._keyNamespace = keyNamespace;
        } else {
            throw new TypeError('Invalid key namespace.');
        }

        // Apply storage area
        if (storageArea == 'local' || storageArea == null) {
            this._chromeStorage = chrome.storage.local;
        } else if (storageArea == 'sync') {
            this._chromeStorage = chrome.storage.sync;
        } else {
            throw new TypeError('Invalid storage area declaration.');
        }
    };

    /**
     * Enum for StorageArea type. Should be when declaring
     * the storage area when constructing the storage adapter
     */
    Backbone.ChromeStorageAdapter.StorageArea =
    {
        SYNC: 'sync',
        LOCAL: 'local'
    };

    Backbone.ChromeStorageAdapter.prototype =
    {
        _keyNamespace: null,
        _chromeStorage: null,
        _recordIndex: [],

        /**
         * Get the chrome.storage.* namespace pointer
         *
         * @returns {Object} chrome.storage.* namespace object
         * @private
         */
        _getChromeStorage: function()
        {
            return this._chromeStorage;
        },

        /**
         * Generate a unique UUID for use as a key
         *
         * @returns {string} Unique UUID
         * @private
         */
        _generateUuid: function()
        {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },

        /**
         * Add or update an existing model in storage
         *
         * @param model Model of data to update
         * @param options Storage options
         * @private
         */
        _updateRecord: function(model, options)
        {
            function apiCallback() {
                // Notify callbacks if defined
                if (chrome.runtime.lastError == null) {
                    var attributes = model.attributes;
                    options.success(attributes);
                } else {
                    options.error(chrome.runtime.lastError);
                }
            }

            // Get or generate an Id
            var id = model.id || this._generateUuid();
            model.id = id;

            // Update record index with new id if not found
            if (inArray(id, this._recordIndex) == -1) {
                this._recordIndex.push(id);
            }

            // Update index if adding, and add/update record
            var data = {};
            data[this._keyNamespace] = this._recordIndex;
            data[id] = model.attributes;

            // Trigger request event
            model.trigger('request', model, data, options);

            // Set data
            this._getChromeStorage().set(data, apiCallback);
        },

        /**
         * Remove a model from storage
         *
         * @param model Model of data to remove
         * @param options Storage options
         * @private
         */
        _deleteRecord: function(model, options)
        {
            var callbackCount = 0;
            var success = true;
            var errors = [];

            function apiCallback() {
                callbackCount++;

                // Check if an error occurred
                if (chrome.runtime.lastError != null) {
                    success = false;
                    errors.push(chrome.runtime.lastError);
                }

                // Notify callbacks if defined
                if (callbackCount == 2 && success) {
                    // Success
                    options.success({});
                } else if (callbackCount == 2 && !success) {
                    // Error
                    options.error(errors);
                }
            }

            // If the model has an id, attempt to remove it from storage
            if (!model.isNew()) {
                // Find record index position and remove
                var recordPosition = inArray(model.id, this._recordIndex);
                if (recordPosition >= 0) {
                    this._recordIndex.splice(recordPosition, 1);
                }

                // Trigger request event
                model.trigger('request', model, model.id, options);

                // Update record index with item removed in storage
                var data = {};
                data[this._keyNamespace] = this._recordIndex;
                this._getChromeStorage().set(data, apiCallback);

                // Remove item from storage
                this._getChromeStorage().remove([model.id], apiCallback);
            } else {
                // Nothing to remove, notify error callback if defined
                options.error('Model id is not defined');
            }
        },

        /**
         * Read a model or collection from storage
         *
         * @param modelOrCollection Model with id to read
         * @param options Storage options
         * @private
         */
        _readRecord: function(modelOrCollection, options)
        {
            var that = this;

            function recordReadCallback(items) {
                if (chrome.runtime.lastError == null) {
                    // Format items into object to pass to success
                    // and reply to success callback with resp
                    var resp = [];

                    for (var key in items) {
                        resp.push(items[key]);
                    }

                    options.success(resp);
                } else {
                    options.error(chrome.runtime.lastError);
                }
            }

            function recordIndexReadCallback(items) {
                if (chrome.runtime.lastError == null) {
                    // Attempt to read all records for all id's in the record index
                    var recordIndex = items[that._keyNamespace] || null;

                    // Trigger request event
                    modelOrCollection.trigger('request', modelOrCollection, [recordIndex], options);

                    // Get data
                    if (recordIndex == null) {
                        // No records to retrieve, fire read callback with zero results
                        recordReadCallback({});
                    } else {
                        that._getChromeStorage().get(recordIndex, recordReadCallback);
                    }
                } else {
                    options.error(chrome.runtime.lastError);
                }
            }

            if (modelOrCollection instanceof Backbone.Collection) {
                // Update record index with item removed in storage
                this._getChromeStorage().get([this._keyNamespace], recordIndexReadCallback);
            } else {
                // Trigger request event
                modelOrCollection.trigger('request', modelOrCollection, [this._keyNamespace], options);

                // Get data
                this._getChromeStorage().get([modelOrCollection.id], recordReadCallback);
            }
        },

        /**
         * Implement Backbone.sync function signature.
         *
         * @param method Sync method
         * @param modelOrCollection Backbone model or collection
         * @param options Options
         */
        sync: function(method, modelOrCollection, options)
        {
            switch (method) {
                case 'update':  return this._updateRecord(modelOrCollection, options);
                case 'create':  return this._updateRecord(modelOrCollection, options);
                case 'read':    return this._readRecord(modelOrCollection, options);
                case 'delete':  return this._deleteRecord(modelOrCollection, options);
            }

            throw new TypeError('Unknown method ' + method + ' in sync');
        }
    };
})();
