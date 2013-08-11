
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
     * Chrome Storage Backbone storage adapter
     *
     * @param keyNamespace storage namespace prefix
     * @param storageArea Storage area to use
     * @constructor
     */
    Backbone.ChromeStorage = function(keyNamespace, storageArea)
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
    Backbone.ChromeStorage.StorageArea =
    {
        SYNC: 'sync',
        LOCAL: 'local'
    };

    Backbone.ChromeStorage.prototype =
    {
        _keyNamespace: null,
        _chromeStorage: null,
        _recordIndex: [],

        /**
         * Get the Chrome storage namespace pointer
         *
         * @returns {Object} Chrome storage namespace object
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
         * Convert the model or collection input object
         * into two lists of models and model ids
         *
         * @param modelOrCollection Model or collection object
         * @param includeNullIdModels Include models with null or empty string ids
         * @returns {Array}
         * @private
         */
        _cloneModelOrCollection: function(modelOrCollection, includeNullIdModels)
        {
            var modelIdList = [];
            var modelList = [];

            if (modelOrCollection instanceof Backbone.Collection) {
                // Copy the list of models. This ensures that the async callback
                // does not end up with a different list once the get
                // call returns.
                for (var i = 0; i < modelOrCollection.models.length; i++) {
                    if (includeNullIdModels ||
                        (!includeNullIdModels && modelOrCollection.models[i].id != null && modelOrCollection.models[i].id != '')) {
                        modelIdList.push(modelOrCollection.models[i].id);
                        modelList.push(modelOrCollection.models[i]);
                    }
                }
            } else if (includeNullIdModels || (!includeNullIdModels && modelOrCollection.id != null && modelOrCollection.id != '')) {
                modelIdList.push(modelOrCollection.id);
                modelList.push(modelOrCollection);
            }

            return [modelIdList, modelList];
        },

        /**
         * Add or update an existing key/value pair in storage
         *
         * @param modelOrCollection Model of data to update
         * @param options Storage options
         * @private
         */
        _updateRecord: function(modelOrCollection, options)
        {
            var clonedModelOrCollection = this._cloneModelOrCollection(modelOrCollection, true);
            var modelList = clonedModelOrCollection[1];
            var i = 0;
            var data = {};

            function apiCallback() {
                // Notify callbacks if defined
                if (chrome.runtime.lastError == null && options.success != null) {
                    options.success(modelOrCollection);
                } else if (chrome.runtime.lastError != null && options.error != null) {
                    options.error(modelOrCollection, chrome.runtime.lastError);
                }
            }

            if (modelList.length > 0) {
                for (i = 0; i < modelList.length; i++) {
                    // Get or generate an Id
                    var id = modelList[i].id || this._generateUuid();
                    modelList[i].id = id;

                    // Update record index with new id if not found
                    if ($.inArray(id, this._recordIndex) == -1) {
                        this._recordIndex.push(id);
                    }

                    data[id] = modelList[i].attributes;
                }

                // Update index if adding, and add/update record
                data[this._keyNamespace] = this._recordIndex;
                this._getChromeStorage().set(data, apiCallback);
            }
        },

        /**
         * Remove the modelOrCollection from storage
         *
         * @param modelOrCollection Model of data to remove
         * @param options Storage options
         * @private
         */
        _deleteRecord: function(modelOrCollection, options)
        {
            var clonedModelOrCollection = this._cloneModelOrCollection(modelOrCollection, false);
            var modelIdList = clonedModelOrCollection[0];
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
                if (callbackCount == 2 && success && options.success != null) {
                    // Success
                    options.success(modelOrCollection);
                } else if (callbackCount == 2 && !success && options.error != null) {
                    // Error
                    options.error(modelOrCollection, errors);
                }
            }

            // Find record index position and remove for each model id
            for (var i = 0; i < modelIdList.length; i++) {
                var recordPosition = $.inArray(modelIdList[i].id, this._recordIndex);
                if (recordPosition != -1) {
                    this._recordIndex.splice(recordPosition, 1);
                }
            }

            if (modelIdList.length > 0) {
                // Update record index with item removed in storage
                var data = {};
                data[this._keyNamespace] = this._recordIndex;
                this._getChromeStorage().set(data, apiCallback);

                // Remove items from storage
                this._getChromeStorage().remove(modelIdList, apiCallback);
            } else if (options.error != null) {
                // Nothing to remove, notify error callback if defined
                options.error(modelOrCollection, 'Zero models to remove.');
            }
        },

        /**
         * Read modelOrCollection from storage
         *
         * @param modelOrCollection Model with id to read
         * @param options Storage options
         * @private
         */
        _readRecord: function(modelOrCollection, options)
        {
            // TODO: Read new models stored within chrome.storage by reading the recordindex and updating if a collection

            var clonedModelOrCollection = this._cloneModelOrCollection(modelOrCollection, false);
            var modelIdList = clonedModelOrCollection[0];
            var modelList = clonedModelOrCollection[1];

            function apiCallback(items) {
                if (chrome.runtime.lastError == null) {
                    // Update all the modelOrCollection attributes with the items retrieved
                    for (var i = 0; i < modelList.length; i++) {
                        modelList[i].set(items[modelIdList[i]]);
                    }

                    // Notify callback if defined
                    if (options.success != null) {
                        options.success(modelOrCollection);
                    }
                } else if (options.error != null) {
                    options.error(modelOrCollection, chrome.runtime.lastError);
                }
            }

            // If there are models to read, read them
            if (modelIdList.length > 0) {
                this._getChromeStorage().get(modelIdList, apiCallback);
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
